<?php
declare(strict_types=1);

namespace App\Models;

use App\Config\Database;

class Booking
{
    public ?int $id = null;
    public ?string $reference = null;
    public int $company_id = 0;
    public int $customer_id = 0;
    public int $service_id = 0;
    public string $booking_date = '';
    public string $start_time = '';
    public string $end_time = '';
    public string $status = 'pending';
    public float $total_price = 0.0;
    public ?string $notes = null;
    public ?string $created_at = null;
    public int $needs_assistance = 0;
    public ?string $assistance_notes=null;

    public ?string $cancelled_at = null;
    public ?string $cancelled_by = null;
    public ?string $cancellation_reason = null;




    public static function findById(int $id): ?self
    {
        $db = Database::pdo();
        $stmt = $db->prepare("SELECT * FROM bookings WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ? self::fromRow($row) : null;
    }

    public static function forCompany(int $companyId, array $filters = []): array
    {
        $db = Database::pdo();
        $sql = "
            SELECT b.*, c.name AS customer_name, c.email AS customer_email, c.phone AS customer_phone,
                   s.name AS service_name, s.duration_minutes
            FROM bookings b
            JOIN customers c ON c.id = b.customer_id
            JOIN services s ON s.id = b.service_id
            WHERE b.company_id = ?
        ";
        $params = [$companyId];

        if (!empty($filters['status'])) {
            $sql .= " AND b.status = ?";
            $params[] = $filters['status'];
        }
        if (!empty($filters['date'])) {
            $sql .= " AND b.booking_date = ?";
            $params[] = $filters['date'];
        }

        $sql .= " ORDER BY b.booking_date DESC, b.start_time DESC LIMIT 200";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public static function findOrCreateCustomer(
        int $companyId,
        string $name,
        string $email,
        ?string $phone = null
    ): int {
        $db = Database::pdo();
        $userId = auth_user_id();

        $stmt = $db->prepare("SELECT id, user_id FROM customers WHERE company_id = ? AND email = ?");
        $stmt->execute([$companyId, strtolower(trim($email))]);
        $customer = $stmt->fetch();

        if ($customer) {
            if ($userId && empty($customer['user_id'])) {
                $stmt = $db->prepare("UPDATE customers SET user_id = ? WHERE id = ?");
                $stmt->execute([$userId, $customer['id']]);
            }

            return (int) $customer['id'];
        }

        $stmt = $db->prepare("
            INSERT INTO customers (company_id, user_id, name, email, phone)
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([$companyId, $userId, trim($name), strtolower(trim($email)), $phone]);

        return (int) $db->lastInsertId();
    }

    public static function generateReference(): string
    {
        $db = Database::pdo();

        do {
            $reference = 'BO-' . str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            $stmt = $db->prepare("SELECT 1 FROM bookings WHERE reference = ? LIMIT 1");
            $stmt->execute([$reference]);
        } while ($stmt->fetchColumn());

        return $reference;
    }

    public static function create(int $companyId, int $customerId, int $serviceId, array $data): self
    {
        $db = Database::pdo();

        $service = Service::findById($serviceId);
        if (!$service) throw new \RuntimeException('Service not found');

        $endTime = $data['end_time'] ?? date(
            'H:i:s',
            strtotime($data['start_time']) + $service->duration_minutes * 60
        );

        $reference = self::generateReference();

        $stmt = $db->prepare("
            INSERT INTO bookings
                (reference, company_id, customer_id, service_id, booking_date, start_time, end_time, total_price, notes, needs_assistance, assistance_notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,?,?)
        ");
        $stmt->execute([
            $reference,
            $companyId,
            $customerId,
            $serviceId,
            $data['booking_date'],
            $data['start_time'],
            $endTime,
            $data['total_price'] ?? $service->price,
            $data['notes'] ?? null,
            !empty($data['needs_assistance']) ? 1:0,
            $data['assistance_notes'] ?? null,
        ]);

        return self::findById((int) $db->lastInsertId());
    }

    public function cancelByCustomer(string $reason): bool
{
    if ($this->id === null) return false;

    if (!in_array($this->status, ['pending', 'confirmed'], true)) {
        return false;
    }

    $bookingTime = strtotime($this->booking_date . ' ' . $this->start_time);
    if (($bookingTime - time()) < 2 * 3600) {
        return false;
    }

    $db = Database::pdo();
    $stmt = $db->prepare("UPDATE bookings SET status = 'cancelled', cancelled_at = NOW(), cancelled_by = 'customer', cancellation_reason = ? WHERE id = ?");
    return $stmt->execute([$reason, $this->id]);
}
    public function updateStatus(string $status): bool
    {
        if ($this->id === null) return false;

        $allowed = ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'];
        if (!in_array($status, $allowed)) return false;

        $db = Database::pdo();
        $stmt = $db->prepare("UPDATE bookings SET status = ? WHERE id = ?");
        return $stmt->execute([$status, $this->id]);
    }


    public function cancel(string $reason, string $by = 'customer'): bool{

    if($this->id ===null) return false;

    if(!in_array($this->status,['pending','confirmed'])){
        return false;
    }

    $db = Database::pdo();
    $stmt =$db->prepare("UPDATE bookings SET status = 'cancelled', cancelled_at = NOW(), cancelled_by = ?, cancellation_reason = ? WHERE id = ?");
    return $stmt->execute([$by,$reason,$this->id]);
    }

    public function canBeCancelled(): bool{
        if(!in_array($this->status,['pending', 'confirmed'])){
            return false;
        }

        $bookingDateTime = strtotime ($this->booking_date . ' ' . $this->start_time );
        $now = time();
        $hoursDiff = ($bookingDateTime - $now) / 3600;

        return $hoursDiff >= 2;
    }


    
    public function toArray(): array
    {
        return [
            'id'           => $this->id,
            'reference'    => $this->reference,
            'company_id'   => $this->company_id,
            'customer_id'  => $this->customer_id,
            'service_id'   => $this->service_id,
            'booking_date' => $this->booking_date,
            'start_time'   => $this->start_time,
            'end_time'     => $this->end_time,
            'status'       => $this->status,
            'total_price'  => (float) $this->total_price,
            'notes'        => $this->notes,
            'created_at'   => $this->created_at,
            'needs_assistance' => $this->needs_assistance,
            'assistance_notes' => $this->assistance_notes,
            'cancelled_at' => $this->cancelled_at, 
            'cancelled_by' => $this->cancelled_by,
            'cancellation_reason' => $this->cancellation_reason,
        ];
    }

    private static function fromRow(array $row): self
    {
        $b = new self();
        $b->id           = (int) $row['id'];
        $b->reference    = $row['reference'] ?? null;
        $b->company_id   = (int) $row['company_id'];
        $b->customer_id  = (int) $row['customer_id'];
        $b->service_id   = (int) $row['service_id'];
        $b->booking_date = $row['booking_date'];
        $b->start_time   = $row['start_time'];
        $b->end_time     = $row['end_time'];
        $b->status       = $row['status'];
        $b->total_price  = (float) $row['total_price'];
        $b->notes        = $row['notes'] ?? null;
        $b->created_at   = $row['created_at'] ?? null;
        $b->needs_assistance = isset($row['needs_assistance']) ? (int) $row['needs_assistance'] : 0;
        $b->assistance_notes = $row['assistance_notes'] ?? null;
        $b->cancelled_at=$row['cancelled_at'] ?? null;
        $b->cancelled_by=$row['cancelled_by'] ?? null;
        $b->cancellation_reason=$row['cancellation_reason'] ?? null;
        return $b;
    }
}