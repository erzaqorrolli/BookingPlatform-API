<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Models\Product;
use App\Models\Company;

class ProductController
{
    public function index(array $params): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $companyId = (int) $params['companyId'];
        if (!Company::userBelongsTo($uid, $companyId)) {
            json_err('Forbidden', 403);
        }

        $products = Product::forCompany($companyId);
        json_ok(array_map(fn($p) => $p->toArray(), $products));
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
        if (!isset($input['price'])) json_err('Price is required', 422);

        $product = Product::create($companyId, $input);

        json_ok([
            'message' => 'Product created',
            'product' => $product->toArray(),
        ], 201);
    }

    public function show(array $params): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $companyId = (int) $params['companyId'];
        $id = (int) $params['id'];

        if (!Company::userBelongsTo($uid, $companyId)) {
            json_err('Forbidden', 403);
        }

        $product = Product::findById($id);
        if (!$product || $product->company_id !== $companyId) {
            json_err('Product not found', 404);
        }

        json_ok($product->toArray());
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

        $product = Product::findById($id);
        if (!$product || $product->company_id !== $companyId) {
            json_err('Product not found', 404);
        }

        $product->update(input());
        json_ok([
            'message' => 'Product updated',
            'product' => Product::findById($id)->toArray(),
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

        $product = Product::findById($id);
        if (!$product || $product->company_id !== $companyId) {
            json_err('Product not found', 404);
        }

        $product->delete();
        json_ok(['message' => 'Product deleted']);
    }
}