<?php
declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/../utils/helpers.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

use App\Models\Invoice;

$bookingId = (int) ($_GET['booking_id'] ?? 0);

if (!$bookingId) {
    echo "Përdor: test-invoice.php?booking_id=23";
    exit;
}

echo "<h2>Test Invoice for booking #$bookingId</h2>";

$db = \App\Config\Database::pdo();
$stmt = $db->prepare("SELECT id, reference, customer_id, company_id, total_price FROM bookings WHERE id = ?");
$stmt->execute([$bookingId]);
$booking = $stmt->fetch();

if (!$booking) {
    echo "<p style='color: red;'> Booking #$bookingId does not exist in DB.</p>";
    exit;
}

echo "<p> Booking exists: " . $booking['reference'] . "</p>";
echo "<p>Customer ID: " . $booking['customer_id'] . " | Company ID: " . $booking['company_id'] . "</p>";
echo "<p>Total: €" . $booking['total_price'] . "</p>";

echo "<h3>Provo createFromBooking()</h3>";

try {
    $invoice = Invoice::createFromBooking($bookingId);
    
    if ($invoice) {
        echo "<p style='color: green;'> Invoice created!</p>";
        echo "<pre style='background: #f0f0f0; padding: 10px;'>";
        print_r($invoice->toArray());
        echo "</pre>";
    } else {
        echo "<p style='color: red;'> Invoice returns NULL — control log.</p>";
    }
} catch (\Throwable $e) {
    echo "<p style='color: red;'> Error: " . $e->getMessage() . "</p>";
    echo "<pre>" . $e->getTraceAsString() . "</pre>";
}

// Kontrollo a ekziston invoice
$existing = $db->prepare("SELECT * FROM invoices WHERE booking_id = ?");
$existing->execute([$bookingId]);
$inv = $existing->fetch();

echo "<h3>Kontrollo DB</h3>";
if ($inv) {
    echo "<p style='color: green;'>Invoice exists in DB: " . $inv['reference'] . "</p>";
} else {
    echo "<p style='color: red;'> Invoice does not exist in DB.</p>";
}