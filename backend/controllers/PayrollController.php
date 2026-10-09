<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Config\Database;
use App\Models\Company;
use App\Models\PayrollEarning;
use App\Models\StaffCompensation;

class PayrollController
{
    private function requireManager(int $companyId): int
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $role = Company::userRole($uid, $companyId);
        if (!in_array($role, ['owner', 'admin'], true)) {
            json_err('Only owner or admin can manage payroll', 403);
        }

        return $uid;
    }

    public function index(array $params): void
    {
        $companyId = (int) $params['companyId'];
        $this->requireManager($companyId);

        $db = Database::pdo();

        $stmt = $db->prepare("
            SELECT 
                u.id,
                u.name,
                u.email,
                r.name AS role,
                sc.hourly_rate,
                sc.id AS compensation_id,
                COALESCE(SUM(CASE WHEN pe.paid_at IS NULL THEN pe.amount ELSE 0 END), 0) AS unpaid_total,
                COALESCE(SUM(CASE WHEN pe.paid_at IS NULL THEN pe.hours ELSE 0 END), 0) AS unpaid_hours,
                COALESCE(SUM(CASE WHEN pe.paid_at IS NULL THEN 1 ELSE 0 END), 0) AS unpaid_shifts,
                COALESCE(SUM(CASE WHEN pe.paid_at IS NOT NULL THEN pe.amount ELSE 0 END), 0) AS paid_total
            FROM company_user cu
            JOIN users u ON u.id = cu.user_id
            JOIN roles r ON r.id = cu.role_id
            LEFT JOIN staff_compensation sc ON sc.user_id = u.id AND sc.company_id = cu.company_id AND sc.active = 1
            LEFT JOIN payroll_earnings pe ON pe.user_id = u.id AND pe.company_id = cu.company_id
            WHERE cu.company_id = ?
              AND r.name IN ('owner', 'admin', 'manager', 'staff')
            GROUP BY u.id, u.name, u.email, r.name, sc.hourly_rate, sc.id
            ORDER BY u.name ASC
        ");
        $stmt->execute([$companyId]);
        $employees = $stmt->fetchAll();

        json_ok($employees);
    }

    public function store(array $params): void
    {
        $companyId = (int) $params['companyId'];
        $this->requireManager($companyId);

        $input = input();
        $userId = (int) ($input['user_id'] ?? 0);
        $hourlyRate = (float) ($input['hourly_rate'] ?? 0);

        if (!$userId) json_err('User ID required', 422);
        if ($hourlyRate < 0) json_err('Hourly rate must be positive', 422);

        $db = Database::pdo();

        $stmt = $db->prepare("SELECT 1 FROM company_user WHERE user_id = ? AND company_id = ? LIMIT 1");
        $stmt->execute([$userId, $companyId]);
        if (!$stmt->fetchColumn()) {
            json_err('User is not part of this company', 404);
        }

        StaffCompensation::upsert($companyId, $userId, $hourlyRate);

        PayrollEarning::calculateEarnings($companyId, $userId);

        json_ok([
            'message' => 'Hourly rate updated',
            'hourly_rate' => $hourlyRate,
        ]);
    }

    public function markPaid(array $params): void
    {
        $companyId = (int) $params['companyId'];
        $userId = (int) $params['userId'];
        $this->requireManager($companyId);

        PayrollEarning::calculateEarnings($companyId, $userId);

        $count = PayrollEarning::markAsPaid($companyId, $userId);

        json_ok([
            'message' => "Marked $count earnings as paid",
            'count' => $count,
        ]);
    }

    public function history(array $params): void
    {
        $companyId = (int) $params['companyId'];
        $userId = (int) $params['userId'];
        $this->requireManager($companyId);

        PayrollEarning::calculateEarnings($companyId, $userId);
        $earnings = PayrollEarning::forUser($companyId, $userId, 200);

        json_ok($earnings);
    }
}