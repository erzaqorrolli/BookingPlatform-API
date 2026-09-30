<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Models\Invoice;
use App\Models\Company;
use App\Models\Booking;

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


    public function store(array $params): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $companyId = (int) $params['companyId'];
        $role = Company::userRole($uid, $companyId);
        if (!in_array($role, ['owner', 'admin', 'manager'], true)) {
            json_err('Forbidden', 403);
        }

        $input     = input();
        $bookingId = (int) ($input['booking_id'] ?? 0);

        if (!$bookingId) {
            json_err('booking_id is required', 422);
        }

        $booking = Booking::findById($bookingId);
        if (!$booking || $booking->company_id !== $companyId) {
            json_err('Booking not found', 404);
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
        $role = Company::userRole($uid, $companyId);
        if (!in_array($role, ['owner', 'admin', 'manager'], true)) {
            json_err('Forbidden', 403);
        }

        $invoice = Invoice::findById((int) $params['id']);
        if (!$invoice || $invoice->company_id !== $companyId) {
            json_err('Invoice not found', 404);
        }

        $input  = input();
        $status = $input['status'] ?? '';

        if (!$invoice->updateStatus($status)) {
            json_err('Invalid status', 422);
        }

        json_ok([
            'message' => 'Invoice status updated',
            'invoice' => Invoice::findById($invoice->id)->toArray(),
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
}