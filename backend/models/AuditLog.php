<?php

declare(strict_types=1);

namespace App\Models;

use App\Config\Database;

class AuditLog
{

public static function log(

int $userId,
string $action,
?string $targetType = null,
?int $targetId = null,
array $metadata = []
): void {
    try{
        $db = Database::pdo();
        $stmt = $db->prepare("INSERT INTO audit_logs (user_id,action,target_type, target_id, metadata) VALUES(?,?,?,?,?)");
        $stmt->execute([$userId,$action,$targetType,$targetId, !empty($metadata)? json_encode($metadata): null,]);
    }catch(\Throwable $e){
        error_log ('Audit log failed: ' . $e->getMessage());
    }
}

public static function recent (int $limit = 200): array {
    $db = Database::pdo();
    $stmt= $db->prepare("SELECT al.*, u.name AS user_name, u.email AS user_email FROM audit_logs al LEFT JOIN users u ON u.id = al.user_id ORDER BY al.created_at DESC LIMIT ?");
    $stmt->bindValue(1, $limit, \PDO::PARAM_INT);
    $stmt->execute();
    return $stmt->fetchAll();
}

}