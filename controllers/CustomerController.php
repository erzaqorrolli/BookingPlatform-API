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

  public static function updateVipStatus(int $customerId): void
{
    $db = Database::pdo();

    $stmt = $db->prepare("
        SELECT COUNT(*) FROM bookings
        WHERE customer_id = ?
          AND status IN ('confirmed', 'completed')
    ");
    $stmt->execute([$customerId]);
    $count = (int) $stmt->fetchColumn();

    $isVip = $count >= 30 ? 1 : 0;

    $db->prepare("
        UPDATE customers
        SET total_bookings = ?, is_vip = ?
        WHERE id = ?
    ")->execute([$count, $isVip, $customerId]);
}

public function show (array $params): void{

$uid= auth_user_id();
if(!uid) json_err('Unauthorized', 401);

$companyId = (int) $params['companyId'];
$customerId =(int) $params['id'];

if(!Company::userBelongsTo($uid, $companyId)){
    json_err('Forbidden', 403);
}

$db = \App\Config\Database::pdo();

$stmt = $db->prepare("SELECT * FROM customers WHERE id = ? AND company_id = ? LIMIT 1");
$stmt->execute([$customerId, $companyId]);
$customer = $stmt->fetch();

if(!$customer){
    json_err ('Customer not found', 404);

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
    JOIN services s ON s.id = b.serivice_id
    WHERE b.customer_id= ?
    ORDER BY b.booking_date DESC
    LIMIT 100
    ");

    $bookingStmt->execute([$customerId]);
    $bookings = $bookingStmt->fetchAll();
    
    $invoiceStmt = $db->prepare("
    
    SELECT 
    i.id,
    i.reference,
    i.issued_date,
    i.due_date,
    i.total,
    i.status,
    i.paid_at
    FROM invoices i
    WHERE i.customer_id = ? AND i.company_id = ?
    ORDEER BY i.issue_date DESC

    ");

    $invoiceStmt->execute([$customerId, $companyId]);
    $invoices = $invoiceStmt->fetchAll();

    $totalSpent = 0;
    foreach($bookings as $b){
        if(in_array($b['status'], ['confirmed','completed'])){
            $totalSpent +=(float) $b['total_price'];
        }
    }

    json_ok([

    'customer' => [
        'id'       => (int) $customer['id'],
        'company_id'       => (int) $customer['company_id'],
        'name'      => $customer['name'],
        'email'     => $customer['email'],
        'phone'     => $customer['phone'],
        'is_vip'    => (int) $customer['phone'] ?? null,
        'total_bookings'    => (int) ($customer['total_bookings'] ?? 0),
        'created_at'    => $customer['created_at'] ?? null,
    ],
    'bookings'      => $bookings,
    'invoices'      =>$invoices,
    'stats'         =>[
        'total_bookings' => count($bookings),
        'total_invoices' => count($invoices),
        'total_spent' => round($totalSpent, 2),
    ],

    ]);
    }
    
}


}