<?php
declare(strict_types=1);

use Dotenv\Dotenv;

require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/../utils/helpers.php';  

$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

// ============================================================
// SERVE STORAGE FILES
// ============================================================
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if (preg_match('#^/booking-api/public/storage/uploads/(.+)$#', $uri, $m)) {
    $file = __DIR__ . '/../storage/uploads/' . basename($m[1]);
    if (file_exists($file)) {
        $mime = mime_content_type($file) ?: 'application/octet-stream';
        header('Content-Type: ' . $mime);
        header('Cache-Control: public, max-age=86400');
        readfile($file);
        exit;
    }
}

// ============================================================
// ERROR REPORTING
// ============================================================
$isDebug = filter_var($_ENV['APP_DEBUG'] ?? 'false', FILTER_VALIDATE_BOOLEAN);

if ($isDebug) {
    error_reporting(E_ALL);
    ini_set('display_errors', '1');
    ini_set('display_startup_errors', '1');
} else {
    error_reporting(E_ALL);
    ini_set('display_errors', '0');
    ini_set('log_errors', '1');
}

// ============================================================
// CORS
// ============================================================
$origin = $_ENV['FRONTEND_URL'] ?? 'http://localhost:5173';
header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token, X-Requested-With');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400');

// Preflight
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ============================================================
// HEALTH CHECK
// ============================================================
if ($uri === '/booking-api/public/api/health') {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'status' => 'ok',
        'time'   => date('c'),
        'php'    => PHP_VERSION,
        'debug'  => $isDebug,
    ]);
    exit;
}

// ============================================================
// ROUTE DISPATCH
// ============================================================
try {
    \App\Config\Router::dispatch();
} catch (\Throwable $e) {
    http_response_code(500);

    // Log gjithmonë
    error_log(sprintf(
        '[%s] %s in %s:%d | Trace: %s',
        date('Y-m-d H:i:s'),
        $e->getMessage(),
        $e->getFile(),
        $e->getLine(),
        $e->getTraceAsString()
    ));

    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'error'   => $isDebug
            ? $e->getMessage()
            : 'Internal server error',
        'debug'   => $isDebug ? [
            'file'  => $e->getFile(),
            'line'  => $e->getLine(),
            'trace' => explode("\n", $e->getTraceAsString()),
        ] : null,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}