<?php
declare(strict_types=1);

use Dotenv\Dotenv;

require __DIR__ . '/../vendor/autoload.php';

$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

if (($_ENV['APP_DEBUG'] ?? 'false') === 'true') {
    error_reporting(E_ALL);
    ini_set('display_errors', '1');
} else {
    error_reporting(0);
    ini_set('display_errors', '0');
}

// CORS
$origin = $_ENV['FRONTEND_URL'] ?? 'http://localhost:5173';
header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Health check
if (parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) === '/booking-api/public/api/health') {
    echo json_encode(['status' => 'ok', 'time' => date('c'), 'php' => PHP_VERSION]);
    exit;
}

try {
    \App\Config\Router::dispatch();
} catch (\Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'error'   => 'Server error',
        'message' => ($_ENV['APP_DEBUG'] ?? 'false') === 'true' ? $e->getMessage() : 'Internal error',
    ]);
}