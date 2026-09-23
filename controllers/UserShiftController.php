<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Models\UserShift;
use App\Models\Company;
use App\Config\Database;

class UserShiftController
{
   
    public function index(array $params): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $companyId = (int) $params['companyId'];
        if (!Company::userBelongsTo($uid, $companyId)) {
            json_err('Forbidden', 403);
        }

        $start = $_GET['start'] ?? date('Y-m-d');
        $end   = $_GET['end']   ?? date('Y-m-d', strtotime('+6 days'));

        $schedule = UserShift::forCompanyWeek($companyId, $start, $end);

        json_ok($schedule);
    }

   
    public function mySchedule(array $params): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $companyId = (int) $params['companyId'];
        if (!Company::userBelongsTo($uid, $companyId)) {
            json_err('Forbidden', 403);
        }

        $start = $_GET['start'] ?? date('Y-m-d');
        $end   = $_GET['end']   ?? date('Y-m-d', strtotime('+6 days'));

        $schedule = UserShift::forUserWeek($uid, $companyId, $start, $end);

        json_ok($schedule);
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
        if (empty($input['user_id'])) json_err('User required', 422);
        if (empty($input['shift_id'])) json_err('Shift required', 422);
        if (empty($input['date'])) json_err('Date required', 422);

        if (!Company::userBelongsTo((int) $input['user_id'], $companyId)) {
            json_err('User is not team member', 422);
        }

        $id = UserShift::upsert(
            (int) $input['user_id'],
            $companyId,
            (int) $input['shift_id'],
            $input['date'],
            [
                'status' => $input['status'] ?? 'scheduled',
                'notes'  => $input['notes'] ?? null,
            ]
        );

        json_ok([
            'message' => 'Shift assigned',
            'id'      => $id,
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

        $userShift = UserShift::findById($id);
        if (!$userShift || $userShift->company_id !== $companyId) {
            json_err('Schedule entry not found', 404);
        }

        $input = input();
        $db = Database::pdo();
        $stmt = $db->prepare("
            UPDATE user_shifts 
            SET shift_id = ?, status = ?, notes = ?
            WHERE id = ?
        ");
        $stmt->execute([
            $input['shift_id'] ?? $userShift->shift_id,
            $input['status'] ?? $userShift->status,
            $input['notes'] ?? $userShift->notes,
            $id,
        ]);

        json_ok(['message' => 'Shift changed']);
    }

    public function destroy(array $params): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $companyId = (int) $params['companyId'];
        $id = (int) $params['id'];

        $role = Company::userRole($uid, $companyId);
        if (!in_array($role, ['owner', 'admin', 'manager'])) {
            json_err('Forbidden', 403);
        }

        $userShift = UserShift::findById($id);
        if (!$userShift || $userShift->company_id !== $companyId) {
            json_err('Schedule entry not found', 404);
        }

        $userShift->delete();
        json_ok(['message' => 'Shift deleted']);
    }
}