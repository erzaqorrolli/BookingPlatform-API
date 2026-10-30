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
}