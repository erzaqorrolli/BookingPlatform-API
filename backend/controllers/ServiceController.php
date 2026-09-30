<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Models\Service;
use App\Models\Company;

class ServiceController
{
    public function index(array $params): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $companyId = (int) $params['companyId'];

        if (!Company::userBelongsTo($uid, $companyId)) {
            json_err('Forbidden', 403);
        }

        $services = Service::forCompany($companyId);
        json_ok(array_map(fn($s) => $s->toArray(), $services));
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

        if (empty($input['name'])) json_err('Service name is required', 422);
        if (empty($input['duration_minutes'])) json_err('Duration is required', 422);
        if (!isset($input['price'])) json_err('Price is required', 422);

        $service = Service::create($companyId, $input);

        json_ok([
            'message' => 'Service created',
            'service' => $service->toArray(),
        ], 201);
    }

    public function show(array $params): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $companyId = (int) $params['companyId'];
        $serviceId = (int) $params['id'];

        if (!Company::userBelongsTo($uid, $companyId)) {
            json_err('Forbidden', 403);
        }

        $service = Service::findById($serviceId);
        if (!$service || $service->company_id !== $companyId) {
            json_err('Service not found', 404);
        }

        json_ok($service->toArray());
    }

    public function update(array $params): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $companyId = (int) $params['companyId'];
        $serviceId = (int) $params['id'];

        $role = Company::userRole($uid, $companyId);
        if (!in_array($role, ['owner', 'admin', 'manager'])) {
            json_err('Forbidden', 403);
        }

        $service = Service::findById($serviceId);
        if (!$service || $service->company_id !== $companyId) {
            json_err('Service not found', 404);
        }

        $service->update(input());

        json_ok([
            'message' => 'Service updated',
            'service' => Service::findById($serviceId)->toArray(),
        ]);
    }

    public function destroy(array $params): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $companyId = (int) $params['companyId'];
        $serviceId = (int) $params['id'];

        $role = Company::userRole($uid, $companyId);
        if (!in_array($role, ['owner', 'admin'])) {
            json_err('Forbidden', 403);
        }

        $service = Service::findById($serviceId);
        if (!$service || $service->company_id !== $companyId) {
            json_err('Service not found', 404);
        }

        $service->delete();

        json_ok(['message' => 'Service deleted']);
    }
}