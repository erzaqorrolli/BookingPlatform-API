<?php
declare(strict_types=1);

namespace App\Models;

use App\Config\Database;

class Holiday
{
    public ?int $id = null;
    public int $company_id = 0;
    public string $date = '';
    public string $name = '';
    public int $is_recurring = 0;
    public ?string $created_at = null;

    public static function findById(int $id): ?self
    {
        $db = Database::pdo();
        $stmt = $db->prepare("SELECT * FROM holidays WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ? self::fromRow($row) : null;
    }

    public static function forCompany(int $companyId): array
    {
        $db = Database::pdo();
        $stmt = $db->prepare("
            SELECT * FROM holidays
            WHERE company_id = ?
            ORDER BY date DESC
        ");
        $stmt->execute([$companyId]);
        return array_map(fn($r) => self::fromRow($r), $stmt->fetchAll());
    }

    public static function create(int $companyId, array $data): self
    {
        $db = Database::pdo();
        $stmt = $db->prepare("
            INSERT INTO holidays (company_id, date, name, is_recurring)
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([
            $companyId,
            $data['date'],
            trim($data['name'] ?? ''),
            (int) ($data['is_recurring'] ?? 0),
        ]);
        return self::findById((int) $db->lastInsertId());
    }

    public function update(array $data): bool
    {
        if ($this->id === null) return false;

        $db = Database::pdo();
        $fields = [];
        $values = [];

        foreach (['date', 'name', 'is_recurring'] as $f) {
            if (array_key_exists($f, $data)) {
                $fields[] = "$f = ?";
                $values[] = $data[$f];
            }
        }

        if (empty($fields)) return false;

        $values[] = $this->id;
        $sql = "UPDATE holidays SET " . implode(', ', $fields) . " WHERE id = ?";
        return $db->prepare($sql)->execute($values);
    }

    public function delete(): bool
    {
        if ($this->id === null) return false;
        return Database::pdo()
            ->prepare("DELETE FROM holidays WHERE id = ?")
            ->execute([$this->id]);
    }

    public function toArray(): array
    {
        return [
            'id'           => $this->id,
            'company_id'   => $this->company_id,
            'date'         => $this->date,
            'name'         => $this->name,
            'is_recurring' => $this->is_recurring,
            'created_at'   => $this->created_at,
        ];
    }

    public static function fromRow(array $row): self
    {
        $h = new self();
        $h->id           = (int) $row['id'];
        $h->company_id   = (int) $row['company_id'];
        $h->date         = $row['date'];
        $h->name         = $row['name'] ?? '';
        $h->is_recurring = (int) ($row['is_recurring'] ?? 0);
        $h->created_at   = $row['created_at'] ?? null;
        return $h;
    }
}