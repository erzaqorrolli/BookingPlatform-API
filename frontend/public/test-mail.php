<?php
require __DIR__ . '/../vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

use App\Utils\Mailer;

$result = Mailer::send(
    'erzaqorrolli5@gmail.com',   
    'Test Email from Booking Platform',
    '<h1>Test</h1><p>Ky është një test email.</p>'
);

echo $result ? '✅ EMAIL SENT' : '❌ EMAIL FAILED';