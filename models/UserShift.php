<?php 
declare(strict_types=1);

namespace App\Models;

use App\Config\Database;

class UserShift{

public ?int $id= null;
public int $user_id = 0;

public int $company_id=0;
public int $shift_id=0;

public string $date ='';

public string $status ='scheduled';

public ?string $notes=null;

public ?string $created_at =null;


public static function findById(int $id): ?self{
    $db=Database::pdo();
    $stmt=$db->prepare("SELECT * FROM user_shift WHERE id=?");
    $stmt->execute([$id]);
    $row=$stmt->fetch();

    return $row ? self:: fromRow($row) : null;
}

public static function forCompanyWeek(int $companyId, string $startDate, string $endDate): array{

$db=Database::pdo();
$stmt=$db->prepare("SELECT us.*, u.name AAS user_name, u.email AS user_email, s.name AS shift_name, s.start_time AS shift_start, s.end_time AS shift_end, s.color AS shift_color
 FROM user_shifts us
            JOIN users u ON u.id = us.user_id
            JOIN shifts s ON s.id = us.shift_id
            WHERE us.company_id = ? AND us.date BETWEEN ? AND ?
            ORDER BY us.date, s.start_time");
            $stmt->execute([$companyId, $startDate, $endDate]);
            return $stmt->fetchAll();
}


public static function forUserWeek(int $userId, int $companyId, string $startDate, string $endDate): array{
    $db=Database::pdo();
    $stmt=$db->prepare("   SELECT us.*, s.name AS shift_name, s.start_time AS shift_start, s.end_time AS shift_end, s.color AS shift_color
            FROM user_shifts us
            JOIN shifts s ON s.id = us.shift_id
            WHERE us.user_id = ? AND us.company_id = ? AND us.date BETWEEN ? AND ?
            ORDER BY us.date");

            $stmt->execute([$userId, $companyId, $startDate, $endDate]);
            return $stmt->fetchAll();
}

public static function isWorking(int $userId, int $companyId,string $date, string $time): bool{
    $db=Database::pdo();
    $stmt= $db->prepare("SELECT 1 FROM user_shifts us JOIN shifts s ON s.id= us.shift_id WHERE us.user_id = ? AND us.company_id=? AND us.date=? AND us.status = 'scheduled' AND s.start_time <= ? AND s.end_time > ? LIMIT 1");

    $stmt->execute([$userId,$companyId, $date, $time, $time]);
    return (bool) $stmt->fetch();
}

public static function upsert(int $userId, int $companyId, int $shiftId,string $date, array $data = []): int{
    $db=Database::pdo();
    $stmt=$db->prepare("SELECT id FROM user_shifts WHERE user_id = ? AND company_id=? AND date=?");
    $stmt->execute([$userId, $companyId, $date]);
    $existing = $stmt->fetchColumn();

    if($existing){
        $stmt = $db->prepare("
                UPDATE user_shifts 
                SET shift_id = ?, status = ?, notes = ?
                WHERE id = ?
            ");
            $stmt->execute([
                $shiftId,
                $data['status'] ?? 'scheduled',
                $data['notes'] ?? null,
                $existing,
            ]);
            return (int) $existing; 
    }
     $stmt = $db->prepare("
            INSERT INTO user_shifts (user_id, company_id, shift_id, date, status, notes)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $userId,
            $companyId,
            $shiftId,
            $date,
            $data['status'] ?? 'scheduled',
            $data['notes'] ?? null,
        ]);

        return (int) $db->lastInsertId();
    }

    public function delete(): bool
    {
        if ($this->id === null) return false;
        return Database::pdo()
            ->prepare("DELETE FROM user_shifts WHERE id = ?")
            ->execute([$this->id]);
    }

    public function toArray(): array
    {
        return [
            'id'         => $this->id,
            'user_id'    => $this->user_id,
            'company_id' => $this->company_id,
            'shift_id'   => $this->shift_id,
            'date'       => $this->date,
            'status'     => $this->status,
            'notes'      => $this->notes,
            'created_at' => $this->created_at,
        ];
    }

    private static function fromRow(array $row): self
    {
        $us = new self();
        $us->id         = (int) $row['id'];
        $us->user_id    = (int) $row['user_id'];
        $us->company_id = (int) $row['company_id'];
        $us->shift_id   = (int) $row['shift_id'];
        $us->date       = $row['date'];
        $us->status     = $row['status'];
        $us->notes      = $row['notes'] ?? null;
        $us->created_at = $row['created_at'] ?? null;
        return $us;
    }
}
