<?php
declare(strict_types=1);

namespace App\Models;

use App\Config\Database;

class Service
{
    public ?int $id = null;
    public int $company_id = 0;
    public string $name = '';
    public ?string $description = null;
    public int $duration_minutes = 0;
    public float $price = 0.0;
    public int $capacity = 1;
    public int $active = 1;
    public ?string $created_at = null;

    public static function findById(int $id): ?self
    {
        $db = Database::pdo();
        $stmt = $db->prepare("SELECT * FROM services WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ? self::fromRow($row) : null;
    }

    public static function forCompany(int $companyId, bool $onlyActive = false): array
    {
        $db = Database::pdo();
        $sql = "SELECT * FROM services WHERE company_id = ?";
        if ($onlyActive) $sql .= " AND active = 1";
        $sql .= " ORDER BY name";

        $stmt = $db->prepare($sql);
        $stmt->execute([$companyId]);
        return array_map(fn($r) => self::fromRow($r), $stmt->fetchAll());
    }

    public static function create(int $companyId, array $data): self
    {
        $db = Database::pdo();
        $stmt = $db->prepare("
            INSERT INTO services (company_id, name, description, duration_minutes, price, capacity, active)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $companyId,
            trim($data['name']),
            $data['description'] ?? null,
            (int) $data['duration_minutes'],
            (float) $data['price'],
            (int) ($data['capacity'] ?? 1),
            (int) ($data['active'] ?? 1),
        ]);

        return self::findById((int) $db->lastInsertId());
    }

    public function update(array $data): bool
    {
        if ($this->id === null) return false;

        $db = Database::pdo();
        $fields = [];
        $values = [];

        foreach (['name', 'description', 'duration_minutes', 'price', 'capacity', 'active'] as $f) {
            if (array_key_exists($f, $data)) {
                $fields[] = "$f = ?";
                $values[] = $data[$f];
            }
        }

        if (empty($fields)) return false;

        $values[] = $this->id;
        $sql = "UPDATE services SET " . implode(', ', $fields) . " WHERE id = ?";
        return $db->prepare($sql)->execute($values);
    }

    public function delete(): bool
    {
        if ($this->id === null) return false;

        $db = Database::pdo();
        return $db->prepare("DELETE FROM services WHERE id = ?")->execute([$this->id]);
    }

    public function toArray(): array
    {
        return [
            'id'               => $this->id,
            'company_id'       => $this->company_id,
            'name'             => $this->name,
            'description'      => $this->description,
            'duration_minutes' => $this->duration_minutes,
            'price'            => (float) $this->price,
            'capacity'         => $this->capacity,
            'active'           => $this->active,
            'created_at'       => $this->created_at,
        ];
    }

    private static function fromRow(array $row): self
    {
        $s = new self();
        $s->id               = (int) $row['id'];
        $s->company_id       = (int) $row['company_id'];
        $s->name             = $row['name'];
        $s->description      = $row['description'] ?? null;
        $s->duration_minutes = (int) $row['duration_minutes'];
        $s->price            = (float) $row['price'];
        $s->capacity         = (int) $row['capacity'];
        $s->active           = (int) $row['active'];
        $s->created_at       = $row['created_at'] ?? null;
        return $s;
    }
}
