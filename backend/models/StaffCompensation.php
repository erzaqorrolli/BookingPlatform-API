<?php
declare(strict_types=1);

namespace App\Models;

use App\Config\Database;

class StaffCompensation{

public static function forCompany (int $companyId): array {
    $db = Database::pdo();
    $stmt = $db->prepare("
    SELECT sc.*, u.name AS user_name,
    u.email AS user_email,
    r.name AS role
    FROM staff_compensation sc
    JOIN users u ON u.id = sc.user_id
    JOIN company_user cu ON cu.user_id = u.id AND cu.company_id = sc.company_id 
    JOIN roles r ON r.id = cu.role_id
    WHERE sc.company_id = ?
    ORDER VY u.name ASC
    ");
    $stmt->execute ([$companyId]);
    return $stmt->fetchAll();

}
public static function findForUser(int $companyId, int $userId): ?array{
    $db = Database::pdo();
    $stmt = $db->prepare("SELECT * FROM staff_compensation WHERE company_id = ? AND user_id = ?
    LIMIT 1");

    $stmt->execute([$companyId, $userId]);
    $row = $stmt->fetch();
    return $row ?:null;
}

public static function upsert (int $companyId, int $userId, float $hourlyRate): void {

$db=Database::pdo();
$stmt = $db->prepare(" INSERT INTO staff_compensation (company_id, user_id, hourly_rate)
VALUES (?,?,?)
ON DUPLICATE KEY UPDATE 
hourly_rate = VALUES(hourly_rate),
active = 1,
updated_at=NOW()
");
$stmt->execute([$companyId,$userId,$hourlyRate]);
}

public static function remove(int $companyId,int $userId): void{
    $db = Database::pdo();
    $stmt= $db->prepare("UPDATE staff_compensation SET active = 0
    WHERE company_id = ? AND user_id = ?");

    $stmt->execute([$companyId, $userId]);
}
}