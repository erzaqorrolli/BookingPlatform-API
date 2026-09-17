<?php


declare(strict_types=1);

namespace App\Models;

use App\Config\Database;

class WorkingHours {


public static function forCompany(int $companyId):array{
    $db= Database::pdo();
    $stmt=$db->prepare("SELECT * FROM working_hours WHERE company_id=? ORDER BY day_of_week");

    $stmt->execute([$companyId]);
    return $stmt->fetchAll();
}


public static function update(int $companyId, int $dayOfWeek, array $data): bool{
    $db =Database::pdo();
    $stmt=$db->prepare("UPDATE working_hours SET open_time=?,close_time=?, is_closed=? WHERE company_id = ? AND day_of_week = ?");
    return $stmt->execute([
        $data['open_time'] ?? '09:00:00',
        $data['close_time'] ?? '18:00:00',
        (int) ($data['is_closed'] ?? 0),
        $companyId,
        $dayOfWeek,
    ]);
}


}