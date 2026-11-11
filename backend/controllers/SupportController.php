<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Config\Database;
use App\Models\Company;

class SupportController
{
    public function create(): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $input = input();
        $companyId = (int) ($input['company_id'] ?? 0);
        $subject = trim($input['subject'] ?? '');
        $message = trim($input['message'] ?? '');
        $priority = $input['priority'] ?? 'normal'; 

        if (!$companyId || !$subject || !$message) {
            json_err('Company, subject and message are required', 422);
        }

        $role=Company::userRole($uid,$companyId);
        
        $db = Database::pdo();
        
        
        $stmt = $db->prepare("
            INSERT INTO support_tickets (company_id, user_id, subject, message, priority,created_by_role)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        
        
        $stmt->execute([$companyId, $uid, $subject, $message, $priority,$role]);

        
        json_ok(['message' => 'Ticket created successfully', 'id' => (int) $db->lastInsertId()], 201);
    }

      public function index(): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $db = Database::pdo();

        $stmt = $db->prepare("
            SELECT r.name 
            FROM company_user cu 
            JOIN roles r ON r.id = cu.role_id 
            WHERE cu.user_id = ? AND r.name = 'superadmin'
            LIMIT 1
        ");
        $stmt->execute([$uid]);
        $isSuperAdmin = $stmt->fetchColumn();

        if (!$isSuperAdmin) {
            $companyId = (int) ($_GET['company_id'] ?? 0);
            if (!$companyId) json_err('Company ID is required', 422);

                $stmt = $db->prepare("
                SELECT t.*, c.name AS company_name, u.name AS user_name, u.email AS user_email
                FROM support_tickets t
                JOIN companies c ON c.id = t.company_id
                JOIN users u ON u.id = t.user_id
                WHERE t.company_id = ?
                ORDER BY t.created_at DESC
            ");
            $stmt->execute([$companyId]);

            json_ok($stmt->fetchAll(\PDO::FETCH_ASSOC));
            return;
        }

                 $stmt = $db->query("
                SELECT t.*, c.name AS company_name, u.name AS user_name, u.email AS user_email
                FROM support_tickets t
                JOIN companies c ON c.id = t.company_id
                JOIN users u ON u.id = t.user_id
                ORDER BY 
                    FIELD(t.status, 'open', 'in_progress', 'resolved', 'closed'),
                    FIELD(t.priority, 'urgent', 'high', 'normal', 'low'),
                    t.created_at DESC
            ");
        json_ok($stmt->fetchAll(\PDO::FETCH_ASSOC));
    }

    public function show(array $params): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $ticketId = (int) $params['id'];
        $db = Database::pdo();

        $stmt = $db->prepare("
            SELECT t.*, c.name as company_name, u.name as user_name, u.email as user_email 
            FROM support_tickets t 
            JOIN companies c ON c.id = t.company_id 
            JOIN users u ON u.id = t.user_id
            WHERE t.id = ?
        ");
        $stmt->execute([$ticketId]);
        $ticket = $stmt->fetch();

        if (!$ticket) json_err('Ticket not found', 404);

        $stmt = $db->prepare("
            SELECT r.*, u.name as user_name, u.email as user_email 
            FROM support_ticket_replies r 
            JOIN users u ON u.id = r.user_id 
            WHERE r.ticket_id = ? 
            ORDER BY r.created_at ASC
        ");
        $stmt->execute([$ticketId]);
        $replies = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        json_ok(['ticket' => $ticket, 'replies' => $replies]);
    }

    public function reply(array $params): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $ticketId = (int) $params['id'];
        $input = input();
        $message = trim($input['message'] ?? '');
        $isAdminReply = !empty($input['is_admin_reply']) ? 1 : 0;
        error_log('REPLY DEBUG: ticketId=' . $ticketId . ' | userId=' . $uid . ' | message=' . $message . ' | isAdminReply=' . $isAdminReply);


        if (!$message) json_err('Message is required', 422);

        $db = Database::pdo();
        
        $stmt = $db->prepare("
            INSERT INTO support_ticket_replies (ticket_id, user_id, message, is_admin_reply) 
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([$ticketId, $uid, $message, $isAdminReply]);

        if ($isAdminReply) {
            $db->prepare("UPDATE support_tickets SET status = 'in_progress' WHERE id = ? AND status = 'open'")
               ->execute([$ticketId]);
        }

        json_ok(['message' => 'Reply added successfully'], 201);
    }


   public function updateStatus(array $params): void
{
    $uid = auth_user_id();
    if (!$uid) json_err('Unauthorized', 401);

    $user = \App\Models\User::findById($uid); 
    if (!$user || $user->role !== 'superadmin') {
        json_err('Only Super Admin can change ticket status', 403);
    }

    $ticketId = (int) $params['id'];
    $input = input();
    $status = $input['status'] ?? '';

    $validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    if (!in_array($status, $validStatuses)) {
        json_err('Invalid status', 422);
    }

    $db = Database::pdo();
    
    $stmt = $db->prepare("SELECT status FROM support_tickets WHERE id = ?");
    $stmt->execute([$ticketId]);
    $oldStatus = $stmt->fetchColumn();

    if ($oldStatus === $status) {
        json_ok(['message' => 'Status is already ' . $status]);
        return;
    }

    $stmt = $db->prepare("UPDATE support_tickets SET status = ? WHERE id = ?");
    $stmt->execute([$status, $ticketId]);

    $statusMessages = [
        'open' => 'Ticket has been reopened. We will look into it shortly.',
        'in_progress' => 'Your ticket is now being reviewed by our team.',
        'resolved' => 'Your ticket has been marked as resolved. If you have further questions, feel free to reply.',
        'closed' => 'This ticket has been closed. Thank you for contacting us!',
    ];

    $autoMessage = $statusMessages[$status] ?? 'Status changed to ' . $status;

    $stmt = $db->prepare("
        INSERT INTO support_ticket_replies (ticket_id, user_id, message, is_admin_reply) 
        VALUES (?, ?, ?, 1)
    ");
    $stmt->execute([$ticketId, $uid, $autoMessage]);

    json_ok(['message' => 'Status updated and client notified']);
}
          public function impersonate (array $params): void{


            $uid=auth_user_id();
            if(!$uid)json_err('Unauthorized',401);
            
            $db=Database::pdo();

            $stmt=$db->prepare("
            SELECT r.name
            FROM company_user cu 
            JOIN roles r ON r.id = cu.role_id
            WHERE cu.user_id=? AND r.name ='superadmin'
            LIMIT 1

            ");

            $stmt->execute([$uid]);
            if(!$stmt->fetchColumn()) {
                json_err('Forbidden: Only superadmin can impersonate',403);

            }
            $companyId=(int) $params['companyId'];
            $stmt=$db->prepare("SELECT u.* FROM users u 
            JOIN company_user cu ON cu.user_id = u.id
            JOIN roles r ON r.id = cu.role_id
            WHERE cu.company_id = ? AND r.name = 'owner' LIMIT 1");

            $stmt->execute([$companyId]);

            $owner=$stmt->fetch();

            if(!$owner){
                json_err('Company owner not found',404);
            }

            $accessExpiresIn=3600;
            $accessToken = jwt_encode(['uid' => (int) $owner['id'],'exp' => time() + $accessExpiresIn]);

            $refreshToken = \App\Models\RefreshToken::create((int) $owner['id']);

            json_ok([
            'user' => [
                'id' => (int) $owner['id'],
                'name'=> $owner['name'],
                'email'=> $owner['email'],
            ],
            'access_token'=>$accessToken,
            'refresh_token'=>$refreshToken,
            'expires_in'=>$accessExpiresIn,

            ]);

            }

    }