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
        $priority = $input['priority'] ?? 'normal'; // RREGULLIMI: string, jo int

        if (!$companyId || !$subject || !$message) {
            json_err('Company, subject and message are required', 422);
        }

        $db = Database::pdo();
        
        // RREGULLIMI: support_tickets (jo suppoert_ticekts)
        $stmt = $db->prepare("
            INSERT INTO support_tickets (company_id, user_id, subject, message, priority)
            VALUES (?, ?, ?, ?, ?)
        ");
        
        // RREGULLIMI: Mungonte execute
        $stmt->execute([$companyId, $uid, $subject, $message, $priority]);

        // RREGULLIMI: lastInsertId me "I" të madhe
        json_ok(['message' => 'Ticket created successfully', 'id' => (int) $db->lastInsertId()], 201);
    }

    public function index(): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $role = Company::userRole($uid, 1); // Supozojmë superadmin në kompaninë 1

        if ($role !== 'superadmin') {
            $companyId = (int) ($_GET['company_id'] ?? 0);
            if (!$companyId) json_err('Company ID is required', 422);

            // RREGULLIMI: Database (jo Dataabse)
            $db = Database::pdo();

            $stmt = $db->prepare("
                SELECT t.*, c.name as company_name, u.name as user_name 
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

        $db = Database::pdo();

        $stmt = $db->query("
            SELECT t.*, c.name as company_name, u.name as user_name 
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

        $ticketId = (int) $params['id'];
        $input = input();
        $status = $input['status'] ?? '';

        if (!in_array($status, ['open', 'in_progress', 'resolved', 'closed'])) {
            json_err('Invalid status', 422);
        }

        $db = Database::pdo();
        $stmt = $db->prepare("UPDATE support_tickets SET status = ? WHERE id = ?");
        $stmt->execute([$status, $ticketId]);

        json_ok(['message' => 'Status updated successfully']);
    }
}