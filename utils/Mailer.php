<?php
declare(strict_types=1);

namespace App\Utils;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

class Mailer
{
    private static function createMailer(): PHPMailer
    {
        $mail = new PHPMailer(true);

        $mail->isSMTP();
        $mail->Host       = $_ENV['MAIL_HOST'] ?? 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = $_ENV['MAIL_USERNAME'] ?? '';
        $mail->Password   = $_ENV['MAIL_PASSWORD'] ?? '';
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = (int) ($_ENV['MAIL_PORT'] ?? 587);
        $mail->CharSet    = 'UTF-8';

        $mail->setFrom(
            $_ENV['MAIL_FROM'] ?? 'noreply@booking.local',
            $_ENV['MAIL_FROM_NAME'] ?? 'Booking Platform'
        );

        return $mail;
    }

    public static function send(string $to, string $subject, string $htmlBody): bool
    {
        try {
            $mail = self::createMailer();
            $mail->addAddress($to);
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body    = $htmlBody;
            $mail->AltBody = strip_tags($htmlBody);

            $mail->send();

            @file_put_contents(
                __DIR__ . '/../storage/mail.log',
                sprintf("[%s]  SENT to %s | %s\n", date('c'), $to, $subject),
                FILE_APPEND
            );

            return true;
        } catch (Exception $e) {
            @file_put_contents(
                __DIR__ . '/../storage/mail.log',
                sprintf("[%s] ✗ FAILED to %s | %s | Error: %s\n", date('c'), $to, $subject, $e->getMessage()),
                FILE_APPEND
            );

            return false;
        }
    }

    public static function sendVerification(string $email, string $name, string $token): void
    {
        $link = ($_ENV['FRONTEND_URL'] ?? 'http://localhost:5173') . "/verify?token=$token";
        $body = self::template('Verifiko Email-in', "
            <p>Hello <strong>$name</strong>,</p>
            <p>Thank you for registering in BookWise - Booking Platform</p>
            <p style='text-align: center; margin: 30px 0;'>
                <a href='$link' style='background: #4f46e5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;'>Verifiko Email-in</a>
            </p>
            <p style='color: #64748b; font-size: 14px;'>Linku: $link</p>
        ");
        self::send($email, 'Verifiko Email-in', $body);
    }

    public static function sendPasswordReset(string $email, string $name, string $token): void
    {
        $link = ($_ENV['FRONTEND_URL'] ?? 'http://localhost:5173') . "/reset?token=$token";
        $body = self::template('Reset Password', "
            <p>Hello <strong>$name</strong>,</p>
            <p>We recieved a request to change the password. Was that you?</p>
            <p style='text-align: center; margin: 30px 0;'>
                <a href='$link' style='background: #4f46e5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;'>Reset Password</a>
            </p>
            <p style='color: #64748b; font-size: 14px;'>Linku skadon pas 1 ore.</p>
        ");
        self::send($email, 'Reset Password', $body);
    }

    public static function sendBookingConfirmation(string $email, string $name, array $booking): void
    {
        $date = date('d.m.Y', strtotime($booking['booking_date']));
        $time = substr($booking['start_time'], 0, 5);
        $body = self::template('Rezervimi u pranua', "
            <p>Hello <strong>$name</strong>,</p>
            <p>Your booking has been processed successfully! </p>
            <div style='background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0;'>
                <table style='width: 100%; font-size: 14px;'>
                    <tr><td style='color: #64748b; padding: 6px 0;'>Number:</td><td style='font-weight: 600;'>#{$booking['id']}</td></tr>
                    <tr><td style='color: #64748b; padding: 6px 0;'>Service:</td><td style='font-weight: 600;'>{$booking['service_name']}</td></tr>
                    <tr><td style='color: #64748b; padding: 6px 0;'>Date:</td><td style='font-weight: 600;'>$date</td></tr>
                    <tr><td style='color: #64748b; padding: 6px 0;'>Time:</td><td style='font-weight: 600;'>$time</td></tr>
                    <tr><td style='color: #64748b; padding: 6px 0;'>Total:</td><td style='font-weight: 600;'>€{$booking['total_price']}</td></tr>
                </table>
            </div>
        ");
        self::send($email, "Reservation #{$booking['id']} has been accepted", $body);
    }

    public static function sendNewBookingToOwner(string $email, string $ownerName, array $booking): void
    {
        $date = date('d.m.Y', strtotime($booking['booking_date']));
        $time = substr($booking['start_time'], 0, 5);
        $body = self::template('Rezervim i re', "
            <p>Hello <strong>$ownerName</strong>,</p>
            <p>You have revieved a new booking!</p>
            <div style='background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0;'>
                <table style='width: 100%; font-size: 14px;'>
                    <tr><td style='color: #64748b; padding: 6px 0;'>Klienti:</td><td style='font-weight: 600;'>{$booking['customer_name']}</td></tr>
                    <tr><td style='color: #64748b; padding: 6px 0;'>Email:</td><td style='font-weight: 600;'>{$booking['customer_email']}</td></tr>
                    <tr><td style='color: #64748b; padding: 6px 0;'>Shërbimi:</td><td style='font-weight: 600;'>{$booking['service_name']}</td></tr>
                    <tr><td style='color: #64748b; padding: 6px 0;'>Data:</td><td style='font-weight: 600;'>$date</td></tr>
                    <tr><td style='color: #64748b; padding: 6px 0;'>Ora:</td><td style='font-weight: 600;'>$time</td></tr>
                </table>
            </div>
        ");
        self::send($email, "Rezervim i re #{$booking['id']}", $body);
    }

    public static function sendStatusUpdate(string $email, string $name, int $bookingId, string $status): void
    {
        $labels = [
            'confirmed' => 'Konfirmuar',
            'cancelled' => 'Anuluar',
            'completed' => 'Përfunduar',
            'no_show'   => 'Nuk u paraqit',
        ];
        $label = $labels[$status] ?? $status;

        $body = self::template('Booking status', "
            <p>Hello <strong>$name</strong>,</p>
            <p>Booking status <strong>#$bookingId</strong> changed to: <strong>$label</strong>.</p>
        ");
        self::send($email, "Booking #$bookingId: $label", $body);
    }

    private static function template(string $title, string $content): string
    {
        return "
        <!DOCTYPE html>
        <html>
        <head><meta charset='UTF-8'></head>
        <body style='margin: 0; padding: 0; font-family: Inter, -apple-system, sans-serif; background: #f1f5f9;'>
            <table width='100%' cellpadding='0' cellspacing='0' style='background: #f1f5f9; padding: 40px 20px;'>
                <tr><td align='center'>
                    <table width='600' cellpadding='0' cellspacing='0' style='background: white; border-radius: 16px; overflow: hidden;'>
                        <tr><td style='background: linear-gradient(135deg, #4f46e5, #9333ea); padding: 30px; text-align: center;'>
                            <h1 style='color: white; margin: 0; font-size: 22px;'>📅 BookingPlatform</h1>
                        </td></tr>
                        <tr><td style='padding: 40px 30px;'>
                            <h2 style='color: #0f172a; margin: 0 0 20px; font-size: 20px;'>$title</h2>
                            <div style='color: #334155; line-height: 1.7; font-size: 15px;'>$content</div>
                        </td></tr>
                        <tr><td style='background: #f8fafc; padding: 20px; text-align: center; color: #94a3b8; font-size: 13px;'>
                            © 2026 BookWise Booking-Platform
                        </td></tr>
                    </table>
                </td></tr>
            </table>
        </body>
        </html>";
    }
}