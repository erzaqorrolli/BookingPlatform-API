<?php
declare(strict_types=1);

namespace App\Utils;

use App\Config\Database;
use PHPMailer\PHPMailer\PHPMailer;

class TenantMailer
{
    public static function send(
        int $companyId,
        string $toEmail,
        string $subject,
        string $body,
        ?string &$error = null
    ): bool
    {
        $error = null;

        try {
            $db = Database::pdo();
            $stmt = $db->prepare("SELECT * FROM company_settings WHERE company_id = ?");
            $stmt->execute([$companyId]);
            $settings = $stmt->fetch();
        } catch (\Throwable $e) {
            error_log("TenantMailer settings lookup failed for company $companyId: " . $e->getMessage());
            $error = 'Could not load company SMTP settings.';
            return false;
        }

        if (!$settings || empty($settings['smtp_host'])) {
            return Mailer::send($toEmail, $subject, $body, $error);
        }

        $mail = null;
        try {
            $mail = new PHPMailer(true);
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
        } catch (\Throwable $e) {
            $failure = $mail instanceof PHPMailer && $mail->ErrorInfo
                ? $mail->ErrorInfo
                : $e->getMessage();
            $error = self::safeError($failure);
            error_log("TenantMailer SMTP Error for company $companyId: " . $failure);
            return false;
        }

        try {
            $db->prepare("
                INSERT INTO email_messages (company_id, customer_email, subject, body, direction, from_email) 
                VALUES (?, ?, ?, ?, 'outbound', ?)
            ")->execute([$companyId, $toEmail, $subject, $body, $senderEmail]);
        } catch (\Throwable $e) {
            error_log("TenantMailer could not save sent email for company $companyId: " . $e->getMessage());
        }

        return true;
    }

    private static function safeError(string $error): string
    {
        $error = preg_replace('/[\r\n]+/', ' ', $error) ?? 'Email delivery failed.';
        return substr($error, 0, 300);
    }

    private static function template(string $title, string $content): string
    {
        $year = date('Y');
        return "
        <!DOCTYPE html>
        <html>
        <head><meta charset='UTF-8'></head>
        <body style='margin: 0; padding: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif; background: #f1f5f9;'>
            <table width='100%' cellpadding='0' cellspacing='0' style='background: #f1f5f9; padding: 32px 16px;'>
                <tr><td align='center'>
                    <table width='600' cellpadding='0' cellspacing='0' style='width: 100%; max-width: 600px; background: white; border: 1px solid #e2e8f0; border-radius: 18px; overflow: hidden;'>
                        <tr><td style='background: #111827; padding: 24px 30px;'>
                            <p style='color: #c4b5fd; margin: 0 0 5px; font-size: 11px; font-weight: 700; letter-spacing: 2px;'>BOOKINGPLATFORM</p>
                            <h1 style='color: white; margin: 0; font-size: 20px; font-weight: 700;'>Your booking, beautifully managed</h1>
                        </td></tr>
                        <tr><td style='padding: 32px 30px;'>
                            <h2 style='color: #0f172a; margin: 0 0 18px; font-size: 22px; line-height: 1.3;'>$title</h2>
                            <div style='color: #334155; line-height: 1.7; font-size: 15px;'>$content</div>
                        </td></tr>
                        <tr><td style='background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 24px; text-align: center; color: #64748b; font-size: 12px;'>
                            © $year BookWise Booking Platform · This is an automated message
                        </td></tr>
                    </table>
                </td></tr>
            </table>
        </body>
        </html>";
    }

    private static function escape(string $value): string
    {
        return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }

    private static function detailRow(string $label, string $value, bool $emphasized = false): string
    {
        $labelColor = $emphasized ? '#475569' : '#64748b';
        $valueColor = $emphasized ? '#312e81' : '#0f172a';
        $fontWeight = $emphasized ? '700' : '600';

        return "
            <tr>
                <td style='color: {$labelColor}; padding: 9px 0; border-bottom: 1px solid #e2e8f0;'>{$label}</td>
                <td align='right' style='color: {$valueColor}; font-weight: {$fontWeight}; padding: 9px 0; border-bottom: 1px solid #e2e8f0;'>{$value}</td>
            </tr>
        ";
    }

    private static function bookingDetails(array $booking, bool $includeCustomer): string
    {
        $date = !empty($booking['booking_date']) ? date('D, d M Y', strtotime($booking['booking_date'])) : '—';
        $time = !empty($booking['start_time']) ? substr($booking['start_time'], 0, 5) : '—';
        $reference = self::escape((string) ($booking['reference'] ?? ('#' . ($booking['id'] ?? ''))));
        $service = self::escape((string) ($booking['service_name'] ?? 'Service'));
        $method = ($booking['payment_method'] ?? 'cash') === 'card' ? 'Card · Stripe' : 'Cash at appointment';
        $paymentStatus = ($booking['payment_method'] ?? 'cash') === 'card'
            ? (($booking['status'] ?? 'pending') === 'confirmed' ? 'Paid' : 'Awaiting payment')
            : 'Due at appointment';
        $total = '€' . number_format((float) ($booking['total_price'] ?? 0), 2);

        $rows = self::detailRow('Booking reference', $reference)
            . self::detailRow('Service', $service)
            . self::detailRow('Date', self::escape($date))
            . self::detailRow('Time', self::escape($time));

        if ($includeCustomer) {
            $rows .= self::detailRow('Client', self::escape((string) ($booking['customer_name'] ?? '—')));
            $rows .= self::detailRow('Client email', self::escape((string) ($booking['customer_email'] ?? '—')));
        }

        $rows .= self::detailRow('Payment method', self::escape($method));
        $rows .= self::detailRow('Payment status', self::escape($paymentStatus));
        $rows .= self::detailRow('Total', self::escape($total), true);

        return "
            <table role='presentation' cellpadding='0' cellspacing='0' style='width: 100%; border-collapse: collapse; font-size: 14px;'>
                {$rows}
            </table>
        ";
    }

    public static function sendBookingConfirmation(
        int $companyId,
        string $email,
        string $name,
        array $booking
    ): bool {
        $reference = $booking['reference'] ?? ('#' . $booking['id']);
        $isPendingCardPayment = ($booking['payment_method'] ?? 'cash') === 'card'
            && ($booking['status'] ?? 'pending') !== 'confirmed';
        $message = $isPendingCardPayment
            ? 'Your booking is reserved while we wait for your secure card payment. We’ll email you again as soon as the payment is confirmed.'
            : 'Your booking is confirmed. Please review the booking and payment summary below.';
        $content = "
            <p style='margin: 0 0 10px;'>Hello <strong>" . self::escape($name) . "</strong>,</p>
            <p style='margin: 0 0 20px;'>{$message}</p>
            <div style='background: #f8fafc; border: 1px solid #e2e8f0; padding: 18px 20px; border-radius: 12px; margin: 20px 0;'>
                " . self::bookingDetails($booking, false) . "
            </div>
            <p style='color: #64748b; font-size: 13px; margin: 18px 0 0;'>Keep your booking reference <strong>" . self::escape((string) $reference) . "</strong> for your records.</p>
        ";

        $title = $isPendingCardPayment ? 'Booking received' : 'Booking confirmed';
        $body = self::template($title, $content);
        return self::send($companyId, $email, "Booking {$reference} details", $body);
    }

    public static function sendNewBookingToOwner(
        int $companyId,
        string $email,
        string $ownerName,
        array $booking
    ): bool {
        $reference = $booking['reference'] ?? ('#' . $booking['id']);
        $isPendingCardPayment = ($booking['payment_method'] ?? 'cash') === 'card'
            && ($booking['status'] ?? 'pending') !== 'confirmed';
        $message = $isPendingCardPayment
            ? 'A new booking has been created and is awaiting secure card payment.'
            : 'A new booking has been confirmed.';
        $content = "
            <p style='margin: 0 0 10px;'>Hello <strong>" . self::escape($ownerName) . "</strong>,</p>
            <p style='margin: 0 0 20px;'>{$message}</p>
            <div style='background: #f8fafc; border: 1px solid #e2e8f0; padding: 18px 20px; border-radius: 12px; margin: 20px 0;'>
                " . self::bookingDetails($booking, true) . "
            </div>
        ";

        $body = self::template($isPendingCardPayment ? 'New booking · payment pending' : 'New booking', $content);
        return self::send($companyId, $email, "New booking {$reference}", $body);
    }

    public static function sendPaymentReceivedToCustomer(
        int $companyId,
        string $email,
        string $name,
        array $booking
    ): bool {
        $reference = self::escape((string) ($booking['reference'] ?? ('#' . ($booking['id'] ?? ''))));
        $content = "
            <p style='margin: 0 0 10px;'>Hello <strong>" . self::escape($name) . "</strong>,</p>
            <p style='margin: 0 0 20px;'>Your card payment was received successfully. Your booking is confirmed, and this email is your payment summary.</p>
            <div style='background: #f8fafc; border: 1px solid #e2e8f0; padding: 18px 20px; border-radius: 12px; margin: 20px 0;'>
                " . self::bookingDetails($booking, false) . "
            </div>
            <p style='color: #64748b; font-size: 13px; margin: 18px 0 0;'>Your card details are handled securely by Stripe and are not stored by the business.</p>
        ";

        return self::send(
            $companyId,
            $email,
            "Payment received for booking {$reference}",
            self::template('Payment confirmed', $content)
        );
    }

    public static function sendPaymentReceivedToOwner(
        int $companyId,
        string $email,
        string $ownerName,
        array $booking
    ): bool {
        $reference = self::escape((string) ($booking['reference'] ?? ('#' . ($booking['id'] ?? ''))));
        $content = "
            <p style='margin: 0 0 10px;'>Hello <strong>" . self::escape($ownerName) . "</strong>,</p>
            <p style='margin: 0 0 20px;'>A client’s card payment has cleared successfully. The booking is now confirmed.</p>
            <div style='background: #f8fafc; border: 1px solid #e2e8f0; padding: 18px 20px; border-radius: 12px; margin: 20px 0;'>
                " . self::bookingDetails($booking, true) . "
            </div>
        ";

        return self::send(
            $companyId,
            $email,
            "Payment received for booking {$reference}",
            self::template('Payment received', $content)
        );
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