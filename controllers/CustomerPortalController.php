<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Config\Database;

class CustomerPortalController
{

    public function myBookings(): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $db = Database::pdo();
        $stmt = $db->prepare("
            SELECT 
                b.id,
                b.booking_date,
                b.start_time,
                b.end_time,
                b.status,
                b.total_price,
                b.notes,
                b.created_at,
                c.name AS company_name,
                c.slug AS company_slug,
                c.address AS company_address,
                s.name AS service_name,
                s.duration_minutes
            FROM bookings b
            JOIN customers cu ON cu.id = b.customer_id
            JOIN companies c ON c.id = b.company_id
            JOIN services s ON s.id = b.service_id
            WHERE cu.user_id = ?
            ORDER BY b.booking_date DESC, b.start_time DESC
        ");
        $stmt->execute([$uid]);

        json_ok($stmt->fetchAll());
    }
}