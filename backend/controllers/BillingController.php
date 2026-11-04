<?php

        declare(strict_types=1);

        namespace App\Controllers;
        use App\Config\Database;
        use App\Models\Company;

        class BillingController {

            public function index(): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $db = Database::pdo();
        $stmt = $db->prepare("
            SELECT 1 FROM company_user cu
            JOIN roles r ON r.id = cu.role_id
            WHERE cu.user_id = ? AND LOWER(r.name) = 'superadmin'
            LIMIT 1
        ");
        $stmt->execute([$uid]);
        if (!$stmt->fetchColumn()) {
            json_err('Forbidden', 403);
        }

        try {
            $stmt = $db->query("
                SELECT pi.*, c.name AS company_name, c.email AS company_email
                FROM platform_invoices pi
                JOIN companies c ON c.id = pi.company_id
                ORDER BY pi.created_at DESC
            ");
            json_ok($stmt->fetchAll(\PDO::FETCH_ASSOC));
        } catch (\Throwable $e) {
            json_err('Database error: ' . $e->getMessage(), 500);
        }
    }

           public function store(): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $db = Database::pdo();
        
        $stmt = $db->prepare("
            SELECT 1 FROM company_user cu
            JOIN roles r ON r.id = cu.role_id
            WHERE cu.user_id = ? AND LOWER(r.name) = 'superadmin'
            LIMIT 1
        ");
        $stmt->execute([$uid]);
        if (!$stmt->fetchColumn()) {
            json_err('Forbidden', 403);
        }

        $input = input();
        $companyId = (int) ($input['company_id'] ?? 0);
        $amount = (float) ($input['amount'] ?? 0);
        $dueDate = $input['due_date'] ?? '';

        if (!$companyId || $amount <= 0 || !$dueDate) {
            json_err('Company, amount and due date are required', 422);
        }

        $companyStmt = $db->prepare("SELECT name, email FROM companies WHERE id = ? LIMIT 1");
        $companyStmt->execute([$companyId]);
        $company = $companyStmt->fetch();

        if (!$company) {
            json_err('Company not found', 404);
        }

        $invoiceNumber = 'INV-' . date('Ymd') . '-' . strtoupper(bin2hex(random_bytes(3)));

        $stmt = $db->prepare("
            INSERT INTO platform_invoices (company_id, invoice_number, amount, due_date)
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([$companyId, $invoiceNumber, $amount, $dueDate]);

        if (!empty($company['email'])) {
            try {
                $subject = "New invoive from Bookwise: {$invoiceNumber}";
                $body = "
                    <h2>Hello {$company['name']},</h2>
                    <p> You have a new billing for your Bookwise subscription.</p>
                    <p><strong>Billing number:</strong> {$invoiceNumber}</p>
                    <p><strong>Total:</strong> €{$amount}</p>
                    <p><strong>Due date:</strong> {$dueDate}</p>
                    <p>Please,make the payment within the deadline.</p>
                    <p>Thank you!</p>
                ";

                \App\Utils\TenantMailer::send($companyId, $company['email'], $subject, $body);
            } catch (\Throwable $e) {
                error_log('Failed to send invoice email: ' . $e->getMessage());
            }
        }

        json_ok(['message' => 'Invoice created successfully', 'invoice_number' => $invoiceNumber], 201);
    }

        public function markPaid(array $params): void{
            $uid=auth_user_id();

            if(!$uid)json_err('Unauthorized',401);

            $db=Database::pdo();

            $stmt=$db->prepare(" SELECT 1 FROM company_user cu JOIN roles r ON r.id= cu.role_id
            WHERE cu.user_id = ? AND LOWER(r.name) = 'superadmin' 
            LIMIT 1");
            $stmt->execute([$uid]);
            if(!$stmt->fetchColumn()){
                json_err('Forbidden',403);
            }

            $id=(int) $params['id'];
            $db->prepare("UPDATE platform_invoices SET status = 'paid',paid_at = NOW() WHERE id=?")->execute([$id]);

            json_ok(['message' => 'Invoice marked as paid']);
        }

     public function myInvoices(array $params): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $companyId = (int) $params['companyId'];
        if (!Company::userBelongsTo($uid, $companyId)) {
            json_err('Forbidden', 403);
        }

        $db = Database::pdo();
        $stmt = $db->prepare("
            SELECT * FROM platform_invoices 
            WHERE company_id = ? 
            ORDER BY created_at DESC
        ");
        $stmt->execute([$companyId]);
        json_ok($stmt->fetchAll(\PDO::FETCH_ASSOC));
    }
        }