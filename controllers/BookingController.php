<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Models\Booking;
use App\Models\Company;
use App\Models\Service;
use App\Config\Database;
use App\Utils\Mailer;

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

    /**
     * GET /api/public/companies
     */
    public function publicCompanies(): void
    {
        $db = Database::pdo();

        $companies = $db->query("
            SELECT id, name, slug, logo_url, address
            FROM companies
            ORDER BY name
        ")->fetchAll();

        $appUrl = $_ENV['APP_URL'] ?? 'http://localhost/booking-api';

        $stmt = $db->prepare("
            SELECT filename
            FROM photos
            WHERE company_id = ? AND is_cover = 1
            LIMIT 1
        ");

        foreach ($companies as &$company) {
            $stmt->execute([$company['id']]);
            $cover = $stmt->fetchColumn();

            $company['cover_url'] = $cover
                ? $appUrl . '/public/storage/uploads/' . $cover
                : null;
        }
        unset($company);

        json_ok($companies);
    }

    public function availability(): void
    {
        $companyId = (int) ($_GET['company_id'] ?? 0);
        $serviceId = (int) ($_GET['service_id'] ?? 0);
        $date      = trim((string) ($_GET['date'] ?? ''));

        if (!$companyId || !$serviceId || !$date) {
            json_err('company_id, service_id and date are required', 422);
        }

        // Validim i fortë i datës (kontrollon datë reale, jo vetëm format)
        $dt = \DateTime::createFromFormat('Y-m-d', $date);
        if (!$dt || $dt->format('Y-m-d') !== $date) {
            json_err('Invalid date format (YYYY-MM-DD)', 422);
        }

        $year = (int) $dt->format('Y');
        if ($year < 2020 || $year > 2100) {
            json_err('Date out of allowed range', 422);
        }

        $today = new \DateTime('today');
        if ($dt < $today) {
            json_ok(['slots' => [], 'reason' => 'past_date']);
        }

        $db  = Database::pdo();
        $dow = (int) $dt->format('w'); // 0=Sun..6=Sat

        $stmt = $db->prepare("
            SELECT * FROM working_hours
            WHERE company_id = ? AND day_of_week = ?
            LIMIT 1
        ");
        $stmt->execute([$companyId, $dow]);
        $hours = $stmt->fetch();

        if (!$hours || (int) $hours['is_closed'] === 1) {
            json_ok(['slots' => [], 'reason' => 'closed']);
        }

        if (empty($hours['open_time']) || empty($hours['close_time'])) {
            json_ok(['slots' => [], 'reason' => 'no_hours_configured']);
        }

        // 2. Holiday
        $stmt = $db->prepare("
            SELECT 1 FROM holidays
            WHERE company_id = ?
              AND (
                    date = ?
                 OR (is_recurring = 1 AND DATE_FORMAT(date, '%m-%d') = DATE_FORMAT(?, '%m-%d'))
              )
            LIMIT 1
        ");
        $stmt->execute([$companyId, $date, $date]);
        if ($stmt->fetchColumn()) {
            json_ok(['slots' => [], 'reason' => 'holiday']);
        }

        // 3. Service
        $service = Service::findById($serviceId);
        if (!$service || $service->company_id !== $companyId || !$service->active) {
            json_err('Service not found or inactive', 404);
        }

        $dur = max(1, (int) $service->duration_minutes);
        $cap = max(1, (int) $service->capacity); 

        // 4. Slots
        $openTs  = strtotime("$date {$hours['open_time']}");
        $closeTs = strtotime("$date {$hours['close_time']}");

        if ($openTs === false || $closeTs === false || $closeTs <= $openTs) {
            json_ok(['slots' => [], 'reason' => 'invalid_hours']);
        }

        $step = 15 * 60; // 15 min

        $stmt = $db->prepare("
            SELECT start_time, end_time
            FROM bookings
            WHERE company_id = ? AND service_id = ? AND booking_date = ?
              AND status IN ('pending', 'confirmed')
        ");
        $stmt->execute([$companyId, $serviceId, $date]);
        $existing = $stmt->fetchAll();

        $existingRanges = [];
        foreach ($existing as $e) {
            $existingRanges[] = [
                'start' => self::timeToMinutes((string) $e['start_time']),
                'end'   => self::timeToMinutes((string) $e['end_time']),
            ];
        }

        $slots = [];
        for ($ts = $openTs; $ts + $dur * 60 <= $closeTs; $ts += $step) {
            $startStr = date('H:i:s', $ts);
            $endStr   = date('H:i:s', $ts + $dur * 60);

            $slotStart = self::timeToMinutes($startStr);
            $slotEnd   = self::timeToMinutes($endStr);

            $overlap = 0;
            foreach ($existingRanges as $r) {
                if ($r['start'] < $slotEnd && $r['end'] > $slotStart) {
                    $overlap++;
                }
            }

            if ($overlap < $cap) {
                $slots[] = ['start' => $startStr, 'end' => $endStr];
            }
        }

        json_ok([
            'slots'   => $slots,
            'reason'  => empty($slots) ? 'fully_booked' : null,
            'service' => $service->toArray(),
        ]);
    }

    
    public function createPublic(): void
    {
        $input = input();

        $companyId = (int) ($input['company_id'] ?? 0);
        $serviceId = (int) ($input['service_id'] ?? 0);
        $date      = trim((string) ($input['booking_date'] ?? ''));
        $startTime = trim((string) ($input['start_time'] ?? ''));

        $name  = trim((string) ($input['name'] ?? ''));
        $email = strtolower(trim((string) ($input['email'] ?? '')));
        $phone = $input['phone'] ?? null;

        if (!$companyId || !$serviceId || !$date || !$startTime) {
            json_err('Missing required fields', 422);
        }
        if (!$name || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            json_err('Valid name and email required', 422);
        }

        // Validim datë
        $dt = \DateTime::createFromFormat('Y-m-d', $date);
        if (!$dt || $dt->format('Y-m-d') !== $date) {
            json_err('Invalid date format (YYYY-MM-DD)', 422);
        }

        // Validim orë (HH:MM ose HH:MM:SS)
        if (!preg_match('/^\d{2}:\d{2}(:\d{2})?$/', $startTime)) {
            json_err('Invalid start_time format (HH:MM)', 422);
        }
        if (strlen($startTime) === 5) {
            $startTime .= ':00';
        }

        $service = Service::findById($serviceId);
        if (!$service || $service->company_id !== $companyId || !$service->active) {
            json_err('Service not found', 404);
        }

        $dur = max(1, (int) $service->duration_minutes);
        $cap = max(1, (int) $service->capacity);

        $db = Database::pdo();

        if ($dt < new \DateTime('today')) {
            json_err('Booking date cannot be in the past', 422);
        }

        $dow = (int) $dt->format('w');
        $hoursStmt = $db->prepare("SELECT open_time, close_time, is_closed FROM working_hours WHERE company_id = ? AND day_of_week = ? LIMIT 1");
        $hoursStmt->execute([$companyId, $dow]);
        $hours = $hoursStmt->fetch();
        if (!$hours || (int) $hours['is_closed'] === 1 || empty($hours['open_time']) || empty($hours['close_time'])) {
            json_err('Company is closed on this date', 422);
        }

                $holidayStmt = $db->prepare("
            SELECT 1 FROM holidays
            WHERE company_id = ?
              AND (date = ? OR (is_recurring = 1 AND DATE_FORMAT(date, '%m-%d') = DATE_FORMAT(?, '%m-%d')))
            LIMIT 1
                ");
        $holidayStmt->execute([$companyId, $date, $date]);
        if ($holidayStmt->fetchColumn()) {
            json_err('Company is closed on this date', 422);
        }

        $startTs = strtotime("$date $startTime");
        $endTs = $startTs + $dur * 60;
        $openTs = strtotime("$date {$hours['open_time']}");
        $closeTs = strtotime("$date {$hours['close_time']}");
        if ($startTs === false || $openTs === false || $closeTs === false || $startTs < $openTs || $endTs > $closeTs) {
            json_err('Selected time is outside working hours', 422);
        }
        if (($startTs - $openTs) % (15 * 60) !== 0) {
            json_err('Selected time is not an available slot', 422);
        }

        $lockName = "booking:$companyId:$serviceId:$date";
        $lockStmt = $db->prepare('SELECT GET_LOCK(?, 5)');
        $lockStmt->execute([$lockName]);
        if ((int) $lockStmt->fetchColumn() !== 1) {
            json_err('Could not reserve the selected slot', 409);
        }

        // Double-check overlap
        $endTime = date('H:i:s', strtotime($startTime) + $dur * 60);

        $stmt = $db->prepare("
            SELECT COUNT(*) FROM bookings
            WHERE company_id = ? AND service_id = ? AND booking_date = ?
              AND status IN ('pending', 'confirmed')
              AND start_time < ? AND end_time > ?
        ");
        try {
            $db->beginTransaction();
            $stmt->execute([$companyId, $serviceId, $date, $endTime, $startTime]);
            $overlap = (int) $stmt->fetchColumn();

            if ($overlap >= $cap) {
                $db->rollBack();
                $db->prepare('SELECT RELEASE_LOCK(?)')->execute([$lockName]);
                json_err('Slot no longer available', 409);
            }

            $customerId = Booking::findOrCreateCustomer($companyId, $name, $email, $phone);
            $booking = Booking::create($companyId, $customerId, $serviceId, [
                'booking_date' => $date,
                'start_time'   => $startTime,
                'total_price'  => $service->price,
                'notes'        => $input['notes'] ?? null,
            ]);
            $db->commit();
        } catch (\Throwable $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            throw $e;
        } finally {
            $db->prepare('SELECT RELEASE_LOCK(?)')->execute([$lockName]);
        }

        $notificationStmt = $db->prepare("
            SELECT
                b.id,
                b.booking_date,
                b.start_time,
                b.total_price,
                cu.name AS customer_name,
                cu.email AS customer_email,
                s.name AS service_name,
                u.name AS owner_name,
                u.email AS owner_email
            FROM bookings b
            JOIN customers cu ON cu.id = b.customer_id
            JOIN services s ON s.id = b.service_id
            JOIN company_user companyOwner ON companyOwner.company_id = b.company_id
            JOIN roles ownerRole ON ownerRole.id = companyOwner.role_id AND ownerRole.name = 'owner'
            JOIN users u ON u.id = companyOwner.user_id
            WHERE b.id = ?
            LIMIT 1
        ");
        $notificationStmt->execute([$booking->id]);
        $notification = $notificationStmt->fetch();

        if ($notification) {
            Mailer::sendBookingConfirmation(
                $notification['customer_email'],
                $notification['customer_name'],
                $notification
            );
            Mailer::sendNewBookingToOwner(
                $notification['owner_email'],
                $notification['owner_name'],
                $notification
            );
        }

        json_ok([
            'message' => 'Booking received',
            'booking' => $booking->toArray(),
        ], 201);
    }

    public function updateStatus(array $params): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $companyId = (int) $params['companyId'];
        $bookingId = (int) $params['id'];

        $role = Company::userRole($uid, $companyId);
        if (!in_array($role, ['owner', 'admin', 'manager', 'staff'], true)) {
            json_err('Forbidden', 403);
        }

        $input  = input();
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
        $slug = trim((string) ($params['slug'] ?? ''));
        if (!$slug) json_err('Slug required', 422);

        $db = Database::pdo();

        $stmt = $db->prepare("
            SELECT id, name, slug, email, phone, address, logo_url
            FROM companies
            WHERE slug = ?
            LIMIT 1
        ");
        $stmt->execute([$slug]);
        $company = $stmt->fetch();

        if (!$company) json_err('Company not found', 404);

        $stmt = $db->prepare("
            SELECT id, name, description, duration_minutes, price, capacity
            FROM services
            WHERE company_id = ? AND active = 1
            ORDER BY name
        ");
        $stmt->execute([$company['id']]);
        $services = $stmt->fetchAll();

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

    /**
     */
    private static function timeToMinutes(string $time): int
    {
        $parts = explode(':', $time);
        $h = (int) ($parts[0] ?? 0);
        $m = (int) ($parts[1] ?? 0);
        return $h * 60 + $m;
    }
}