<?php
declare(strict_types=1);

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

/* ============================================================
 * JSON RESPONSES
 * ============================================================ */

if (!function_exists('json_ok')) {
    function json_ok($data = null, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(
            ['success' => true, 'data' => $data],
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
        );
        exit;
    }
}

if (!function_exists('json_err')) {
    function json_err(string $message, int $status = 400): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(
            ['success' => false, 'error' => $message],
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
        );
        exit;
    }
}

/* ============================================================
 * INPUT
 * ============================================================ */

if (!function_exists('input')) {
    function input(): array
    {
        static $data   = [];
        static $loaded = false;

        if ($loaded) {
            return $data;
        }

        $raw = file_get_contents('php://input');

        if (is_string($raw) && $raw !== '') {
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) {
                $data   = $decoded;
                $loaded = true;
                return $data;
            }
        }

        if (!empty($_POST)) {
            $data   = $_POST;
            $loaded = true;
            return $data;
        }

        if (is_string($raw) && $raw !== '') {
            parse_str($raw, $parsed);
            if (is_array($parsed) && !empty($parsed)) {
                $data   = $parsed;
                $loaded = true;
                return $data;
            }
        }

        if (!empty($_GET)) {
            $data = $_GET;
        }

        $loaded = true;
        return $data;
    }
}

/* ============================================================
 * JWT
 * ============================================================ */

if (!function_exists('jwt_encode')) {
    function jwt_encode(array $payload): string
    {
        $payload['iat'] = $payload['iat'] ?? time();

        $secret = $_ENV['JWT_SECRET'] ?? '';
        if ($secret === '') {
            throw new \RuntimeException('JWT_SECRET is not configured');
        }

        return JWT::encode($payload, $secret, 'HS256');
    }
}

if (!function_exists('jwt_decode')) {
    function jwt_decode(string $token): ?array
    {
        $secret = $_ENV['JWT_SECRET'] ?? '';
        if ($secret === '') {
            return null;
        }

        try {
            $decoded = JWT::decode($token, new Key($secret, 'HS256'));
            return (array) $decoded;
        } catch (\Throwable $e) {
            return null;
        }
    }
}

/* ============================================================
 * AUTH
 * ============================================================ */

if (!function_exists('get_bearer_token')) {
    function get_bearer_token(): ?string
    {
        $header = '';

        if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
            $header = $_SERVER['HTTP_AUTHORIZATION'];
        } elseif (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $header = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        } elseif (function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
            foreach ($headers as $key => $value) {
                if (strtolower($key) === 'authorization') {
                    $header = $value;
                    break;
                }
            }
        } elseif (function_exists('getallheaders')) {
            $headers = getallheaders();
            if (is_array($headers)) {
                foreach ($headers as $key => $value) {
                    if (strtolower($key) === 'authorization') {
                        $header = $value;
                        break;
                    }
                }
            }
        }

        if ($header === '' || !preg_match('/^Bearer\s+(.+)$/i', $header, $m)) {
            return null;
        }

        return trim($m[1]);
    }
}

if (!function_exists('get_auth_token')) {
    function get_auth_token(): ?string
    {
        // 1) Cookie (web)
        if (!empty($_COOKIE['auth_token'])) {
            return (string) $_COOKIE['auth_token'];
        }

        // 2) Bearer header (mobile / API)
        return get_bearer_token();
    }
}

if (!function_exists('auth_user_id')) {
    function auth_user_id(): ?int
    {
        $token = get_auth_token();
        if (!$token) {
            return null;
        }

        $payload = jwt_decode($token);
        if (!$payload) {
            return null;
        }

        return isset($payload['uid']) ? (int) $payload['uid'] : null;
    }
}

if (!function_exists('auth_payload')) {
    function auth_payload(): ?array
    {
        $token = get_auth_token();
        if (!$token) {
            return null;
        }

        return jwt_decode($token);
    }
}

if (!function_exists('require_auth')) {
    function require_auth(): int
    {
        $uid = auth_user_id();
        if (!$uid) {
            json_err('Unauthorized', 401);
        }
        return $uid;
    }
}

/* ============================================================
 * COOKIES + CSRF
 * ============================================================ */

if (!function_exists('cookie_set_auth')) {
    function cookie_set_auth(string $token, int $expiresInSeconds): void
    {
        $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            || (($_SERVER['SERVER_PORT'] ?? '') === '443');

        setcookie('auth_token', $token, [
            'expires'  => time() + $expiresInSeconds,
            'path'     => '/',
            'domain'   => '',
            'secure'   => $isHttps,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
    }
}

if (!function_exists('cookie_clear_auth')) {
    function cookie_clear_auth(): void
    {
        $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            || (($_SERVER['SERVER_PORT'] ?? '') === '443');

        setcookie('auth_token', '', [
            'expires'  => time() - 3600,
            'path'     => '/',
            'domain'   => '',
            'secure'   => $isHttps,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        unset($_COOKIE['auth_token']);
    }
}

if (!function_exists('cookie_set_csrf')) {
    function cookie_set_csrf(string $token): void
    {
        $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            || (($_SERVER['SERVER_PORT'] ?? '') === '443');

        setcookie('csrf_token', $token, [
            'expires'  => time() + 86400,
            'path'     => '/',
            'secure'   => $isHttps,
            'httponly' => false,
            'samesite' => 'Lax',
        ]);
    }
}

if (!function_exists('cookie_clear_csrf')) {
    function cookie_clear_csrf(): void
    {
        $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            || (($_SERVER['SERVER_PORT'] ?? '') === '443');

        setcookie('csrf_token', '', [
            'expires'  => time() - 3600,
            'path'     => '/',
            'secure'   => $isHttps,
            'httponly' => false,
            'samesite' => 'Lax',
        ]);
        unset($_COOKIE['csrf_token']);
    }
}

if (!function_exists('csrf_verify')) {
    function csrf_verify(): void
    {
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

        if (in_array($method, ['GET', 'HEAD', 'OPTIONS'], true)) {
            return;
        }

        $cookieToken = $_COOKIE['csrf_token'] ?? '';
        $headerToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';

        if ($cookieToken === '' || $headerToken === ''
            || !hash_equals($cookieToken, $headerToken)) {
            json_err('Invalid or missing CSRF token', 419);
        }
    }
}

/* ============================================================
 * MISC
 * ============================================================ */

if (!function_exists('slugify')) {
    function slugify(string $text): string
    {
        $text = preg_replace('~[^\pL\d]+~u', '-', $text) ?? '';

        $converted = @iconv('utf-8', 'us-ascii//TRANSLIT', $text);
        if ($converted !== false) {
            $text = $converted;
        }

        $text = preg_replace('~[^-\w]+~', '', $text) ?? '';
        $text = trim($text, '-');
        $text = preg_replace('~-+~', '-', $text) ?? '';

        return strtolower($text) ?: 'n-a';
    }
}

if (!function_exists('env')) {
    function env(string $key, $default = null)
    {
        return $_ENV[$key] ?? getenv($key) ?: $default;
    }
}

if (!function_exists('env_bool')) {
    function env_bool(string $key, bool $default = false): bool
    {
        $value = env($key);
        if ($value === null) {
            return $default;
        }
        return in_array(strtolower((string) $value), ['1', 'true', 'yes', 'on'], true);
    }
}

if (!function_exists('generate_token')) {
    function generate_token(int $bytes = 32): string
    {
        return bin2hex(random_bytes($bytes));
    }
}