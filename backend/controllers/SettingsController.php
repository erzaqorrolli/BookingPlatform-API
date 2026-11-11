<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Config\Database;

class SettingsController
{
    public function index(): void
    {
        $db = Database::pdo();
        $stmt = $db->query("SELECT * FROM platform_settings WHERE id = 1");
        $settings = $stmt->fetch();
        json_ok($settings ?: []);
    }

    public function update(): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        
        $input = input();
        $allowed = [
            'platform_name', 'company_name', 'support_email', 'timezone', 'language',
            'smtp_host', 'smtp_port', 'smtp_user', 'smtp_from_name',
            'stripe_public_key', 'default_currency', 'platform_fee_percent',
            'require_email_verification', 'allow_impersonation',
            'notify_new_company', 'notify_new_booking'
        ];

        $fields = [];
        $params = [];
        foreach ($allowed as $field) {
            if (array_key_exists($field, $input)) {
                $fields[] = "$field = ?";
                $params[] = is_bool($input[$field]) ? (int)$input[$field] : $input[$field];
            }
        }

        if (empty($fields)) {
            json_err('No fields to update', 422);
        }

        $params[] = 1;
        $db = Database::pdo();
        $stmt = $db->prepare("UPDATE platform_settings SET " . implode(', ', $fields) . " WHERE id = ?");
        $stmt->execute($params);

        json_ok(['message' => 'Settings updated']);
    }
}