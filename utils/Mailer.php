<?php
declare(strict_types=1);

namespace App\Utils;

class Mailer
{
    public static function send(string $to, string $subject, string $htmlBody): bool
    {
        $host = $_ENV['MAIL_HOST'] ?? '127.0.0.1';
        $port = (int) ($_ENV['MAIL_PORT'] ?? 1025);
        $from = $_ENV['MAIL_FROM'] ?? 'noreply@booking.local';
        $to = str_replace(["\r", "\n"], '', $to);
        $from = str_replace(["\r", "\n"], '', $from);

        $connection = @fsockopen($host, $port, $errorNumber, $errorMessage, 10);
        $ok = false;

        if ($connection) {
            stream_set_timeout($connection, 10);
            self::readResponse($connection);
            self::sendCommand($connection, 'EHLO localhost');
            self::sendCommand($connection, "MAIL FROM:<$from>");
            self::sendCommand($connection, "RCPT TO:<$to>");
            self::sendCommand($connection, 'DATA');

            $message = "From: $from\r\n"
                . "Reply-To: $from\r\n"
                . "To: $to\r\n"
                . "Subject: $subject\r\n"
                . "MIME-Version: 1.0\r\n"
                . "Content-Type: text/html; charset=UTF-8\r\n\r\n"
                . str_replace("\n.", "\n..", str_replace("\r\n", "\n", $htmlBody))
                . "\r\n.\r\n";

            fwrite($connection, $message);
            $ok = self::responseCode($connection) < 400;
            self::sendCommand($connection, 'QUIT');
            fclose($connection);
        }

        $logline = sprintf(
            "[%s] TO: %s | SUBJ: %s\n%s\n\n",
            date('c'),
            $to,
            $subject,
            strip_tags($htmlBody)
        );
        $logDirectory = __DIR__ . '/../storage';
        if (!is_dir($logDirectory)) {
            @mkdir($logDirectory, 0775, true);
        }
        @file_put_contents($logDirectory . '/mail.log', $logline, FILE_APPEND);

        return $ok;
    }

    private static function sendCommand($connection, string $command): int
    {
        fwrite($connection, $command . "\r\n");
        return self::responseCode($connection);
    }

    private static function responseCode($connection): int
    {
        $response = self::readResponse($connection);
        return (int) substr($response, 0, 3);
    }

    private static function readResponse($connection): string
    {
        $response = '';
        while (($line = fgets($connection)) !== false) {
            $response .= $line;
            if (isset($line[3]) && $line[3] === ' ') {
                break;
            }
        }
        return $response;
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