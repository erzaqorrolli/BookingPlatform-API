<?php
declare(strict_types=1);

namespace App\Services;

use Stripe\Stripe;
use Stripe\Checkout\Session;
use Exception;

class StripeService
{
    public function __construct()
    {
        Stripe::setApiKey($_ENV['STRIPE_SECRET_KEY'] ?? '');
    }

    public function createCheckoutSession(array $booking, string $successUrl, string $cancelUrl): Session
    {
        try {
            return Session::create([
                'line_items' => [[
                    'price_data' => [
                        'currency' => 'eur',
                        'product_data' => [
                            'name' => 'Booking ' . $booking['reference'],
                            'description' => "Date: {$booking['booking_date']} | Time: {$booking['start_time']}",
                        ],
                        'unit_amount' => (int) round($booking['total_price'] * 100),
                    ],
                    'quantity' => 1,
                ]],
                'mode' => 'payment',
                'customer_email' => $booking['customer_email'] ?? null,
                'success_url' => $successUrl . '?session_id={CHECKOUT_SESSION_ID}',
                'cancel_url'  => $cancelUrl,
                'metadata' => [
                    'booking_id' => $booking['id'],
                    'reference'  => $booking['reference']
                ]
            ]);
        } catch (Exception $e) {
            throw new Exception("Stripe Error: " . $e->getMessage());
        }
    }
}