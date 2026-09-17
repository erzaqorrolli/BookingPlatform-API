<?php
declare(strict_types=1);

namespace App\Utils;

class Mailer
{
    public static function send(string $to, string $subject, string $htmlBody): bool
    {
        $from = $_ENV['MAIL_FROM'] ?? 'noreply@booking.local';

        $headers  = "From: $from\r\n";
        $headers .= "Reply-To: $from\r\n";
        $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
        $headers .= "MIME-Version: 1.0\r\n";

        $ok = @mail($to, $subject, $htmlBody, $headers);

        $logline = sprintf(
            "[%s] TO: %s | SUBJ: %s\n%s\n\n",
            date('c'),
            $to,
            $subject,
            strip_tags($htmlBody)
        );
        @file_put_contents(__DIR__ . '/../storage/mail.log', $logline, FILE_APPEND);

        return $ok;
    }

    public static function sendVerification(string $email, string $name, string $token): void
    {
        $link = ($_ENV['FRONTEND_URL'] ?? 'http://localhost:5173') . "/verify?token=$token";
        $body = "
            <h2>Welcome, $name!</h2>
            <p>Thank you for signing up. Click the link below to verify your email:</p>
            <p><a href='$link'>$link</a></p>
        ";
        self::send($email, 'Verify your email', $body);
    }

    public static function sendPasswordReset(string $email, string $name, string $token): void
    {
        $link = ($_ENV['FRONTEND_URL'] ?? 'http://localhost:5173') . "/reset?token=$token";
        $body = "
            <h2>Reset Password</h2>
            <p>Hello $name,</p>
            <p>Click the link below to reset your password:</p>
            <p><a href='$link'>$link</a></p>
            <p>Link expires after 1 hour!</p>
        ";
        self::send($email, 'Reset Password', $body);
    }
}