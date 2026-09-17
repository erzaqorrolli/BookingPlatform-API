<?php
declare(strict_types=1);

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

if (!function_exists('json_ok')) {
    function json_ok($data = null, int $status = 200): void {
        http_response_code($status);
        echo json_encode(['data' => $data], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

if (!function_exists('json_err')) {
    function json_err(string $message, int $status = 400): void {
        http_response_code($status);
        echo json_encode(['error' => $message], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

if (!function_exists('input')) {
    function input(): array {
        static $data = null;
        if ($data !== null) return $data;

        $raw = file_get_contents('php://input');

        // Provo 1: JSON
        $decoded = json_decode($raw, true);
        if (is_array($decoded)) {
            $data = $decoded;
            return $data;
        }

        // Provo 2: form-urlencoded
        if (!empty($_POST)) {
            $data = $_POST;
            return $data;
        }

        // Provo 3: parse manual
        if (is_string($raw) && $raw !== '') {
            parse_str($raw, $parsed);
            $data = $parsed;
            return $data;
        }

        $data = [];
        return $data;
    }
}

if (!function_exists('jwt_encode')) {
    function jwt_encode(array $payload): string {
        return JWT::encode($payload, $_ENV['JWT_SECRET'], 'HS256');
    }
}

if (!function_exists('jwt_decode')) {
    function jwt_decode(string $token): ?array {
        try {
            return (array) JWT::decode($token, new Key($_ENV['JWT_SECRET'], 'HS256'));
        } catch (\Throwable $e) {
            return null;
        }
    }
}

if (!function_exists('auth_user_id')) {
   function auth_user_id(): ?int {
      $header = '';

      if(!empty($_SERVER['HTTP_AUTHORIZATION'])) {
         $header = $_SERVER['HTTP_AUTHORIZATION'];
      }
      elseif(!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])){
        $header = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];  
      }
      
      elseif(function_exists('apache_request_headers')){
        $headers = apache_request_headers();
        foreach ($headers as $key => $value){
            if(strtolower($key) === 'authorization'){
                $header = $value;
                break;
        }
      }
    }

    if(!$header || !preg_match('/^Bearer\s+(.+)$/i', $header, $m)) {
        return null;
    }   

    $payload = jwt_decode($m[1]);
    if(!$payload) return null;
    return isset($payload['uid']) ? (int) $payload['uid'] : null;
}

if(function_exists('getallheaders')){
    $headers=getallheaders();
    foreach($headers as $key => $value){
        if(strtolower($key) == 'authorization'){
            $header = $value;
            break;
        }
    }
}
}

if (!function_exists('slugify')) {
    function slugify(string $text): string {
        $text = preg_replace('~[^\pL\d]+~u', '-', $text);
        $text = iconv('utf-8', 'us-ascii//TRANSLIT', $text);
        $text = preg_replace('~[^-\w]+~', '', $text);
        $text = trim($text, '-');
        $text = preg_replace('~-+~', '-', $text);
        return strtolower($text) ?: 'n-a';
    }
}