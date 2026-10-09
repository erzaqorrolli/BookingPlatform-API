<?php
declare(strict_types=1);

namespace App\Models;

use App\Config\Database;

class PayrollEarning
{
    public static function calculateEarnings(int $companyId, int $userId): int
    {
        $db = Database::pdo();

        // 1. Merr tarifën
        $stmt = $db->prepare("
            SELECT hourly_rate FROM staff_compensation
            WHERE company_id = ? AND user_id = ? AND active = 1
            LIMIT 1
        ");
        $stmt->execute([$companyId, $userId]);
        $rate = (float) $stmt->fetchColumn();

        if ($rate <= 0) {
            return 0;
        }

        // 2. Merr shiftet e mbaruara që nuk janë llogaritur
        $stmt = $db->prepare("
            SELECT 
                us.id AS user_shift_id,
                us.date,
                s.start_time,
                s.end_time
            FROM user_shifts us
            JOIN shifts s ON s.id = us.shift_id
            LEFT JOIN payroll_earnings pe ON pe.user_shift_id = us.id
            WHERE us.company_id = ?
              AND us.user_id = ?
              AND us.status = 'completed'
              AND pe.id IS NULL
              AND TIMESTAMP(us.date, s.end_time) < NOW()
        ");
        $stmt->execute([$companyId, $userId]);
        $shifts = $stmt->fetchAll();

        if (empty($shifts)) {
            return 0;
        }

        // 3. Llogarit dhe ruaj
        $count = 0;
        foreach ($shifts as $shift) {
            $start = strtotime($shift['start_time']);
            $end = strtotime($shift['end_time']);
            $hours = round(($end - $start) / 3600, 2);
            $amount = round($hours * $rate, 2);

            $insert = $db->prepare("
                INSERT INTO payroll_earnings 
                    (company_id, user_id, user_shift_id, date, hours, hourly_rate, amount)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $insert->execute([
                $companyId,
                $userId,
                $shift['user_shift_id'],
                $shift['date'],
                $hours,
                $rate,
                $amount,
            ]);
            $count++;
        }

        return $count;
    }

    public static function getUnpaidTotal(int $companyId, int $userId): array
    {
        $db = Database::pdo();
        $stmt = $db->prepare("
            SELECT 
                COALESCE(SUM(amount), 0) AS total,
                COALESCE(SUM(hours), 0) AS total_hours,
                COUNT(*) AS shifts_count
            FROM payroll_earnings
            WHERE company_id = ? AND user_id = ? AND paid_at IS NULL
        ");
        $stmt->execute([$companyId, $userId]);
        return $stmt->fetch();
    }

    public static function forUser(int $companyId, int $userId, int $limit = 100): array
    {
        $db = Database::pdo();
        $stmt = $db->prepare("
            SELECT pe.*, s.name AS shift_name
            FROM payroll_earnings pe
            JOIN user_shifts us ON us.id = pe.user_shift_id
            JOIN shifts s ON s.id = us.shift_id
            WHERE pe.company_id = ? AND pe.user_id = ?
            ORDER BY pe.date DESC
            LIMIT ?
        ");
        $stmt->bindValue(1, $companyId, \PDO::PARAM_INT);
        $stmt->bindValue(2, $userId, \PDO::PARAM_INT);
        $stmt->bindValue(3, $limit, \PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public static function markAsPaid(int $companyId, int $userId): int
    {
        $db = Database::pdo();
        $stmt = $db->prepare("
            UPDATE payroll_earnings
            SET paid_at = NOW()
            WHERE company_id = ? AND user_id = ? AND paid_at IS NULL
        ");
        $stmt->execute([$companyId, $userId]);
        return $stmt->rowCount();
    }
}