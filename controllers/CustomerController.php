<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Models\Customer;
use App\Models\Company;

class CustomerController
{
    public function index(array $params): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $companyId = (int) $params['companyId'];
        if (!Company::userBelongsTo($uid, $companyId)) {
            json_err('Forbidden', 403);
        }

        $customers = Customer::forCompany($companyId);
        json_ok(array_map(fn($c) => $c->toArray(), $customers));
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
        if (empty($input['name'])) json_err('Name is required', 422);
        if (empty($input['email'])) json_err('Email is required', 422);
        if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
            json_err('Invalid email', 422);
        }

        $customer = Customer::findOrCreate(
            $companyId,
            $input['name'],
            $input['email'],
            $input['phone'] ?? null
        );

        json_ok([
            'message'  => 'Customer created',
            'customer' => $customer->toArray(),
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

        $customer = Customer::findById($id);
        if (!$customer || $customer->company_id !== $companyId) {
            json_err('Customer not found', 404);
        }

        $customer->update(input());

        json_ok([
            'message'  => 'Customer updated',
            'customer' => Customer::findById($id)->toArray(),
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

        $customer = Customer::findById($id);
        if (!$customer || $customer->company_id !== $companyId) {
            json_err('Customer not found', 404);
        }

        $customer->delete();
        json_ok(['message' => 'Customer deleted']);
    }
}