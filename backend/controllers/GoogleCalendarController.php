<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Services\GoogleCalendarService;
use App\Config\Database;

class GoogleCalendarController
{
    /**
     * Start OAuth flow - redirect to Google.
     */
    public function connect(): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $companyId = (int) ($_GET['company_id'] ?? 0);
        if (!$companyId) json_err('Company ID required', 422);

        // Verify user belongs to company with correct role
        $db = Database::pdo();
        $stmt = $db->prepare("
            SELECT r.name FROM company_user cu
            JOIN roles r ON r.id = cu.role_id
            WHERE cu.user_id = ? AND cu.company_id = ?
            LIMIT 1
        ");
        $stmt->execute([$uid, $companyId]);
        $role = $stmt->fetchColumn();

        if (!in_array($role, ['owner', 'admin'], true)) {
            json_err('Only owner or admin can connect Google Calendar', 403);
        }

        try {
            $service = new GoogleCalendarService();
            $authUrl = $service->getAuthUrl($uid, $companyId);

            header('Location: ' . $authUrl);
            exit;
        } catch (\Throwable $e) {
            error_log('Google connect failed: ' . $e->getMessage());
            json_err('Failed to start Google auth: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Handle OAuth callback from Google.
     */
    public function callback(): void
    {
        $code = $_GET['code'] ?? '';
        $state = $_GET['state'] ?? '';
        $error = $_GET['error'] ?? '';

        $frontendUrl = $_ENV['FRONTEND_URL'] ?? 'http://localhost:5173';

        if ($error) {
            header('Location: ' . $frontendUrl . '/admin/settings?google=error&message=' . urlencode($error));
            exit;
        }

        if (!$code || !$state) {
            header('Location: ' . $frontendUrl . '/admin/settings?google=error&message=missing_code');
            exit;
        }

        $data = json_decode(base64_decode($state), true);
        $userId = (int) ($data['user_id'] ?? 0);
        $companyId = (int) ($data['company_id'] ?? 0);

        if (!$userId || !$companyId) {
            header('Location: ' . $frontendUrl . '/admin/settings?google=error&message=invalid_state');
            exit;
        }

        try {
            $service = new GoogleCalendarService();
            $token = $service->handleCallback($code);
            $service->saveToken($userId, $companyId, $token);

            header('Location: ' . $frontendUrl . '/admin/settings?google=success');
            exit;
        } catch (\Throwable $e) {
            error_log('Google callback failed: ' . $e->getMessage());
            header('Location: ' . $frontendUrl . '/admin/settings?google=error&message=' . urlencode($e->getMessage()));
            exit;
        }
    }

    /**
     * Check if Google Calendar is connected.
     */
    public function status(): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $companyId = (int) ($_GET['company_id'] ?? 0);
        if (!$companyId) json_err('Company ID required', 422);

        $service = new GoogleCalendarService();
        $connected = $service->isConnected($uid, $companyId);

        json_ok([
            'connected' => $connected,
        ]);
    }

    /**
     * Disconnect Google Calendar.
     */
    public function disconnect(): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $input = input();
        $companyId = (int) ($input['company_id'] ?? 0);
        if (!$companyId) json_err('Company ID required', 422);

        $service = new GoogleCalendarService();
        $service->disconnect($uid, $companyId);

        json_ok(['message' => 'Google Calendar disconnected']);
    }
}