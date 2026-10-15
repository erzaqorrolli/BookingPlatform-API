<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Models\Invoice;
use App\Models\Company;
use App\Models\Booking;
use App\Config\Database;
class InvoiceController
{
 
    public function index(array $params): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $companyId = (int) $params['companyId'];
        if (!Company::userBelongsTo($uid, $companyId)) {
            json_err('Forbidden', 403);
        }

        $invoices = Invoice::forCompany($companyId, [
            'status'      => $_GET['status'] ?? null,
            'customer_id' => $_GET['customer_id'] ?? null,
            'search'      => $_GET['search'] ?? null,
        ]);

        json_ok($invoices);
    }


        public static function generateReference(): string{
            $db =Database::pdo();
            do{
                $reference = 'INV-' . date('Y') . ' - ' . str_pad((string) random_int(0,99999), 5,'0',STR_PAD_LEFT);
                $stmt = $db->prepare("SELECT 1 FROM invoices WHERE reference = ? LIMIT 1");
                $stmt->execute([$reference]);
            }while($stmt->fetchColumn());
            return $reference;
        }


    
    public function show(array $params): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $companyId = (int) $params['companyId'];
        if (!Company::userBelongsTo($uid, $companyId)) {
            json_err('Forbidden', 403);
        }

        $invoice = Invoice::findById((int) $params['id']);
        if (!$invoice || $invoice->company_id !== $companyId) {
            json_err('Invoice not found', 404);
        }

        json_ok($invoice->toArray());
    }


    public  static function store(array $params): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $companyId = (int) $params['companyId'];
        $role = Company::userRole($uid, $companyId);
        if (!in_array($role, ['owner', 'admin', 'manager'], true)) {
            json_err('Forbidden', 403);
        }

        $input     = input();

        $customerId=(int) ($input['customer_id'] ?? 0);
        if(!$customerId) json_err('Customer is required',422);

        $items=$input['items'] ?? [];
        if(empty($items)){
        json_err ('At least one item is required',422);
        }

        $issueDate=$input['issue_date']?? date ('Y-m-d');
        $dueDate  =$input['due_date'] ?? date('Y-m-d', strtotime ('+14 days'));
        $notes = $input['notes'] ?? null;
        $discountAmount = (float) ($input['discount_amount'] ?? 0);
        $taxAmount =(float) ($input['tax_amount'] ?? 0);
        $bookingId = !empty($input['booking_id']) ? (int) $input ['booking_id'] : null;


        $db = Database::pdo();
        $stmt = $db->prepare("SELECT id,name,email FROM customers WHERE id = ? AND company_id = ? LIMIT 1");
        $stmt->execute([$customerId, $companyId]);
        $customer=$stmt->fetch();
        if(!$customer) json_err ('Customer not found',404);

        $subtotal = 0;
        foreach($items as $item){
            $qty = (float) ($item['quantity'] ?? 1);
            $price = (float) ($item['price'] ?? 0);
            $subtotal += $qty * $price;
        }

        $total = $subtotal - $discountAmount + $taxAmount;

        $reference = self ::generateReference();

        $insert = $db->prepare ("
        INSERT INTO invoices (
        reference, company_id, booking_id, customer_id, issue_date, due_date, subtotal, discount_amount, tax_amount, total, status, notes,items) VALUES (?,?,?,?,?,?,?,?,?,?, 'draft', ?,?) ");
        

        $insert->execute([
        $reference,
        $companyId,
        $bookingId,
        $customerId,
        $issueDate,
        $dueDate,
        $subtotal,
        $discountAmount,
        $taxAmount,
        $total,
        $notes,
        !empty($items) ? json_encode($items) : null

        ]);

        $invoiceId = (int) $db->lastInsertId();
        

        json_ok ([

        'message'=> 'Invoice created',
        'invoice' => Invoice::findById($invoiceId)->toArray(),

        ],201);
        }


       
   public function update (array $params): void{
    $uid = auth_user_id();
    if(!$uid) json_err ('Unauthorized',401);

    $companyId = (int) $params['companyId'];
    $invoiceId= (int) $params['id'];

    $role = Company::userRole($uid,$companyId);
    if(!in_array($role,['owner','admin','manager'], true)){
        json_err('Forbidden',403);
    }

    $invoice = Invoice::findById($invoiceId);
    if(!$invoice || $invoice->company_id !== $companyId){
        json_err ('Invoice not found', 404);
    }

    if($invoice->status !== 'draft'){
        json_err ('Only draft invoices can be edited',403);
    }


    $input=input();
    $db=Database::pdo();

    $items = $input['items'] ?? [];
    $subtotal=0;
    foreach($items as $item){
        $qty = (float) ($item['quantity'] ?? 1);
        $price = (float) ($item['price'] ?? 0);
        $subtotal += $qty * $price;
    }

    $discountAmount =(float) ($input['discount_amount'] ?? $invoice->discount_amount);
    $taxAmount=(float) ($input['tax_amount'] ?? $invoice->tax_amount);
    $total = $subtotal - $discountAmount + $taxAmount;

    $update = $db->prepare("
    UPDATE invoices SET customer_id=?,
    issue_date = ?,
    due_date = ?,
    subtotal = ?,
    discount_amount =?,
    tax_amount =?,
    total =?,
    notes =?,
    items=?
    WHERE id=?
    ");

    $update->execute([
        (int) ($input['customer_id'] ?? $invoice->customer_id),
        $input['issue_date'] ?? $invoice->issue_date,
        $input['due_date'] ?? $invoice->due_date,
        $subtotal,
        $discountAmount,
        $taxAmount,
        $total,
        $input['notes'] ?? $invoice->notes,
        !empty($items)? json_encode($items): null,
        $invoiceId,
    ]);

    json_ok([
        'message'=>'Invoice updated',
        'invoice'=> Invoice::findById($invoiceId)->toArray(),
    ]);
   }
    public function createFromBooking(array $params): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $companyId = (int) $params['companyId'];
        $bookingId = (int) $params['bookingId'];

        if (!Company::userBelongsTo($uid, $companyId)) {
            json_err('Forbidden', 403);
        }

        $invoice = Invoice::createFromBooking($bookingId);
        if (!$invoice) {
            json_err('Could not create invoice', 500);
        }

        json_ok([
            'message' => 'Invoice created',
            'invoice' => $invoice->toArray(),
        ], 201);
    }

  
    public function updateStatus(array $params): void
{
    $uid = auth_user_id();
    if (!$uid) json_err('Unauthorized', 401);

    $companyId = (int) $params['companyId'];
    $invoiceId = (int) $params['id'];

    $role = Company::userRole($uid, $companyId);
    if (!in_array($role, ['owner', 'admin', 'manager'], true)) {
        json_err('Forbidden', 403);
    }

    $input = input();
    $status = $input['status'] ?? '';

    $invoice = Invoice::findById($invoiceId);
    if (!$invoice || $invoice->company_id !== $companyId) {
        json_err('Invoice not found', 404);
    }

    $previousStatus = $invoice->status;

    if (!$invoice->updateStatus($status)) {
        json_err('Invalid status', 422);
    }

    if ($status === 'sent' && $previousStatus !== 'sent') {
        try {
            $db = \App\Config\Database::pdo();
            $stmt = $db->prepare("
                SELECT c.name AS customer_name, c.email AS customer_email,
                       co.name AS company_name
                FROM invoices i
                JOIN customers c ON c.id = i.customer_id
                JOIN companies co ON co.id = i.company_id
                WHERE i.id = ?
                LIMIT 1
            ");
            $stmt->execute([$invoiceId]);
            $info = $stmt->fetch();
                    error_log('DEBUG kontroller info: ' . json_encode($info));
        error_log('DEBUG email valid: ' . (filter_var($info['customer_email'] ?? '', FILTER_VALIDATE_EMAIL) ? 'yes' : 'no'));

            if ($info && filter_var($info['customer_email'], FILTER_VALIDATE_EMAIL)) {
                $fresh = Invoice::findById($invoiceId);

                \App\Utils\Mailer::sendInvoice(
                    $info['customer_email'],
                    $info['customer_name'],
                    array_merge($fresh->toArray(), [
                        'company_name' => $info['company_name'],
                    ])
                );
            }
        } catch (\Throwable $e) {
            error_log('Invoice email failed: ' . $e->getMessage());
        }
    }

    json_ok([
        'message' => 'Status updated',
        'invoice' => Invoice::findById($invoiceId)->toArray(),
    ]);
}

  
    public function destroy(array $params): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $companyId = (int) $params['companyId'];
        $role = Company::userRole($uid, $companyId);
        if (!in_array($role, ['owner', 'admin'], true)) {
            json_err('Forbidden', 403);
        }

        $invoice = Invoice::findById((int) $params['id']);
        if (!$invoice || $invoice->company_id !== $companyId) {
            json_err('Invoice not found', 404);
        }

        $invoice->delete();
        json_ok(['message' => 'Invoice deleted']);
    }

  public function publicMarkAsPaid(array $params): void
{
    $token = trim((string) ($params['token'] ?? ''));
    if (!$token) json_err('Token required', 422);

    $invoice = Invoice::findByToken($token);
    if (!$invoice) json_err('Invoice not found', 404);

    if ($invoice->status !== 'paid') {
        $invoice->markAsPaid('online');
    }

    json_ok(['message' => 'Paid', 'invoice' => Invoice::findById($invoice->id)->toArray()]);
}
}