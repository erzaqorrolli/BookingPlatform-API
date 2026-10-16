<?php
declare(strict_types=1);

namespace App\Models;

use App\Config\Database;

class Notification
{
    public static function create(
        int $userId,
        string $type,
        string $title,
        ?string $message = null,
        ?string $link = null
    ): int {
        $db = Database::pdo();
        $stmt = $db->prepare("
            INSERT INTO notifications (user_id, type, title, message, link)
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([$userId, $type, $title, $message, $link]);
        return (int) $db->lastInsertId();
    }

    public static function forUser(int $userId, int $limit = 50): array
    {
        $db = Database::pdo();
        $stmt = $db->prepare("
            SELECT * FROM notifications
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ?
        ");
        $stmt->bindValue(1, $userId, \PDO::PARAM_INT);
        $stmt->bindValue(2, $limit, \PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public static function unreadCount(int $userId): int
    {
        $db = Database::pdo();
        $stmt = $db->prepare("
            SELECT COUNT(id) AS total FROM notifications
            WHERE user_id = ? AND read_at IS NULL
        ");
        $stmt->execute([$userId]);
        return (int) $stmt->fetchColumn();
    }

    public static function markAsRead(int $id, int $userId): bool
    {
        $db = Database::pdo();
        $stmt = $db->prepare("
            UPDATE notifications
            SET read_at = NOW()
            WHERE id = ? AND user_id = ? AND read_at IS NULL
        ");
        return $stmt->execute([$id, $userId]);
    }

    public static function markAllAsRead(int $userId): bool
    {
        $db = Database::pdo();
        $stmt = $db->prepare("
            UPDATE notifications
            SET read_at = NOW()
            WHERE user_id = ? AND read_at IS NULL
        ");
        return $stmt->execute([$userId]);
    }

    public static function delete(int $id, int $userId): bool
    {
        $db = Database::pdo();
        $stmt = $db->prepare("
            DELETE FROM notifications
            WHERE id = ? AND user_id = ?
        ");
        return $stmt->execute([$id, $userId]);
    }

    public static function notifyCompanyOwners(
        int $companyId,
        string $type,
        string $title,
        ?string $message = null,
        ?string $link = null
    ): void {
        $db = Database::pdo();
        $stmt = $db->prepare("
            SELECT u.id FROM company_user cu
            JOIN users u ON u.id = cu.user_id
            JOIN roles r ON r.id = cu.role_id
            WHERE cu.company_id = ? AND r.name IN ('owner', 'admin')
        ");
        $stmt->execute([$companyId]);
        $users = $stmt->fetchAll(\PDO::FETCH_COLUMN);

        foreach ($users as $uid) {
            self::create((int) $uid, $type, $title, $message, $link);
        }
    }
}