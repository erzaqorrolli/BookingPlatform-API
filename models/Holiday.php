<?php

declare(strict_types=1);    

namespace App\Models;


use App\Config\Database;


class Holiday {

public static function forCompany(int $companyId): array{
    $db=Database::pdo();
    $stmt= $db->prepare("SELECT * FROM holidays WHERE company_id = ? ORDER BY date DESC");

    $stmt->execute([
        $companyId]);
        return $stmt->fetchAll();

    }

    public static function create (int $companyId, array $data): int{
        $db=Database::pdo();
        $stmt= $db->prepare("INSERT INTO holidays (company_id, date,name,is_recurring)
        VALUES (?,?,?,?)");

        $stmt->execute([
    $companyId,
    $data["date"],
    $data["name"],
    (int) ($data['is_recurring']?? 0),

        ]);

        return (int) $db-> lastInsertId();
    }

    public static function delete(int $id, int $companyId): bool
    {
        $db = Database::pdo();
        $stmt = $db->prepare("DELETE FROM holidays WHERE id = ? AND company_id = ?");

        return $stmt->execute([$id, $companyId]);
    }
}