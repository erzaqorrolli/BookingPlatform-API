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
        $successUrl = $frontendUrl . '/booking-success/' . $bookingId;
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

    public function verifyCheckout(array $params): void
    {
        $bookingId = (int) ($params['bookingId'] ?? 0);
        $sessionId = trim((string) ($_GET['session_id'] ?? ''));

        if (!$bookingId || $sessionId === '') {
            json_err('Booking and checkout session are required', 422);
        }

        $booking = Booking::findById($bookingId);
        if (
            !$booking
            || $booking->payment_method !== 'card'
            || $booking->stripe_session_id !== $sessionId
        ) {
            json_err('Invalid checkout session', 403);
        }

        try {
            $session = (new StripeService())->retrieveCheckoutSession($sessionId);
        } catch (\Throwable $e) {
            error_log('Stripe checkout verification failed for booking ' . $bookingId . ': ' . $e->getMessage());
            json_err('Could not verify the card payment right now', 503);
        }

        $sessionBookingId = (int) ($session->metadata->booking_id ?? 0);
        $paid = (string) $session->id === $booking->stripe_session_id
            && $sessionBookingId === $bookingId
            && $session->payment_status === 'paid'
            && !empty($session->payment_intent);

        json_ok(['paid' => $paid]);
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
            if($booking && !empty($session->payment_intent)
                && $booking->confirmPayment((string) $session->payment_intent)){
                $db = \App\Config\Database::pdo();
                $bookingStmt = $db->prepare("
                    SELECT b.company_id, b.id, b.reference, b.booking_date, b.start_time,
                           b.total_price, b.status, b.payment_method,
                           cu.name AS customer_name, cu.email AS customer_email,
                           s.name AS service_name
                    FROM bookings b
                    JOIN customers cu ON cu.id = b.customer_id
                    JOIN services s ON s.id = b.service_id
                    WHERE b.id = ?
                    LIMIT 1
                ");
                $bookingStmt->execute([$bookingId]);
                $paymentDetails = $bookingStmt->fetch();

                if ($paymentDetails) {
                    if (!empty($paymentDetails['customer_email'])) {
                        $sent = \App\Utils\TenantMailer::sendPaymentReceivedToCustomer(
                            (int) $paymentDetails['company_id'],
                            $paymentDetails['customer_email'],
                            $paymentDetails['customer_name'],
                            $paymentDetails
                        );
                        if (!$sent) {
                            error_log('Payment receipt email could not be sent to customer for booking ' . $bookingId);
                        }
                    }

                    $ownerStmt = $db->prepare("
                        SELECT u.name, u.email
                        FROM company_user companyOwner
                        JOIN roles ownerRole ON ownerRole.id = companyOwner.role_id AND ownerRole.name = 'owner'
                        JOIN users u ON u.id = companyOwner.user_id
                        WHERE companyOwner.company_id = ?
                    ");
                    $ownerStmt->execute([(int) $paymentDetails['company_id']]);
                    foreach ($ownerStmt->fetchAll() as $owner) {
                        if (empty($owner['email'])) {
                            continue;
                        }

                        $sent = \App\Utils\TenantMailer::sendPaymentReceivedToOwner(
                            (int) $paymentDetails['company_id'],
                            $owner['email'],
                            $owner['name'],
                            $paymentDetails
                        );
                        if (!$sent) {
                            error_log('Payment receipt email could not be sent to owner for booking ' . $bookingId);
                        }
                    }
                } else {
                    error_log('Payment was confirmed but booking details could not be loaded for booking ' . $bookingId);
                }
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