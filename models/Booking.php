<?php
declare(strict_types=1);

namespace App\Models;

use App\Config\Database;

class Booking
{
    public ?int $id = null;
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

    public static function create(int $companyId, int $customerId, int $serviceId, array $data): self
    {
        $db = Database::pdo();

        $service = Service::findById($serviceId);
        if (!$service) throw new \RuntimeException('Service not found');

        $endTime = date(
            'H:i:s',
            strtotime($data['start_time']) + $service->duration_minutes * 60
        );

        $stmt = $db->prepare("
            INSERT INTO bookings
            (company_id, customer_id, service_id, booking_date, start_time, end_time, total_price, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $companyId,
            $customerId,
            $serviceId,
            $data['booking_date'],
            $data['start_time'],
            $endTime,
            $data['total_price'] ?? $service->price,
            $data['notes'] ?? null,
        ]);

        return self::findById((int) $db->lastInsertId());
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

    public function toArray(): array
    {
        return [
            'id'           => $this->id,
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
        ];
    }

    private static function fromRow(array $row): self
    {
        $b = new self();
        $b->id           = (int) $row['id'];
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
        return $b;
    }
}