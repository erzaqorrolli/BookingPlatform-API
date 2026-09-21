<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Models\HappyHour;
use App\Models\Company;

class HappyHourController
{
    public function index(array $params): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $companyId = (int) $params['companyId'];
        if (!Company::userBelongsTo($uid, $companyId)) {
            json_err('Forbidden', 403);
        }

        $items = HappyHour::forCompany($companyId);
        json_ok(array_map(fn($h) => $h->toArray(), $items));
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
        if (!isset($input['day_of_week'])) json_err('Day required', 422);
        if (empty($input['start_time']) || empty($input['end_time'])) {
            json_err('Times required', 422);
        }
        if (!isset($input['discount_percent'])) {
            json_err('Discount required', 422);
        }

        $happyHour = HappyHour::create($companyId, $input);

        json_ok([
            'message'    => 'Happy hour created',
            'happy_hour' => $happyHour->toArray(),
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

        $happyHour = HappyHour::findById($id);
        if (!$happyHour || $happyHour->company_id !== $companyId) {
            json_err('Happy hour not found', 404);
        }

        $happyHour->update(input());
        json_ok([
            'message'    => 'Happy hour updated',
            'happy_hour' => HappyHour::findById($id)->toArray(),
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

        $happyHour = HappyHour::findById($id);
        if (!$happyHour || $happyHour->company_id !== $companyId) {
            json_err('Happy hour not found', 404);
        }

        $happyHour->delete();
        json_ok(['message' => 'Happy hour deleted']);
    }
}