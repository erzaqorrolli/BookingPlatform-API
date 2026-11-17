<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Models\Company;
use App\Models\Notification;

class NotificationController {

    private function companyId(int $userId): ?int {
        if (!isset($_GET['company_id'])) {
            return null;
        }

        $companyId = filter_var($_GET['company_id'], FILTER_VALIDATE_INT);
        if ($companyId === false || $companyId < 1) {
            json_err('Invalid company ID', 422);
        }

        if (!Company::userBelongsTo($userId, $companyId)) {
            json_err('You do not have access to this company', 403);
        }

        return $companyId;
    }

    public function index(): void {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $companyId = $this->companyId($uid);

        $notifications = Notification::forUser($uid, 100, $companyId);
        $unreadCount = Notification::unreadCount($uid, $companyId);

        json_ok([
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    public function unreadCount(): void {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $companyId = $this->companyId($uid);

        json_ok([
            'unread_count' => Notification::unreadCount($uid, $companyId),
        ]);
    }

    public function markAsRead(array $params): void {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $id = (int)($params['id'] ?? 0);
        if (!$id) json_err('Notification ID required', 422);

        Notification::markAsRead($id, $uid, $this->companyId($uid));
        json_ok(['message' => 'Mark as read']);
    }

    public function markAllAsRead(): void {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $companyId = $this->companyId($uid);

        Notification::markAllAsRead($uid, $companyId);
        json_ok(['message' => 'All marked as read']);
    }

    public function destroy(array $params): void {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $id = (int) ($params['id'] ?? 0);
        if (!$id) json_err('Notifications ID required', 422);

        Notification::delete($id, $uid, $this->companyId($uid));
        json_ok(['message' => 'Notification deleted']);
    }
}