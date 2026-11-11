<?php
declare(strict_types=1);

namespace App\Utils;

use App\Config\Database;
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

class TenantMailer
{
    public static function send(int $companyId, string $toEmail, string $subject, string $body): bool
    {
        $db = Database::pdo();
        $stmt = $db->prepare("SELECT * FROM company_settings WHERE company_id = ?");
        $stmt->execute([$companyId]);
        $settings = $stmt->fetch();

        if (!$settings || empty($settings['smtp_host'])) {
            throw new \Exception("SMTP settings not found in database for company ID: $companyId");
        }

        $mail = new PHPMailer(true);

        try {
            $mail->isSMTP();
            $mail->Host       = $settings['smtp_host'];
            $mail->SMTPAuth   = true;
            $mail->Username   = $settings['smtp_user'];
            $mail->Password   = $settings['smtp_pass'];
            
            if (!empty($settings['smtp_encryption']) && $settings['smtp_encryption'] !== 'none') {
                $mail->SMTPSecure = $settings['smtp_encryption'];
            }
            
            $mail->Port       = (int) $settings['smtp_port'];

            $senderEmail = !empty($settings['from_email']) ? $settings['from_email'] : $settings['smtp_user'];
            $senderName = !empty($settings['from_name']) ? $settings['from_name'] : 'Booking Platform';

            $mail->setFrom($senderEmail, $senderName);
            $mail->addAddress($toEmail);

            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body    = $body;

            $mail->send();

            $db->prepare("
                INSERT INTO email_messages (company_id, customer_email, subject, body, direction, from_email) 
                VALUES (?, ?, ?, ?, 'outbound', ?)
            ")->execute([$companyId, $toEmail, $subject, $body, $senderEmail]);
            return true;
        } catch (Exception $e) {
            throw new \Exception("SMTP Error: " . $mail->ErrorInfo);
        }
    }

    // --- KJO METODË TË MUNGONTE ---
    private static function template(string $title, string $content): string
    {
        $year = date('Y');
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
                            © $year BookWise Booking-Platform
                        </td></tr>
                    </table>
                </td></tr>
            </table>
        </body>
        </html>";
    }

    public static function sendBookingConfirmation(
        int $companyId,
        string $email,
        string $name,
        array $booking
    ): bool {
        // Rregullimi i datës: marrim datën nga DB dhe e konvertojmë në format të lexueshëm
        $date = !empty($booking['booking_date']) ? date('d.m.Y', strtotime($booking['booking_date'])) : '—';
        $time = !empty($booking['start_time']) ? substr($booking['start_time'], 0, 5) : '—';
        $reference = $booking['reference'] ?? ('#' . $booking['id']);

        $content = "
            <p>Hello <strong>{$name}</strong>,</p>
            <p>Your booking has been processed successfully!</p>
            <div style='background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0;'>
                <table style='width: 100%; font-size: 14px;'>
                    <tr><td style='color: #64748b; padding: 6px 0;'>Reference:</td><td style='font-weight: 600;'>{$reference}</td></tr>
                    <tr><td style='color: #64748b; padding: 6px 0;'>Service:</td><td style='font-weight: 600;'>{$booking['service_name']}</td></tr>
                    <tr><td style='color: #64748b; padding: 6px 0;'>Date:</td><td style='font-weight: 600;'>{$date}</td></tr>
                    <tr><td style='color: #64748b; padding: 6px 0;'>Time:</td><td style='font-weight: 600;'>{$time}</td></tr>
                    <tr><td style='color: #64748b; padding: 6px 0;'>Total:</td><td style='font-weight: 600;'>€{$booking['total_price']}</td></tr>
                </table>
            </div>
        ";

        $body = self::template('Booking Accepted', $content);
        return self::send($companyId, $email, "Booking {$reference} has been accepted", $body);
    }

    public static function sendNewBookingToOwner(
        int $companyId,
        string $email,
        string $ownerName,
        array $booking
    ): bool {
        $date = !empty($booking['booking_date']) ? date('d.m.Y', strtotime($booking['booking_date'])) : '—';
        $time = !empty($booking['start_time']) ? substr($booking['start_time'], 0, 5) : '—';
        $reference = $booking['reference'] ?? ('#' . $booking['id']);

        $content = "
            <p>Hello <strong>{$ownerName}</strong>,</p>
            <p>You have received a new booking!</p>
            <div style='background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0;'>
                <table style='width: 100%; font-size: 14px;'>
                    <tr><td style='color: #64748b; padding: 6px 0;'>Reference:</td><td style='font-weight: 600;'>{$reference}</td></tr>
                    <tr><td style='color: #64748b; padding: 6px 0;'>Client:</td><td style='font-weight: 600;'>{$booking['customer_name']}</td></tr>
                    <tr><td style='color: #64748b; padding: 6px 0;'>Email:</td><td style='font-weight: 600;'>{$booking['customer_email']}</td></tr>
                    <tr><td style='color: #64748b; padding: 6px 0;'>Service:</td><td style='font-weight: 600;'>{$booking['service_name']}</td></tr>
                    <tr><td style='color: #64748b; padding: 6px 0;'>Date:</td><td style='font-weight: 600;'>{$date}</td></tr>
                    <tr><td style='color: #64748b; padding: 6px 0;'>Time:</td><td style='font-weight: 600;'>{$time}</td></tr>
                </table>
            </div>
        ";

        $body = self::template('New Booking', $content);
        return self::send($companyId, $email, "New booking {$reference}", $body);
    }

    public static function sendStatusUpdate(
        int $companyId,
        string $email,
        string $name,
        string $reference,
        string $status
    ): bool {
        $labels = [
            'pending'   => 'Waiting',
            'waiting'   => 'Waiting',
            'confirmed' => 'Confirmed',
            'cancelled' => 'Cancelled',
            'completed' => 'Done',
            'no_show'   => 'Absent',
        ];
        $label = $labels[$status] ?? $status;
        $subject = "Booking {$reference}: {$label}";

        $content = "
            <p>Hello <strong>{$name}</strong>,</p>
            <p>The status of your booking has been updated to: <strong>{$label}</strong>.</p>
            <div style='background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center;'>
                <p style='color: #64748b; font-size: 13px; margin: 0 0 6px;'>Booking Reference</p>
                <p style='font-family: monospace; font-size: 22px; font-weight: 700; color: #4f46e5; margin: 0;'>{$reference}</p>
            </div>
        ";

        $body = self::template('Booking Status Updated', $content);
        return self::send($companyId, $email, $subject, $body);
    }
}