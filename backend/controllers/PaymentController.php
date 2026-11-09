<?php


    declare(strict_types=1);

    namespace App\Controllers;

    use App\Models\Booking;
    use App\Services\StripeService;
    use Exception;

    class PaymentController{

    public function createCheckout(): void {
    $input = json_decode(file_get_contents('php://input'),true);
    $bookingId=(int)($input['booking_id'] ?? 0);

    if(!$bookingId){
        http_response_code(400);
        echo json_encode(['error' => 'Booking ID not found']);
        return;
    }


    $booking=Booking::findById($bookingId);

    if(!$booking){
        http_response_code(404);

        echo json_encode(['error' => 'Booking not found']);
        return;
    }

    if($booking->status !=='pending'){
        http_response_code(400);
        echo json_encode(['error' => 'This booking is not awaiting payment']);
        return;
    }

    $customerEmail = null;

    try{
        $stripe = new StripeService();

        $frontendUrl = rtrim($_ENV['FRONTEND_URL'] ?? 'http://localhost:5173', '/');
        $successUrl = $frontendUrl . '/success';
        $cancelUrl = $frontendUrl . '/';

        $bookingDate = $booking->toArray();
        $bookingDate['customer_email'] = $customerEmail;

        $session = $stripe->createCheckoutSession($bookingDate,$successUrl,$cancelUrl);

        $booking->setStripeSession($session->id);

        echo json_encode([
            'success' => true,
            'checkout_url' => $session->url
        ]);

    }catch(Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }

    }

    public function webhook(): void {
        $payload= @file_get_contents('php://input');
        $sig_header = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';
        $endpoint_secret = $_ENV['STRIPE_WEBHOOK_SECRET']?? '';

        try{
            $event = \Stripe\Webhook::constructEvent($payload,$sig_header,$endpoint_secret);

        }catch(Exception $e){
            http_response_code(400);
            return;
        }

        if($event->type == 'checkout.session.completed'){
            $session = $event->data->object;
            $bookingId= (int)$session->metadata->booking_id;

            $booking=Booking::findById($bookingId);
            if($booking){
                $booking->confirmPayment($session->payment_intent);
            }
        }

        if($event->type === 'checkout.session.expired'){
            $session=$event->data->object;
            $bookingId=(int)$session->metadata->booking_id;

            $booking = Booking::findById($bookingId);
            if($booking && $booking->status === 'pending'){
                $booking->updateStatus('cancelled');
            }
        }
        http_response_code(200);
        echo json_encode(['recieved' => true]);
    }
    }