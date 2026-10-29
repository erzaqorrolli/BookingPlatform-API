<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Models\Customer;
use App\Models\Company;
use App\Config\Database;

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
        if (!in_array($role, ['owner', 'admin', 'manager'], true)) {
            $db = Database::pdo();
            $stmt = $db->prepare("
                SELECT p.permission_key FROM company_user_custom_roles cu
                JOIN company_role_permissions p ON p.role_id = cu.custom_role_id 
                WHERE cu.company_id = ? AND cu.user_id = ? AND p.enabled = 1
            ");
            $stmt->execute([$companyId, $uid]);
            $permissions = $stmt->fetchAll(\PDO::FETCH_COLUMN);

            if (!in_array('staff_can_manage_customers', $permissions)) {
                json_err('You do not have permission to manage clients', 403);
            }
        }

        $input = input();
        $name=trim($input['name'] ?? '');
        $email=trim(strtolower($input['email'] ?? ''));
        $phone=$input['phone'] ?? null;

        if(!$name || !filter_var($email,FILTER_VALIDATE_EMAIL)){
            json_err('Valid name and email are required',422);
        }
        $db=Database::pdo();
        $stmt=$db->prepare("INSERT INTO customers (company_id,name,email,phone)VALUES(?,?,?,?)");

        $stmt->execute([$companyId,$name,$email,$phone]);
        $customerId=(int) $db->lastInsertId();

        json_ok([
            'message'=>'Customer created successfully',
            'customer'=>Customer::findById($customerId)->toArray(),
        ],201);
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



public function show(array $params): void
{
    $uid = auth_user_id();
    if (!$uid) json_err('Unauthorized', 401);

    $companyId  = (int) $params['companyId'];
    $customerId = (int) $params['id'];

    if (!Company::userBelongsTo($uid, $companyId)) {
        json_err('Forbidden', 403);
    }

    $db = \App\Config\Database::pdo();

    // Merr klientin
    $stmt = $db->prepare("SELECT * FROM customers WHERE id = ? AND company_id = ? LIMIT 1");
    $stmt->execute([$customerId, $companyId]);
    $customer = $stmt->fetch();

    if (!$customer) {
        json_err('Customer not found', 404);
    }

    $bookingStmt = $db->prepare("
        SELECT 
            b.id,
            b.reference,
            b.booking_date,
            b.start_time,
            b.end_time,
            b.total_price,
            b.status,
            b.created_at,
            s.name AS service_name
        FROM bookings b
        JOIN services s ON s.id = b.service_id
        WHERE b.customer_id = ?
        ORDER BY b.booking_date DESC
        LIMIT 100
    ");
    $bookingStmt->execute([$customerId]);
    $bookings = $bookingStmt->fetchAll();

    $invoiceStmt = $db->prepare("
        SELECT 
            i.id,
            i.reference,
            i.issue_date,
            i.due_date,
            i.total,
            i.status,
            i.paid_at
        FROM invoices i
        WHERE i.customer_id = ? AND i.company_id = ?
        ORDER BY i.issue_date DESC
    ");
    $invoiceStmt->execute([$customerId, $companyId]);
    $invoices = $invoiceStmt->fetchAll();

    $totalSpent = 0;
    foreach ($bookings as $b) {
        if (in_array($b['status'], ['confirmed', 'completed'])) {
            $totalSpent += (float) $b['total_price'];
        }
    }

    json_ok([
        'customer' => [
            'id'             => (int) $customer['id'],
            'company_id'     => (int) $customer['company_id'],
            'name'           => $customer['name'],
            'email'          => $customer['email'],
            'phone'          => $customer['phone'] ?? null,
            'is_vip'         => (int) ($customer['is_vip'] ?? 0),
            'total_bookings' => (int) ($customer['total_bookings'] ?? 0),
            'created_at'     => $customer['created_at'] ?? null,
        ],
        'bookings' => $bookings,
        'invoices' => $invoices,
        'stats'    => [
            'total_bookings' => count($bookings),
            'total_invoices' => count($invoices),
            'total_spent'    => round($totalSpent, 2),
        ],
    ]);
}

public function updateQuick(array $params): void
{
    $uid = auth_user_id();
    if (!$uid) json_err('Unauthorized', 401);

    $companyId = (int) $params['companyId'];
    $customerId = (int) $params['id'];

    $role = Company::userRole($uid, $companyId);
    if (!in_array($role, ['owner', 'admin', 'manager', 'staff'])) { 
        json_err('Forbidden', 403);
    }

    $db = Database::pdo();

    $stmt = $db->prepare("SELECT id, is_vip, total_bookings FROM customers WHERE id = ? AND company_id = ?");
    $stmt->execute([$customerId, $companyId]);
    $customer = $stmt->fetch();

    if (!$customer) json_err('Customer not found', 404);

    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true);
    if (!$input) {
        $input = input();
    }

    error_log('Quick update input: ' . print_r($input, true));

    $allowedFields = ['tags', 'notes', 'needs_ada_help', 'is_vip'];
    $updates = [];
    $values = [];

    foreach ($allowedFields as $field) {
        if (array_key_exists($field, $input)) {
            $updates[] = "$field = ?";
            $values[] = $input[$field]; 
        }
    }

    if (empty($updates)) {
        json_err('Nothing to update. Input: ' . json_encode($input), 422);
    }

    $values[] = $customerId;
    
    $sql = "UPDATE customers SET " . implode(', ', $updates) . " WHERE id = ?";

    error_log('Quick update SQL: ' . $sql . ' | Values: ' . print_r($values, true));

    $db->prepare($sql)->execute($values);

    if ((int) $customer['total_bookings'] >= 30 && (int) $customer['is_vip'] === 0) {
        $db->prepare("UPDATE customers SET is_vip = 1 WHERE id = ?")->execute([$customerId]);
    }

    json_ok(['message' => 'Customer updated successfully']);
}}