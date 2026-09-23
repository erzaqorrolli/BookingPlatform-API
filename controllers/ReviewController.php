<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Models\Review;
use App\Models\Booking;
use App\Models\Company;
use App\Config\Database;

class ReviewController
{
    /**
     * GET /api/companies/{companyId}/reviews
     * (publik)
     */
    public function index(array $params): void
    {
        $companyId = (int) $params['companyId'];
        $reviews = Review::forCompany($companyId, 50);
        $stats = Review::averageForCompany($companyId);

        json_ok([
            'reviews' => $reviews,
            'stats'   => $stats,
        ]);
    }

    /**
     * GET /api/me/reviews
     * Review-t e user-it
     */
    public function myReviews(): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $reviews = Review::forUser($uid);
        json_ok($reviews);
    }

    /**
     * GET /api/me/bookings-to-review
     * Bookings të kompletuara që s'kanë review
     */
    public function bookingsToReview(): void
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
                b.total_price,
                b.status,
                c.name AS company_name,
                c.slug AS company_slug,
                s.name AS service_name
            FROM bookings b
            JOIN customers cu ON cu.id = b.customer_id
            JOIN companies c ON c.id = b.company_id
            JOIN services s ON s.id = b.service_id
            LEFT JOIN reviews r ON r.booking_id = b.id
            WHERE cu.user_id = ?
              AND b.status = 'completed'
              AND r.id IS NULL
            ORDER BY b.booking_date DESC
        ");
        $stmt->execute([$uid]);

        json_ok($stmt->fetchAll());
    }

    /**
     * POST /api/me/reviews
     * Krijo review
     * Body: { booking_id, rating, comment }
     */
    public function store(): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $input = input();
        $bookingId = (int) ($input['booking_id'] ?? 0);
        $rating = (int) ($input['rating'] ?? 0);
        $comment = trim($input['comment'] ?? '');

        if (!$bookingId) json_err('Booking required', 422);
        if ($rating < 1 || $rating > 5) json_err('Rating must be 1-5', 422);

        // Kontrollo booking
        $booking = Booking::findById($bookingId);
        if (!$booking) json_err('Booking not found', 404);

        // Kontrollo që booking u takon user-it
        $db = Database::pdo();
        $stmt = $db->prepare("
            SELECT c.user_id 
            FROM bookings b
            JOIN customers c ON c.id = b.customer_id
            WHERE b.id = ?
        ");
        $stmt->execute([$bookingId]);
        $bookingUserId = $stmt->fetchColumn();

        if ((int) $bookingUserId !== $uid) {
            json_err('No access in this booking', 403);
        }

        if ($booking->status !== 'completed') {
            json_err('You can review only completed bookings', 422);
        }

        if (Review::findByBooking($bookingId)) {
            json_err('You have reviewed this booking', 409);
        }

        $review = Review::create([
            'company_id'  => $booking->company_id,
            'booking_id'  => $bookingId,
            'customer_id' => $booking->customer_id,
            'user_id'     => $uid,
            'service_id'  => $booking->service_id,
            'rating'      => $rating,
            'comment'     => $comment,
        ]);

        json_ok([
            'message' => 'Review added successfully',
            'review'  => $review->toArray(),
        ], 201);
    }


    public function destroy(array $params): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $id = (int) $params['id'];
        $review = Review::findById($id);

        if (!$review || $review->user_id !== $uid) {
            json_err('Review not found', 404);
        }

        $review->delete();
        json_ok(['message' => 'Review deleted']);
    }
}