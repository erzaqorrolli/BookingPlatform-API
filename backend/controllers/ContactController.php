<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Models\ContactMessage;
use App\Models\User;
use App\Utils\Mailer;

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

        $stmt = $db->prepare("INSERT INTO deletion_requests (company_id, requested_by VALUES(?,?)");
        $stmt->execute([$companyId,$uid]);

        $superAdmins = $db->query("SELECT cu.user_id FROM company_user cu JOIN
        roles r ON r.id = cu.role_id 
        WHERE r.name ='superadmin'")->fetchAll(\PDO::FETCH_COLUMN);

        foreach($superAdmins as $saId){
            \App\Models\Notification::create( (int) $saId, 'deletion_request','Request to delete company',"Company owner '{$companyName}' requested to delete account.", "/admin/superadmin/companies");
        }

        json_ok(['message' =>'Request sent successfully!']);
}


    
        public function sendEmailByType(): void{

        $uid=auth_user_id();

        if(!$uid) json_err('Unauthorized',401);

        $input=input();
        $companyId=(int) ($input['companyId'] ?? 0);
        $type=$input['type'] ?? '';
        $subject=$input['subject'] ?? '';
        $body=$input['body'] ?? '';

        if(!$companyId || !$type || !$subject || !$body){
            json_err('Missing required fields',422);
        }

        $db=Database::pdo();
        $customers=[];

        if($type === 'comeback'){

        $stmt=$db->prepare("
        SELECT DISTINCT u.id,u.name,u.email
        FROM users u
        JOIN bookings b ON b.customer_id=u.id
        WHERE b.company_id = ? 
        AND u.id NOT IN (
        SELECT customer_id FROM bookings 
        WHERE company_id = ? AND booking_date >= DATE_SUB(NOW(),INTERVAL 90 DAY)
        )
        ");

        $stmt->execute([$companyId,$companyId]);
        $customers = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } elseif($type === 'new_clients'){
            $stmt = $db->prepare(
                " SLECT DISTINCT u.id,u.name,u.email
                FROM users u 
                JOIN bookings b ON b.customer_id = u.id
                WHERE b.company_id= ? AND u.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)"
            );

            $stmt->execute([$companyId]);
            $customers = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } else{
            $stmt = $db->prepare(" SELECT DISTINCT u.id,u.name,u.email
            FROM users u
            JOIN bookings b ON b.customer_id=u.id
            WHERE b.company_id=?");
            $stmt->execute([$companyId]);
            $customers = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        }

        if(empty($customers)){
            json_err('No customers found for this campaign type',404);
        }

        $sent=0;
        foreach($customers as $customer){
            try{
            \App\Utils\Mailer::send($customer['email'], $subject,$body);
            $sent++;    
            }catch(\Throwable $e){
                error_log("Failed to send email to {$customer['email']}: " . $e->getMessage());
            }
        }

        json_ok([
            'message' =>'Campaign processed',
            'sent' => $sent,
            'total' => count($customer)
        ]);
        }
}