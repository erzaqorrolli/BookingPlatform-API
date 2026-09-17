<?php
declare(strict_types=1);

namespace App\Models;

use App\Config\Database;

class Discount
{
    public ?int $id = null;
    public int $company_id = 0;
    public string $code = '';
    public string $type = 'percent';
    public float $value = 0.0;
    public ?string $valid_from = null;
    public ?string $valid_to = null;
    public ?int $usage_limit = null;
    public int $used_count = 0;
    public int $active = 1;
    public ?string $created_at = null;

    public static function findById(int $id): ?self
    {
        $db = Database::pdo();
        $stmt = $db->prepare("SELECT * FROM discounts WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ? self::fromRow($row) : null;
    }

    public static function findByCode(int $companyId, string $code): ?self
    {
        $db = Database::pdo();
        $stmt = $db->prepare("
            SELECT * FROM discounts
            WHERE company_id = ? AND code = ? AND active = 1
            AND (valid_from IS NULL OR valid_from <= CURDATE())
            AND (valid_to IS NULL OR valid_to >= CURDATE())
            AND (usage_limit IS NULL OR used_count < usage_limit)
        ");
        $stmt->execute([$companyId, strtoupper(trim($code))]);
        $row = $stmt->fetch();
        return $row ? self::fromRow($row) : null;
    }

    public static function forCompany(int $companyId): array
    {
        $db = Database::pdo();
        $stmt = $db->prepare("SELECT * FROM discounts WHERE company_id = ? ORDER BY created_at DESC");
        $stmt->execute([$companyId]);
        return array_map(fn($r) => self::fromRow($r), $stmt->fetchAll());
    }

    public static function create(int $companyId, array $data): self
    {
        $db = Database::pdo();
        $stmt = $db->prepare("
            INSERT INTO discounts (company_id, code, type, value, valid_from, valid_to, usage_limit, active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $companyId,
            strtoupper(trim($data['code'])),
            $data['type'] ?? 'percent',
            (float) $data['value'],
            $data['valid_from'] ?? null,
            $data['valid_to'] ?? null,
            isset($data['usage_limit']) ? (int) $data['usage_limit'] : null,
            (int) ($data['active'] ?? 1),
        ]);
        return self::findById((int) $db->lastInsertId());
    }

    public function applyTo(float $price): float
    {
        if ($this->type === 'percent') {
            return max(0, $price - ($price * $this->value / 100));
        }
        return max(0, $price - $this->value);
    }

    public function incrementUsage(): void
    {
        if ($this->id === null) return;
        Database::pdo()
            ->prepare("UPDATE discounts SET used_count = used_count + 1 WHERE id = ?")
            ->execute([$this->id]);
    }

    public function delete(): bool
    {
        if ($this->id === null) return false;
        return Database::pdo()
            ->prepare("DELETE FROM discounts WHERE id = ?")
            ->execute([$this->id]);
    }

    public function toArray(): array
    {
        return [
            'id'          => $this->id,
            'company_id'  => $this->company_id,
            'code'        => $this->code,
            'type'        => $this->type,
            'value'       => (float) $this->value,
            'valid_from'  => $this->valid_from,
            'valid_to'    => $this->valid_to,
            'usage_limit' => $this->usage_limit,
            'used_count'  => $this->used_count,
            'active'      => $this->active,
        ];
    }

    private static function fromRow(array $row): self
    {
        $d = new self();
        $d->id          = (int) $row['id'];
        $d->company_id  = (int) $row['company_id'];
        $d->code        = $row['code'];
        $d->type        = $row['type'];
        $d->value       = (float) $row['value'];
        $d->valid_from  = $row['valid_from'] ?? null;
        $d->valid_to    = $row['valid_to'] ?? null;
        $d->usage_limit = $row['usage_limit'] !== null ? (int) $row['usage_limit'] : null;
        $d->used_count  = (int) $row['used_count'];
        $d->active      = (int) $row['active'];
        return $d;
    }
}