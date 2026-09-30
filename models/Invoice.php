<?php

declare(strict_types=1);    

namespace App\Models;

use App\Config\Database;

class Invoice{

    public ?int $id = null;
    public ?string $reference = null;
    public int $company_id = 0;
    public int $booking_id = 0;
    public int $customer_id = 0;
    public ?string $issue_date = null;
    public ?string $due_date = null;
    public float $subtotal = 0.0;
    public float $discount_amount = 0.0;
    public float $tax_amount = 0.0;
    public float $total = 0.0;
    public string $status = 'draft';
    public ?string $paid_at = null;
    public ?string $payment_method = null;
    public ?string $notes = null;
    public ?string $created_at = null;
    public ?string $updated_at = null;

    public static function fromRow(array $row): self
    {
        $invoice = new self();
        $invoice->id = isset($row['id']) ? (int) $row['id'] : null;
        $invoice->reference = $row['reference'] ?? null;
        $invoice->company_id = isset($row['company_id']) ? (int) $row['company_id'] : 0;
        $invoice->booking_id = isset($row['booking_id']) ? (int) $row['booking_id'] : 0;
        $invoice->customer_id = isset($row['customer_id']) ? (int) $row['customer_id'] : 0;
        $invoice->issue_date = $row['issue_date'] ?? null;
        $invoice->due_date = $row['due_date'] ?? null;
        $invoice->subtotal = isset($row['subtotal']) ? (float) $row['subtotal'] : 0.0;
        $invoice->discount_amount = isset($row['discount_amount']) ? (float) $row['discount_amount'] : 0.0;
        $invoice->tax_amount = isset($row['tax_amount']) ? (float) $row['tax_amount'] : 0.0;
        $invoice->total = isset($row['total']) ? (float) $row['total'] : 0.0;
        $invoice->status = $row['status'] ?? 'draft';
        $invoice->paid_at = $row['paid_at'] ?? null;
        $invoice->payment_method = $row['payment_method'] ?? null;
        $invoice->notes = $row['notes'] ?? null;
        $invoice->created_at = $row['created_at'] ?? null;
        $invoice->updated_at = $row['updated_at'] ?? null;

        return $invoice;
    }

