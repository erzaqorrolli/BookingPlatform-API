<?php
declare(strict_types=1);

namespace App\Utils;

class WebSocket
{
   
    public static function emit(string $channel, string $event, array $data = []): void
    {
        try {
            $ch = curl_init('http://localhost:3001/broadcast');
            curl_setopt_array($ch, [
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => json_encode([
                    'channel' => $channel,
                    'event'   => $event,
                    'data'    => $data,
                ]),
                CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 2,
            ]);
            curl_exec($ch);
            curl_close($ch);
        } catch (\Throwable $e) {
            error_log('WS emit failed: ' . $e->getMessage());
        }
    }

    public static function notifyAdmins(array $data = []): void
    {
        self::emit('admin', 'dashboard-update', $data);
    }

    
    public static function notifySuperAdmins(array $data = []): void
    {
        self::emit('superadmin', 'dashboard-update', $data);
    }

  
    public static function notifyAll(array $data = []): void
    {
        self::notifyAdmins($data);
        self::notifySuperAdmins($data);
    }
}