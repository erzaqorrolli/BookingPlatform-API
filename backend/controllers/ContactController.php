<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Models\ContactMessage;
use App\Models\Company;
use App\Models\User;
use App\Utils\Mailer;
use App\Config\Database;

class ContactController
{
    public function store(): void
    {
        $input = input();

        $name    = trim((string) ($input['name'] ?? ''));
        $email   = strtolower(trim((string) ($input['email'] ?? '')));
        $subject = trim((string) ($input['subject'] ?? ''));
        $message = trim((string) ($input['message'] ?? ''));

        if ($name === '') json_err('Name is required', 422);
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) json_err('Valid email required', 422);
        if ($subject === '') json_err('Subject is required', 422);
        // if (strlen($message) < 10) json_err('Message must be at least 10 characters', 422);

        $contactMessage = ContactMessage::create([
            'name'    => $name,
            'email'   => $email,
            'subject' => $subject,
            'message' => $message,
        ]);

        try {
            $adminEmail = $_ENV['MAIL_FROM'] ?? 'info@bookwise.com';
            Mailer::send(
                $adminEmail,
                "Contact: $subject",
                "<p><strong>From:</strong> $name &lt;$email&gt;</p>
                 <p><strong>Subject:</strong> $subject</p>
                 <p><strong>Message:</strong></p>
                 <p>" . nl2br(htmlspecialchars($message)) . "</p>"
            );
        } catch (\Throwable $e) {
            error_log('Contact email failed: ' . $e->getMessage());
        }

