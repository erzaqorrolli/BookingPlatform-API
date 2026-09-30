<?php
declare(strict_types=1);

namespace App\Models;

use App\Config\Database;

class Review
{
    public ?int $id = null;
    public int $company_id = 0;
    public int $booking_id = 0;
    public int $customer_id = 0;
    public int $user_id = 0;
    public int $service_id = 0;
    public int $rating = 0;
    public ?string $comment = null;
    public ?string $created_at = null;

    public static function findById(int $id): ?self
    {
        $db = Database::pdo();
        $stmt = $db->prepare("SELECT * FROM reviews WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ? self::fromRow($row) : null;
    }

    public static function findByBooking(int $bookingId): ?self
    {
        $db = Database::pdo();
        $stmt = $db->prepare("SELECT * FROM reviews WHERE booking_id = ?");
        $stmt->execute([$bookingId]);
        $row = $stmt->fetch();
        return $row ? self::fromRow($row) : null;
    }

    /**
     * Reviews për një kompani (me emër user)
     */
    public static function forCompany(int $companyId, int $limit = 20): array
    {
        $db = Database::pdo();
        $stmt = $db->prepare("
            SELECT r.*, u.name AS user_name, s.name AS service_name
            FROM reviews r
            JOIN users u ON u.id = r.user_id
            JOIN services s ON s.id = r.service_id
            WHERE r.company_id = ?
            ORDER BY r.created_at DESC
            LIMIT ?
        ");
        $stmt->bindValue(1, $companyId, \PDO::PARAM_INT);
        $stmt->bindValue(2, $limit, \PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    /**
     * Reviews për një user
     */
    public static function forUser(int $userId): array
    {
        $db = Database::pdo();
        $stmt = $db->prepare("
            SELECT r.*, c.name AS company_name, c.slug AS company_slug, s.name AS service_name
            FROM reviews r
            JOIN companies c ON c.id = r.company_id
            JOIN services s ON s.id = r.service_id
            WHERE r.user_id = ?
            ORDER BY r.created_at DESC
        ");
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }

    /**
     * Mesatarja e rating-ut për kompani
     */
    public static function averageForCompany(int $companyId): array
    {
        $db = Database::pdo();
        $stmt = $db->prepare("
            SELECT 
                COUNT(*) AS total,
                ROUND(AVG(rating), 1) AS average
            FROM reviews
            WHERE company_id = ?
        ");
        $stmt->execute([$companyId]);
        $result = $stmt->fetch();

        return [
            'total'   => (int) ($result['total'] ?? 0),
            'average' => (float) ($result['average'] ?? 0),
        ];
    }

    public static function create(array $data): self
    {
        $db = Database::pdo();
        $stmt = $db->prepare("
            INSERT INTO reviews 
            (company_id, booking_id, customer_id, user_id, service_id, rating, comment)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $data['company_id'],
            $data['booking_id'],
            $data['customer_id'],
            $data['user_id'],
            $data['service_id'],
            $data['rating'],
            $data['comment'] ?? null,
        ]);
        return self::findById((int) $db->lastInsertId());
    }

    public function delete(): bool
    {
        if ($this->id === null) return false;
        return Database::pdo()
            ->prepare("DELETE FROM reviews WHERE id = ?")
            ->execute([$this->id]);
    }

    public function toArray(): array
    {
        return [
            'id'           => $this->id,
            'company_id'   => $this->company_id,
            'booking_id'   => $this->booking_id,
            'customer_id'  => $this->customer_id,
            'user_id'      => $this->user_id,
            'service_id'   => $this->service_id,
            'rating'       => $this->rating,
            'comment'      => $this->comment,
            'created_at'   => $this->created_at,
        ];
    }

    private static function fromRow(array $row): self
    {
        $r = new self();
        $r->id          = (int) $row['id'];
        $r->company_id  = (int) $row['company_id'];
        $r->booking_id  = (int) $row['booking_id'];
        $r->customer_id = (int) $row['customer_id'];
        $r->user_id     = (int) $row['user_id'];
        $r->service_id  = (int) $row['service_id'];
        $r->rating      = (int) $row['rating'];
        $r->comment     = $row['comment'] ?? null;
        $r->created_at  = $row['created_at'] ?? null;
        return $r;
    }
}