   public static function findById(int $id): ?self
{
    $db = Database::pdo();
    $stmt = $db->prepare("
        SELECT 
            i.*,
            c.name AS customer_name,
            c.email AS customer_email,
            c.phone AS customer_phone,
            b.booking_date,
            b.start_time,
            b.end_time,
            s.name AS service_name,
            co.name AS company_name,
            co.email AS company_email,
            co.phone AS company_phone,
            co.address AS company_address
        FROM invoices i
        LEFT JOIN customers c ON c.id = i.customer_id
        LEFT JOIN bookings b ON b.id = i.booking_id
        LEFT JOIN services s ON s.id = b.service_id
        LEFT JOIN companies co ON co.id = i.company_id
        WHERE i.id = ?
        LIMIT 1
    ");
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    return $row ? self::fromRow($row) : null;
}

    public static function findByBooking(int $bookingId): ?self
    {
        $db = Database::pdo();
        $stmt = $db->prepare("SELECT * FROM invoices WHERE booking_id = ? LIMIT 1");
        $stmt->execute([$bookingId]);
        $row = $stmt->fetch();
        return $row ? self::fromRow($row) : null;
    }

    public static function findByReference(string $reference): ?self
    {
        $db = Database::pdo();
        $stmt = $db->prepare("SELECT * FROM invoices WHERE reference = ? LIMIT 1");
        $stmt->execute([$reference]);
        $row = $stmt->fetch();
        return $row ? self::fromRow($row) : null;
    }

    public static function forCompany(int $companyId, array $filters = []): array
    {
        $db = Database::pdo();

        $sql = "
            SELECT 
                i.*,
                c.name AS customer_name,
                c.email AS customer_email,
                c.phone AS customer_phone,
                b.booking_date,
                b.start_time,
                b.end_time,
                s.name AS service_name,
                co.name AS company_name,
                co.email AS company_email,
                co.phone AS company_phone,
                co.address AS company_address
            FROM invoices i
            JOIN customers c ON c.id = i.customer_id
            JOIN bookings b ON b.id = i.booking_id
            JOIN services s ON s.id = b.service_id
            JOIN companies co ON co.id = i.company_id
            WHERE i.company_id = ?
        ";
        $params = [$companyId];

        if (!empty($filters['status'])) {
            $sql .= " AND i.status = ?";
            $params[] = $filters['status'];
        }

        if (!empty($filters['customer_id'])) {
            $sql .= " AND i.customer_id = ?";
            $params[] = (int) $filters['customer_id'];
        }

        if (!empty($filters['search'])) {
            $sql .= " AND (i.reference LIKE ? OR c.name LIKE ? OR c.email LIKE ?)";
            $search = '%' . $filters['search'] . '%';
            $params[] = $search;
            $params[] = $search;
            $params[] = $search;
        }

        $sql .= " ORDER BY i.created_at DESC LIMIT 500";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public static function generateReference(): string
    {
        $db = Database::pdo();

        do {
            $reference = 'INV-' . date('Y') . '-' . str_pad((string) random_int(0, 99999), 5, '0', STR_PAD_LEFT);
            $stmt = $db->prepare("SELECT 1 FROM invoices WHERE reference = ? LIMIT 1");
            $stmt->execute([$reference]);
        } while ($stmt->fetchColumn());

        return $reference;
    }

    public static function createFromBooking(int $bookingId): ?self
    {
        $existing = self::findByBooking($bookingId);
        if ($existing) {
            return $existing;
        }

        $db = Database::pdo();

        $stmt = $db->prepare("SELECT b.*, s.name AS service_name, s.price AS service_price, s.duration_minutes
            FROM bookings b
            JOIN services s ON s.id = b.service_id
            WHERE b.id = ?
            LIMIT 1");
        $stmt->execute([$bookingId]);
        $booking = $stmt->fetch();

        if (!$booking) {
            return null;
        }

        $companyStmt = $db->prepare("SELECT * FROM companies WHERE id = ? LIMIT 1");
        $companyStmt->execute([$booking['company_id']]);
        $company = $companyStmt->fetch();

        if (!$company) {
            return null;
        }

        $subtotal = (float) $booking['total_price'];
        $taxRate = isset($company['tax_rate']) ? (float) $company['tax_rate'] : 0.0;
        $taxAmount = round($subtotal * $taxRate / 100, 2);
        $total = round($subtotal + $taxAmount, 2);

        $reference = self::generateReference();
        $issueDate = date('Y-m-d');
        $dueDate = date('Y-m-d', strtotime('+14 days'));

        $insertStmt = $db->prepare("INSERT INTO invoices (
                reference, company_id, booking_id, customer_id, issue_date, due_date,
                subtotal, discount_amount, tax_amount, total, status, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

        $insertStmt->execute([
            $reference,
            $booking['company_id'],
            $bookingId,
            $booking['customer_id'],
            $issueDate,
            $dueDate,
            $subtotal,
            0,
            $taxAmount,
            $total,
            'draft',
            null,
        ]);

        return self::findById((int) $db->lastInsertId());
    }

    public function updateStatus(string $status): bool
    {
        if ($this->id === null) {
            return false;
        }

        $allowed = ['draft', 'sent', 'paid', 'cancelled'];
        if (!in_array($status, $allowed, true)) {
            return false;
        }

        $db = Database::pdo();

        if ($status === 'paid') {
            $stmt = $db->prepare("UPDATE invoices SET status = ?, paid_at = NOW() WHERE id = ?");
            return $stmt->execute([$status, $this->id]);
        }

        $stmt = $db->prepare("UPDATE invoices SET status = ? WHERE id = ?");
        return $stmt->execute([$status, $this->id]);
    }

    public function markAsPaid(?string $method = null): bool
    {
        if ($this->id === null) {
            return false;
        }

        $db = Database::pdo();
        $stmt = $db->prepare("UPDATE invoices SET status = 'paid', paid_at = NOW(), payment_method = ? WHERE id = ?");
        return $stmt->execute([$method, $this->id]);
    }

    public function delete(): bool
    {
        if ($this->id === null) {
            return false;
        }

        return Database::pdo()
            ->prepare("DELETE FROM invoices WHERE id = ?")
            ->execute([$this->id]);
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'company_id' => $this->company_id,
            'booking_id' => $this->booking_id,
            'customer_id' => $this->customer_id,
            'issue_date' => $this->issue_date,
            'due_date' => $this->due_date,
            'subtotal' => (float) $this->subtotal,
            'discount_amount' => (float) $this->discount_amount,
            'tax_amount' => (float) $this->tax_amount,
            'total' => (float) $this->total,
            'status' => $this->status,
            'paid_at' => $this->paid_at,
            'payment_method' => $this->payment_method,
            'notes' => $this->notes,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}