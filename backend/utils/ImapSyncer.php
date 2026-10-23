<?php
declare(strict_types=1);

namespace App\Utils;

use App\Config\Database;

class ImapSyncer
{
    public static function syncInbox(int $companyId): int
    {
        $db = Database::pdo();
        $stmt = $db->prepare("SELECT * FROM company_settings WHERE company_id = ?");
        $stmt->execute([$companyId]);
        $settings = $stmt->fetch();

        if (!$settings || empty($settings['smtp_host']) || empty($settings['smtp_user']) || empty($settings['smtp_pass'])) {
            throw new \DomainException('Configure the company email settings before syncing the inbox.');
        }
        if (!function_exists('imap_open')) {
            throw new \DomainException('The PHP IMAP extension is not enabled on the server.');
        }

        $host = preg_replace('/^(ssl|tls):\/\//i', '', trim($settings['smtp_host']));
        $host = preg_replace('/:\d+$/', '', $host);
        $host = preg_replace('/^smtp\./i', 'imap.', $host);
        $inbox = @imap_open('{' . $host . ':993/imap/ssl}INBOX', $settings['smtp_user'], $settings['smtp_pass']);
        if (!$inbox) {
            $error = imap_last_error();
            error_log('IMAP connection failed: ' . ($error ?: 'Unknown IMAP error'));
            throw new \DomainException('Could not connect to the company inbox. Check the email address, app password, and IMAP settings.');
        }

        $count = 0;

        try {
            $emails = imap_search($inbox, 'UNSEEN');
            if (!$emails) {
                return 0;
            }

            $customerStmt = $db->prepare("
                SELECT 1 FROM customers
                WHERE company_id = ? AND LOWER(email) = ?
                LIMIT 1
            ");
            $insertStmt = $db->prepare("
                INSERT INTO email_messages (company_id, customer_email, subject, body, direction)
                VALUES (?, ?, ?, ?, 'inbound')
            ");

            foreach ($emails as $messageNumber) {
                $messageNumber = (int) $messageNumber;
                $header = imap_headerinfo($inbox, $messageNumber);
                if (!$header || empty($header->from[0]->mailbox) || empty($header->from[0]->host)) {
                    continue;
                }

                $fromEmail = strtolower(trim($header->from[0]->mailbox . '@' . $header->from[0]->host));
                if (!filter_var($fromEmail, FILTER_VALIDATE_EMAIL)) {
                    continue;
                }

                $customerStmt->execute([$companyId, $fromEmail]);
                if (!$customerStmt->fetchColumn()) {
                    continue;
                }

                $body = trim(self::getMessageBody($inbox, $messageNumber));
                if ($body === '') {
                    error_log("Skipped incoming email {$messageNumber} for company {$companyId}: no readable text body.");
                    continue;
                }

                $subject = isset($header->subject) ? imap_utf8($header->subject) : '(No subject)';
                $insertStmt->execute([$companyId, $fromEmail, $subject, mb_substr($body, 0, 5000)]);
                imap_setflag_full($inbox, (string) $messageNumber, '\\Seen');
                $count++;
            }
        } finally {
            imap_close($inbox);
        }

        return $count;
    }

    private static function getMessageBody($inbox, int $messageNumber): string
    {
        $structure = imap_fetchstructure($inbox, $messageNumber);
        if (!$structure) {
            return '';
        }

        $parts = [];
        self::collectTextParts($inbox, $messageNumber, $structure, '', $parts);

        foreach (['plain', 'html'] as $subtype) {
            if (empty($parts[$subtype])) {
                continue;
            }

            $body = $parts[$subtype][0];
            if ($subtype === 'html') {
                $body = preg_replace('/<br\s*\/?>|<\/(p|div|li)>/i', "\n", $body);
                $body = html_entity_decode(strip_tags($body), ENT_QUOTES | ENT_HTML5, 'UTF-8');
            }

            return trim($body);
        }

        return '';
    }

    private static function collectTextParts($inbox, int $messageNumber, object $part, string $parentSection, array &$textParts): void
    {
        if (!empty($part->parts)) {
            foreach ($part->parts as $index => $child) {
                $section = $parentSection === '' ? (string) ($index + 1) : $parentSection . '.' . ($index + 1);
                self::collectTextParts($inbox, $messageNumber, $child, $section, $textParts);
            }

            return;
        }

        if ((int) ($part->type ?? -1) !== 0) {
            return;
        }

        $subtype = strtolower($part->subtype ?? '');
        if (!in_array($subtype, ['plain', 'html'], true)) {
            return;
        }

        $section = $parentSection === '' ? '1' : $parentSection;
        $body = imap_fetchbody($inbox, $messageNumber, $section, FT_PEEK);
        if ($body === false) {
            return;
        }

        if ((int) ($part->encoding ?? 0) === 3) {
            $body = base64_decode($body, true) ?: '';
        } elseif ((int) ($part->encoding ?? 0) === 4) {
            $body = quoted_printable_decode($body);
        }

        foreach ($part->parameters ?? [] as $parameter) {
            if (strtolower($parameter->attribute ?? '') !== 'charset') {
                continue;
            }

            $charset = $parameter->value ?? '';
            if ($charset !== '' && strcasecmp($charset, 'UTF-8') !== 0 && function_exists('iconv')) {
                $converted = @iconv($charset, 'UTF-8//IGNORE', $body);
                if ($converted !== false) {
                    $body = $converted;
                }
            }
            break;
        }

        $textParts[$subtype][] = $body;
    }
}
