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
            UPDATE customers cu
            JOIN users u ON u.email = cu.email
            SET cu.user_id = ?
            WHERE cu.user_id IS NULL AND u.id = ?
        ");
        $stmt->execute([$uid, $uid]);

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

    public function cancelBooking(array $params): void
{
    $uid = auth_user_id();
    if (!$uid) json_err('Unauthorized', 401);

    $bookingId = (int) ($params['id'] ?? 0);
    if (!$bookingId) json_err('Booking ID required', 422);

    $booking = \App\Models\Booking::findById($bookingId);
    if (!$booking) json_err('Booking not found', 404);

    $db = \App\Config\Database::pdo();
    $stmt = $db->prepare("
        SELECT 1 FROM customers 
        WHERE id = ? AND user_id = ? 
        LIMIT 1
    ");
    $stmt->execute([$booking->customer_id, $uid]);
    if (!$stmt->fetchColumn()) {
        json_err('Forbidden', 403);
    }

    $input = input();
    $reason = trim((string) ($input['reason'] ?? ''));
    if (strlen($reason) < 3) {
        json_err('Please provide a reason (at least 3 characters)', 422);
    }

    if (!$booking->cancelByCustomer($reason)) {
        json_err('This booking cannot be cancelled (too late or invalid status)', 422);
    }

    try {
        $infoStmt = $db->prepare("
            SELECT b.reference, b.booking_date, b.start_time,
                   c.name AS customer_name, c.email AS customer_email,
                   s.name AS service_name,
                   u.email AS owner_email, u.name AS owner_name,
                   co.name AS company_name
            FROM bookings b
            JOIN customers c ON c.id = b.customer_id
            JOIN services s ON s.id = b.service_id
            JOIN companies co ON co.id = b.company_id
            JOIN company_user cu ON cu.company_id = b.company_id
            JOIN roles r ON r.id = cu.role_id AND r.name = 'owner'
            JOIN users u ON u.id = cu.user_id
            WHERE b.id = ?
            LIMIT 1
        ");
        $infoStmt->execute([$bookingId]);
        $info = $infoStmt->fetch();

        if ($info) {
            \App\Utils\Mailer::sendBookingCancellationToOwner(
                $info['owner_email'],
                $info['owner_name'],
                $info,
                $reason
            );
            \App\Utils\Mailer::sendBookingCancellationToCustomer(
                $info['customer_email'],
                $info['customer_name'],
                $info,
                $reason
            );
        }
    } catch (\Throwable $e) {
        error_log('Cancellation email failed: ' . $e->getMessage());
    }

    json_ok([
        'message' => 'Booking cancelled',
        'booking' => \App\Models\Booking::findById($bookingId)->toArray(),
    ]);
}
}