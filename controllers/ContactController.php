<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Models\ContactMessage;
use App\Models\User;
use App\Utils\Mailer;

class ContactController
{
    public function store(): void
    {
        $input = input();

        $name    = trim((string) ($input['name'] ?? ''));
        $email   = strtolower(trim((string) ($input['email'] ?? '')));
        $subject = trim((string) ($input['subject'] ?? ''));
        $message = trim((string) ($input['message'] ?? ''));

        if ($name === '') json_err('Name is required', 422);
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) json_err('Valid email required', 422);
        if ($subject === '') json_err('Subject is required', 422);
        if (strlen($message) < 10) json_err('Message must be at least 10 characters', 422);

        $contactMessage = ContactMessage::create([
            'name'    => $name,
            'email'   => $email,
            'subject' => $subject,
            'message' => $message,
        ]);

        try {
            $adminEmail = $_ENV['MAIL_FROM'] ?? 'info@bookwise.com';
            Mailer::send(
                $adminEmail,
                "Contact: $subject",
                "<p><strong>From:</strong> $name &lt;$email&gt;</p>
                 <p><strong>Subject:</strong> $subject</p>
                 <p><strong>Message:</strong></p>
                 <p>" . nl2br(htmlspecialchars($message)) . "</p>"
            );
        } catch (\Throwable $e) {
            error_log('Contact email failed: ' . $e->getMessage());
        }

        json_ok([
            'message' => 'Message sent successfully',
            'id'      => $contactMessage->id,
        ], 201);
    }

    public function index(): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $user = User::findById($uid);
        if (!$user || !$this->isSuperAdmin($user)) {
            json_err('Forbidden', 403);
        }

        $messages = ContactMessage::forAdmin([
            'status' => $_GET['status'] ?? null,
            'search' => $_GET['search'] ?? null,
        ]);

        json_ok(array_map(fn($m) => $m->toArray(), $messages));
    }

    public function show(array $params): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $user = User::findById($uid);
        if (!$user || !$this->isSuperAdmin($user)) {
            json_err('Forbidden', 403);
        }

        $message = ContactMessage::findById((int) $params['id']);
        if (!$message) json_err('Message not found', 404);

        // Shëno si read
        $message->markAsRead();

        json_ok($message->toArray());
    }

    public function update(array $params): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $user = User::findById($uid);
        if (!$user || !$this->isSuperAdmin($user)) {
            json_err('Forbidden', 403);
        }

        $message = ContactMessage::findById((int) $params['id']);
        if (!$message) json_err('Message not found', 404);

        $input = input();

        if (!empty($input['status'])) {
            $message->updateStatus($input['status']);
        }

        if (array_key_exists('notes', $input)) {
            $message->updateNotes($input['notes']);
        }

        json_ok(ContactMessage::findById($message->id)->toArray());
    }

    public function destroy(array $params): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $user = User::findById($uid);
        if (!$user || !$this->isSuperAdmin($user)) {
            json_err('Forbidden', 403);
        }

        $message = ContactMessage::findById((int) $params['id']);
        if (!$message) json_err('Message not found', 404);

        $message->delete();

        json_ok(['message' => 'Message deleted']);
    }

    private function isSuperAdmin(User $user): bool
    {
        $db = \App\Config\Database::pdo();
        $stmt = $db->prepare("
            SELECT r.name FROM company_user cu
            JOIN roles r ON r.id = cu.role_id
            WHERE cu.user_id = ?
        ");
        $stmt->execute([$user->id]);
        $roles = $stmt->fetchAll(\PDO::FETCH_COLUMN);

        return in_array('superadmin', $roles, true);
    }
}