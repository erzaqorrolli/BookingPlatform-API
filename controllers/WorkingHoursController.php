<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Models\WorkingHours;
use App\Models\Company;

class WorkingHoursController
{
    public function index(array $params): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $companyId = (int) $params['companyId'];

        if (!Company::userBelongsTo($uid, $companyId)) {
            json_err('Forbidden', 403);
        }

        json_ok(WorkingHours::forCompany($companyId));
    }

    public function update(array $params): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $companyId = (int) $params['companyId'];
        $dayOfWeek = (int) $params['day'];

        $role = Company::userRole($uid, $companyId);
        if (!in_array($role, ['owner', 'admin', 'manager'])) {
            json_err('Forbidden', 403);
        }

        if ($dayOfWeek < 0 || $dayOfWeek > 6) {
            json_err('Invalid day (0-6)', 422);
        }

        WorkingHours::update($companyId, $dayOfWeek, input());

        json_ok(['message' => 'Working hours updated']);
    }
}