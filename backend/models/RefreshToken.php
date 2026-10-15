<?php

declare(strict_types=1);



namespace App\Models;
use App\Config\Database;


class RefreshToken {

public static function create(int $userId): string
{
    $db = Database::pdo();
    $token = bin2hex(random_bytes(32));
    
    $stmt = $db->prepare("
        INSERT INTO refresh_tokens (user_id, token, expires_at, user_agent, ip_address)
        VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY), ?, ?)
    ");
    $stmt->execute([
        $userId,
        $token,
        $_SERVER['HTTP_USER_AGENT'] ?? null,
        $_SERVER['REMOTE_ADDR'] ?? null,
    ]);
    
    return $token;
}
public static function findValid (string $token): ?array{
    $db = Database::pdo();
    $stmt = $db->prepare("SELECT * FROM refresh_tokens where TOKEN = ? AND expires_at > NOW() AND revoked_at IS NULL LIMIT 1");
    $stmt->execute([$token]);
    $row = $stmt->fetch();
    return $row ?: null;
}

public static function revoke (string $token): bool{
    $db = Database::pdo();
    $stmt = $db->prepare("UPDATE refresh_tokens SET revoked_at = NOW() WHERE token= ? AND revoked_at IS NULL");
    return $stmt->execute([$token]);
}

public static function revokeAllForUser (int $userId): bool{
    $db=Database::pdo();
    $stmt=$db->prepare("UPDATE refresh_tokens SET revoked_at=NOW() WHERE user_id = ? AND revoked_at IS NULL");
    return $stmt->execute([$userId]);
}

public static function cleanup(): int{
    $db=Database::pdo();
    $stmt=$db->prepare("DELETE FROM refresh_tokens WHERE expires_at < NOW() OR revoked_at IS NOT NULL");
    $stmt->execute();
    return $stmt->rowCount();

}
}