        json_ok([
            'message' => 'Message sent successfully',
            'id'      => $contactMessage->id,
        ], 201);
    }

    public function index(): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $user = User::findById($uid);
        if (!$user || !$this->isSuperAdmin($user)) {
            json_err('Forbidden', 403);
        }

        $messages = ContactMessage::forAdmin([
            'status' => $_GET['status'] ?? null,
            'search' => $_GET['search'] ?? null,
        ]);

        json_ok(array_map(fn($m) => $m->toArray(), $messages));
    }

    public function show(array $params): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $user = User::findById($uid);
        if (!$user || !$this->isSuperAdmin($user)) {
            json_err('Forbidden', 403);
        }

        $message = ContactMessage::findById((int) $params['id']);
        if (!$message) json_err('Message not found', 404);

        $message->markAsRead();

        json_ok($message->toArray());
    }

    public function update(array $params): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $user = User::findById($uid);
        if (!$user || !$this->isSuperAdmin($user)) {
            json_err('Forbidden', 403);
        }

        $message = ContactMessage::findById((int) $params['id']);
        if (!$message) json_err('Message not found', 404);

        $input = input();

        if (!empty($input['status'])) {
            $message->updateStatus($input['status']);
        }

        if (array_key_exists('notes', $input)) {
            $message->updateNotes($input['notes']);
        }

        json_ok(ContactMessage::findById($message->id)->toArray());
    }

    public function destroy(array $params): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $user = User::findById($uid);
        if (!$user || !$this->isSuperAdmin($user)) {
            json_err('Forbidden', 403);
        }

        $message = ContactMessage::findById((int) $params['id']);
        if (!$message) json_err('Message not found', 404);

        $message->delete();

        json_ok(['message' => 'Message deleted']);
    }

    private function isSuperAdmin(User $user): bool
    {
        $db = \App\Config\Database::pdo();
        $stmt = $db->prepare("
            SELECT r.name FROM company_user cu
            JOIN roles r ON r.id = cu.role_id
            WHERE cu.user_id = ?
        ");
        $stmt->execute([$user->id]);
        $roles = $stmt->fetchAll(\PDO::FETCH_COLUMN);

        return in_array('superadmin', $roles, true);
    }

    public function requestDeletion(array $params): void{
        $uid=auth_user_id();
        if(!$uid)json_err('Unauthorized',403);
    
        $companyId=(int) $params['id'];

        $role=Company::userRole($uid,$companyId);
        if($role !=='owner'){
            json_err('Only the owner can request deletion',403);
        }

        $db=Database::pdo();

        $stmt=$db->prepare("SELECT name FROM companies WHERE id=?");
        $stmt->execute([$companyId]);
        $companyName = $stmt->fetchColumn();

        if(!$companyName) json_err('Company not found',404);

        $stmt =$db->prepare("SELECT 1 FROM deletion_requests WHERE company_id =? AND status = 'pending'");
        $stmt->execute([$companyId]);
        if($stmt->fetchColumn()){
            json_err('You already have a pending deletion request.',422);
        }

        $stmt = $db->prepare("INSERT INTO deletion_requests (company_id, requested_by) VALUES (?, ?)");
        $stmt->execute([$companyId,$uid]);

        $superAdmins = $db->query("SELECT cu.user_id FROM company_user cu JOIN
        roles r ON r.id = cu.role_id 
        WHERE r.name ='superadmin'")->fetchAll(\PDO::FETCH_COLUMN);

        foreach($superAdmins as $saId){
            \App\Models\Notification::create(
                (int) $saId,
                'deletion_request',
                'Request to delete company',
                "Company owner '{$companyName}' requested to delete account.",
                "/admin/superadmin/companies",
                $companyId
            );
        }

        json_ok(['message' =>'Request sent successfully!']);
}
        public function sendEmailByType(): void {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $input = input();
        $companyId = (int) ($input['company_id'] ?? 0);
        $type = $input['type'] ?? '';
        $subject = $input['subject'] ?? '';
        $body = $input['body'] ?? '';
        $coupon = $input['coupon'] ?? '';
        $template = $input['template'] ?? 'custom';
        
        $discountAmount = (float) ($input['discount_amount'] ?? 10);
        $usageLimit = (int) ($input['usage_limit'] ?? 100);
        $validFrom = $input['valid_from'] ?? date('Y-m-d');
        $validUntil = $input['valid_until'] ?? date('Y-m-d', strtotime('+30 days'));

        if (
            !$companyId
            || !in_array($type, ['new_clients', 'existing_clients', 'comeback'], true)
            || !$subject
            || !$body
        ) {
            json_err('Missing required fields', 422);
        }

        if (!Company::userBelongsTo($uid, $companyId)) {
            json_err('Forbidden', 403);
        }

        $role = Company::userRole($uid, $companyId);
        if (!in_array($role, ['owner', 'admin', 'manager'], true)) {
            $permissionStmt = Database::pdo()->prepare("
                SELECT 1
                FROM company_user_custom_roles cu
                JOIN company_role_permissions p ON p.role_id = cu.custom_role_id
                WHERE cu.company_id = ? AND cu.user_id = ?
                  AND p.permission_key = 'staff_can_manage_marketing'
                  AND p.enabled = 1
                LIMIT 1
            ");
            $permissionStmt->execute([$companyId, $uid]);
            if (!$permissionStmt->fetchColumn()) {
                json_err('You do not have permission to manage marketing', 403);
            }
        }

        $db = Database::pdo();

        if ($type === 'comeback') {
            $stmt = $db->prepare("
                SELECT DISTINCT c.id, c.name, c.email
                FROM customers c
                JOIN bookings b ON b.customer_id = c.id AND b.company_id = c.company_id
                WHERE c.company_id = ?
                  AND c.email IS NOT NULL
                  AND TRIM(c.email) <> ''
                  AND NOT EXISTS (
                    SELECT 1
                    FROM bookings recent
                    WHERE recent.customer_id = c.id
                      AND recent.company_id = c.company_id
                      AND recent.booking_date >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
                )
            ");
            $stmt->execute([$companyId]);
        } 
        elseif ($type === 'new_clients') {
            $stmt = $db->prepare("
                SELECT c.id, c.name, c.email
                FROM customers c
                JOIN bookings b ON b.customer_id = c.id AND b.company_id = c.company_id
                WHERE c.company_id = ?
                  AND c.email IS NOT NULL
                  AND TRIM(c.email) <> ''
                GROUP BY c.id, c.name, c.email
                HAVING MIN(b.booking_date) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            ");
            $stmt->execute([$companyId]);
        } 
        else { 
            $stmt = $db->prepare("
                SELECT c.id, c.name, c.email
                FROM customers c
                WHERE c.company_id = ?
                  AND c.email IS NOT NULL
                  AND TRIM(c.email) <> ''
            ");
            $stmt->execute([$companyId]);
        }

        $customers = array_values(array_filter(
            $stmt->fetchAll(\PDO::FETCH_ASSOC),
            static fn(array $customer): bool => filter_var($customer['email'], FILTER_VALIDATE_EMAIL) !== false
        ));

        if (empty($customers)) {
            json_err('No customers found for this campaign type', 404);
        }

        if (!empty($coupon)) {
            $stmtCheck = $db->prepare("SELECT id FROM discounts WHERE code = ? AND company_id = ?");
            $stmtCheck->execute([$coupon, $companyId]);
            $existing = $stmtCheck->fetch();
            
            if (!$existing) {
                $stmtInsert = $db->prepare("
                    INSERT INTO discounts 
                    (company_id, code, type, value, valid_from, valid_to, usage_limit, used_count, active, campaign_type)
                    VALUES (?, ?, 'percent', ?, ?, ?, ?, 0, 1, ?)
                ");
                $stmtInsert->execute([
                    $companyId, 
                    $coupon, 
                    $discountAmount, 
                    $validFrom, 
                    $validUntil, 
                    $usageLimit,
                    $template
                ]);
            }
        }

        $sent = 0;
        $failed = 0;
        foreach ($customers as $customer) {
            $mailError = null;
            if (\App\Utils\TenantMailer::send($companyId, $customer['email'], $subject, $body, $mailError)) {
                $sent++;
            } else {
                $failed++;
                error_log("Marketing campaign email failed for company $companyId to {$customer['email']}: " . ($mailError ?? 'Unknown email delivery error'));
            }
        }

        json_ok([
            'message' => 'Campaign processed',
            'sent' => $sent,
            'failed' => $failed,
            'total' => count($customers),
            'discount_code' => $coupon 
        ]);
    }
    
}