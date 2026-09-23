<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Models\Booking;
use App\Models\Company;
use App\Models\Service;
use App\Config\Database;

class BookingController
{
    /**
     * GET /api/companies/{companyId}/bookings
     */
    public function index(array $params): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $companyId = (int) $params['companyId'];

        if (!Company::userBelongsTo($uid, $companyId)) {
            json_err('Forbidden', 403);
        }

        $bookings = Booking::forCompany($companyId, [
            'status' => $_GET['status'] ?? null,
            'date'   => $_GET['date'] ?? null,
        ]);

        json_ok($bookings);
    }

    
   public function publicCompanies(): void
{
    $db = Database::pdo();

    $companies = $db->query("
        SELECT id, name, slug, logo_url, address
        FROM companies
        ORDER BY name
    ")->fetchAll();

    foreach ($companies as &$company) {
        $stmt = $db->prepare("
            SELECT filename
            FROM photos
            WHERE company_id = ? AND is_cover = 1
            LIMIT 1
        ");
        $stmt->execute([$company['id']]);
        $cover = $stmt->fetchColumn();

        if ($cover) {
            $company['cover_url'] = ($_ENV['APP_URL'] ?? 'http://localhost/booking-api')
                . '/public/storage/uploads/' . $cover;
        } else {
            $company['cover_url'] = null;
        }
    }

    json_ok($companies);
}

    
    public function availability(): void
    {
        $companyId = (int) ($_GET['company_id'] ?? 0);
        $serviceId = (int) ($_GET['service_id'] ?? 0);
        $date      = $_GET['date'] ?? '';

        if (!$companyId || !$serviceId || !$date) {
            json_err('company_id, service_id and date are required', 422);
        }

        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            json_err('Invalid date format (YYYY-MM-DD)', 422);
        }

        $db = Database::pdo();
        $dow = (int) date('w', strtotime($date)); // 0=Sun..6=Sat

        // 1. Kontrollo working hours
        $stmt = $db->prepare("
            SELECT * FROM working_hours
            WHERE company_id = ? AND day_of_week = ?
        ");
        $stmt->execute([$companyId, $dow]);
        $hours = $stmt->fetch();

        if (!$hours || $hours['is_closed']) {
            json_ok(['slots' => [], 'reason' => 'closed']);
        }

        // 2. Kontrollo holiday
        $stmt = $db->prepare("
            SELECT 1 FROM holidays
            WHERE company_id = ?
            AND (date = ? OR (is_recurring = 1 AND DATE_FORMAT(date, '%m-%d') = DATE_FORMAT(?, '%m-%d')))
        ");
        $stmt->execute([$companyId, $date, $date]);
        if ($stmt->fetch()) {
            json_ok(['slots' => [], 'reason' => 'holiday']);
        }

        // 3. Gjej service
        $service = Service::findById($serviceId);
        if (!$service || $service->company_id !== $companyId || !$service->active) {
            json_err('Service not found or inactive', 404);
        }

        $dur = $service->duration_minutes;
        $cap = $service->capacity;

        // 4. Gjenero slots çdo 15 min
        $openTs  = strtotime("$date {$hours['open_time']}");
        $closeTs = strtotime("$date {$hours['close_time']}");
        $step    = 15 * 60; // 15 min në sekonda

        // 5. Merr booking-et e ditës
        $stmt = $db->prepare("
            SELECT start_time, end_time FROM bookings
            WHERE company_id = ? AND service_id = ? AND booking_date = ?
            AND status IN ('pending', 'confirmed')
        ");
        $stmt->execute([$companyId, $serviceId, $date]);
        $existing = $stmt->fetchAll();

        $slots = [];
        for ($ts = $openTs; $ts + $dur * 60 <= $closeTs; $ts += $step) {
            $startStr = date('H:i:s', $ts);
            $endStr   = date('H:i:s', $ts + $dur * 60);

            $overlap = 0;
            foreach ($existing as $e) {
                if ($e['start_time'] < $endStr && $e['end_time'] > $startStr) {
                    $overlap++;
                }
            }

            if ($overlap < $cap) {
                $slots[] = ['start' => $startStr, 'end' => $endStr];
            }
        }

        json_ok([
            'slots'   => $slots,
            'service' => $service->toArray(),
        ]);
    }

    /**
     * POST /api/public/bookings
     */
    public function createPublic(): void
    {
        $input = input();

        $companyId = (int) ($input['company_id'] ?? 0);
        $serviceId = (int) ($input['service_id'] ?? 0);
        $date      = $input['booking_date'] ?? '';
        $startTime = $input['start_time'] ?? '';

        $name  = trim($input['name'] ?? '');
        $email = trim(strtolower($input['email'] ?? ''));
        $phone = $input['phone'] ?? null;

        if (!$companyId || !$serviceId || !$date || !$startTime) {
            json_err('Missing required fields', 422);
        }
        if (!$name || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            json_err('Valid name and email required', 422);
        }

        $service = Service::findById($serviceId);
        if (!$service || $service->company_id !== $companyId) {
            json_err('Service not found', 404);
        }

        $db = Database::pdo();

        // Double-check overlap
        $endTime = date('H:i:s', strtotime($startTime) + $service->duration_minutes * 60);

        $stmt = $db->prepare("
            SELECT COUNT(*) FROM bookings
            WHERE company_id = ? AND service_id = ? AND booking_date = ?
            AND status IN ('pending', 'confirmed')
            AND start_time < ? AND end_time > ?
        ");
        $stmt->execute([$companyId, $serviceId, $date, $endTime, $startTime]);
        $overlap = (int) $stmt->fetchColumn();

        if ($overlap >= $service->capacity) {
            json_err('Slot no longer available', 409);
        }

        // Gjej ose krijo customer
        $customerId = Booking::findOrCreateCustomer($companyId, $name, $email, $phone);

        // Krijo booking
        $booking = Booking::create($companyId, $customerId, $serviceId, [
            'booking_date' => $date,
            'start_time'   => $startTime,
            'total_price'  => $service->price,
            'notes'        => $input['notes'] ?? null,
        ]);

        // TODO: Dërgo email customer + owner

        json_ok([
            'message' => 'Booking received',
            'booking' => $booking->toArray(),
        ], 201);
    }

    /**
     * PUT /api/companies/{companyId}/bookings/{id}/status
     */
    public function updateStatus(array $params): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $companyId = (int) $params['companyId'];
        $bookingId = (int) $params['id'];

        $role = Company::userRole($uid, $companyId);
        if (!in_array($role, ['owner', 'admin', 'manager', 'staff'])) {
            json_err('Forbidden', 403);
        }

        $input = input();
        $status = $input['status'] ?? '';

        $booking = Booking::findById($bookingId);
        if (!$booking || $booking->company_id !== $companyId) {
            json_err('Booking not found', 404);
        }

        if (!$booking->updateStatus($status)) {
            json_err('Invalid status', 422);
        }


        json_ok([
            'message' => 'Status updated',
            'booking' => Booking::findById($bookingId)->toArray(),
        ]);
    }


   public function publicCompanyBySlug(array $params): void
{
    $slug = $params['slug'] ?? '';

    if (!$slug) json_err('Slug required', 422);

    $db = Database::pdo();

    $stmt = $db->prepare("
        SELECT id, name, slug, email, phone, address, logo_url, timezone
        FROM companies
        WHERE slug = ?
    ");
    $stmt->execute([$slug]);
    $company = $stmt->fetch();

    if (!$company) json_err('Company not found', 404);

    // Merr shërbimet
    $stmt = $db->prepare("
        SELECT id, name, description, duration_minutes, price, capacity
        FROM services
        WHERE company_id = ? AND active = 1
        ORDER BY name
    ");
    $stmt->execute([$company['id']]);
    $services = $stmt->fetchAll();

    // Merr fotot ← E RE
    $stmt = $db->prepare("
        SELECT id, filename, is_cover
        FROM photos
        WHERE company_id = ?
        ORDER BY is_cover DESC, created_at DESC
        LIMIT 20
    ");
    $stmt->execute([$company['id']]);
    $photosRaw = $stmt->fetchAll();

    $appUrl = $_ENV['APP_URL'] ?? 'http://localhost/booking-api';
    $photos = array_map(function ($p) use ($appUrl) {
        return [
            'id'       => (int) $p['id'],
            'url'      => $appUrl . '/public/storage/uploads/' . $p['filename'],
            'is_cover' => (int) $p['is_cover'],
        ];
    }, $photosRaw);

    json_ok([
        'id'       => (int) $company['id'],
        'name'     => $company['name'],
        'slug'     => $company['slug'],
        'email'    => $company['email'],
        'phone'    => $company['phone'],
        'address'  => $company['address'],
        'logo_url' => $company['logo_url'],
        'timezone' => $company['timezone'],
        'services' => array_map(function ($s) {
            return [
                'id'               => (int) $s['id'],
                'name'             => $s['name'],
                'description'      => $s['description'],
                'duration_minutes' => (int) $s['duration_minutes'],
                'price'            => (float) $s['price'],
                'capacity'         => (int) $s['capacity'],
            ];
        }, $services),
        'photos' => $photos,
    ]);
}
}