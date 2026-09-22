<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Models\Shift;
use App\Models\Company;

class ShiftController
{
    public function index(array $params): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $companyId = (int) $params['companyId'];
        if (!Company::userBelongsTo($uid, $companyId)) {
            json_err('Forbidden', 403);
        }

        $shifts = Shift::forCompany($companyId);
        json_ok(array_map(fn($s) => $s->toArray(), $shifts));
    }

    public function store(array $params): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $companyId = (int) $params['companyId'];

        $role = Company::userRole($uid, $companyId);
        if (!in_array($role, ['owner', 'admin', 'manager'])) {
            json_err('Forbidden', 403);
        }

        $input = input();
        if (empty($input['name'])) json_err('Name required', 422);
        if (empty($input['start_time']) || empty($input['end_time'])) {
            json_err('Times required', 422);
        }

        $shift = Shift::create($companyId, $input);

        json_ok([
            'message' => 'Shift created',
            'shift'   => $shift->toArray(),
        ], 201);
    }

    public function update(array $params): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $companyId = (int) $params['companyId'];
        $id = (int) $params['id'];

        $role = Company::userRole($uid, $companyId);
        if (!in_array($role, ['owner', 'admin', 'manager'])) {
            json_err('Forbidden', 403);
        }

        $shift = Shift::findById($id);
        if (!$shift || $shift->company_id !== $companyId) {
            json_err('Shift not found', 404);
        }

        $shift->update(input());

        json_ok([
            'message' => 'Shift updated',
            'shift'   => Shift::findById($id)->toArray(),
        ]);
    }

    public function destroy(array $params): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $companyId = (int) $params['companyId'];
        $id = (int) $params['id'];

        $role = Company::userRole($uid, $companyId);
        if (!in_array($role, ['owner', 'admin'])) {
            json_err('Forbidden', 403);
        }

        $shift = Shift::findById($id);
        if (!$shift || $shift->company_id !== $companyId) {
            json_err('Shift not found', 404);
        }

        $shift->delete();
        json_ok(['message' => 'Shift deleted']);
    }
}