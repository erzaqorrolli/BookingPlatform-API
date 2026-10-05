<?php

declare(strict_types=1);

namespace App\Services;

use App\Config\Database;
use Google\Client;
use Google\Service\Calendar;

use Google\Service\Calendar\Event;
use Google\Service\Calendar\EventDateTime;

class GoogleCalendarService
{
    private Client $client;

    public function __construct()
    {
        $this->client = new Client();
        $this->client->setClientId($_ENV['GOOGLE_CLIENT_ID'] ?? '');
        $this->client->setClientSecret($_ENV['GOOGLE_CLIENT_SECRET'] ?? '');
        $this->client->setRedirectUri($_ENV['GOOGLE_REDIRECT_URI'] ?? '');
        $this->client->addScope(Calendar::CALENDAR);
        $this->client->setAccessType('offline');
        $this->client->setPrompt('consent');
    }

    public function getAuthUrl(int $userId, int $companyId): string
    {
        $state = base64_encode(json_encode([
            'user_id' => $userId,
            'company_id' => $companyId,
        ]));

        $this->client->setState($state);
        return $this->client->createAuthUrl();
    }

    public function handleCallback(string $code): array
    {
        $token = $this->client->fetchAccessTokenWithAuthCode($code);

        if (isset($token['error'])) {
            throw new \RuntimeException('Google auth error: ' . ($token['error'] ?? 'unknown error'));
        }

        return $token;
    }

    public function saveToken(int $userId, int $companyId, array $token): void
    {
        $db = Database::pdo();
        $expiresAt = date('Y-m-d H:i:s', time() + ($token['expires_in'] ?? 3600));

        $sql = "INSERT INTO google_calendar_tokens (user_id, company_id, access_token, refresh_token, expires_at)
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    access_token = VALUES(access_token),
                    refresh_token = COALESCE(VALUES(refresh_token), refresh_token),
                    expires_at = VALUES(expires_at),
                    updated_at = NOW()";

        $statement = $db->prepare($sql);
        $statement->execute([
            $userId,
            $companyId,
            $token['access_token'],
            $token['refresh_token'] ?? null,
            $expiresAt,
        ]);
    }

    public function getToken(int $userId, int $companyId): ?array
    {
        $db = Database::pdo();
        $stmt = $db->prepare("SELECT * FROM google_calendar_tokens WHERE user_id = ? AND company_id = ? LIMIT 1");

        $stmt->execute([$userId, $companyId]);
        $row = $stmt->fetch();

        if (!$row) {
            return null;
        }

        if (strtotime((string) $row['expires_at']) < time() && !empty($row['refresh_token'])) {
            try {
                $this->client->refreshToken($row['refresh_token']);
                $newToken = $this->client->getAccessToken();

                if ($newToken && isset($newToken['access_token'])) {
                    $this->saveToken($userId, $companyId, $newToken);
                    $row['access_token'] = $newToken['access_token'];
                    $row['expires_at'] = date('Y-m-d H:i:s', time() + ($newToken['expires_in'] ?? 3600));
                }
            } catch (\Throwable $e) {
                error_log('Token refresh failed: ' . $e->getMessage());
                return null;
            }
        }

        return $row;
    }

    public function isConnected(int $userId, int $companyId): bool
    {
        return $this->getToken($userId, $companyId) !== null;
    }

    public function disconnect(int $userId, int $companyId): void
    {
        $db = Database::pdo();
        $db->prepare("DELETE FROM google_calendar_tokens WHERE user_id = ? AND company_id = ?")->execute([$userId, $companyId]);
    }

    private function getOwnerId(int $companyId): ?int
    {
        $db = Database::pdo();
        $stmt = $db->prepare("SELECT u.id FROM company_user cu
            JOIN users u ON u.id = cu.user_id
            JOIN roles r ON r.id = cu.role_id
            WHERE cu.company_id = ? AND r.name = 'owner' LIMIT 1");

        $stmt->execute([$companyId]);
        $ownerId = $stmt->fetchColumn();
        return $ownerId ? (int) $ownerId : null;
    }

    public function createEvent(int $companyId, array $booking): ?string
    {
        $ownerId = $this->getOwnerId($companyId);
        if (!$ownerId) {
            return null;
        }

        $token = $this->getToken($ownerId, $companyId);
        if (!$token) {
            return null;
        }

        try {
            $this->client->setAccessToken($token['access_token']);
            $service = new Calendar($this->client);
            $startDateTime = $booking['booking_date'] . 'T' . $booking['start_time'];
            $endDateTime = $booking['booking_date'] . 'T' . $booking['end_time'];

            $description = "Reference: {$booking['reference']}\n"
                . "Customer: {$booking['customer_name']}\n"
                . "Email: {$booking['customer_email']}\n"
                . "Phone: " . ($booking['customer_phone'] ?? 'N/A') . "\n"
                . "Total:  €{$booking['total_price']}";

            if (!empty($booking['needs_assistance'])) {
                $description .= "\n\nPriority Client - Needs assistance";
            }

            $event = new Event([
                'summary' => $booking['service_name'] . ' - ' . $booking['customer_name'],
                'description' => $description,
                'start' => new EventDateTime([
                    'dateTime' => $startDateTime,
                    'timeZone' => 'Europe/Berlin',
                ]),
                'end' => new EventDateTime([
                    'dateTime' => $endDateTime,
                    'timeZone' => 'Europe/Berlin',
                ]),
                'reminders' => [
                    'useDefault' => false,
                    'overrides' => [
                        ['method' => 'email', 'minutes' => 24 * 60],
                        ['method' => 'popup', 'minutes' => 60],
                    ],
                ],
            ]);

            $created = $service->events->insert($token['calendar_id'], $event);
            return $created->getId();
        } catch (\Throwable $e) {
            error_log('Google Calendar create event failed: ' . $e->getMessage());
            return null;
        }
    }

    public function updateEvent(int $companyId, string $eventId, array $booking): bool
    {
        $ownerId = $this->getOwnerId($companyId);
        if (!$ownerId) {
            return false;
        }

        $token = $this->getToken($ownerId, $companyId);
        if (!$token) {
            return false;
        }

        try {
            $this->client->setAccessToken($token['access_token']);
            $service = new Calendar($this->client);

            $event = $service->events->get($token['calendar_id'], $eventId);

            $startDateTime = $booking['booking_date'] . 'T' . $booking['start_time'];
            $endDateTime = $booking['booking_date'] . 'T' . $booking['end_time'];

            $event->setStart(new EventDateTime([
                'dateTime' => $startDateTime,
                'timeZone' => 'Europe/Berlin',
            ]));
            $event->setEnd(new EventDateTime([
                'dateTime' => $endDateTime,
                'timeZone' => 'Europe/Berlin',
            ]));

            $service->events->update($token['calendar_id'], $eventId, $event);
            return true;
        } catch (\Throwable $e) {
            error_log('Google Calendar update event failed: ' . $e->getMessage());
            return false;
        }
    }

    public function deleteEvent(int $companyId, string $eventId): bool
    {
        $ownerId = $this->getOwnerId($companyId);
        if (!$ownerId) {
            return false;
        }

        $token = $this->getToken($ownerId, $companyId);
        if (!$token) {
            return false;
        }

        try {
            $this->client->setAccessToken($token['access_token']);
            $service = new Calendar($this->client);

            $service->events->delete($token['calendar_id'], $eventId);
            return true;
        } catch (\Throwable $e) {
            error_log('Google Calendar delete event failed: ' . $e->getMessage());
            return false;
        }
    }
}
