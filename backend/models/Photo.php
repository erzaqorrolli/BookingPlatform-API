<?php
declare(strict_types=1);

namespace App\Models;

use App\Config\Database;

class Photo
{
    public ?int $id = null;
    public int $company_id = 0;
    public string $filename = '';
    public ?string $original_name = null;
    public ?string $mime_type = null;
    public int $size = 0;
    public int $sort_order = 0;
    public int $is_cover = 0;
    public ?string $created_at = null;

    public static function findById(int $id): ?self
    {
        $db = Database::pdo();
        $stmt = $db->prepare("SELECT * FROM photos WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ? self::fromRow($row) : null;
    }

    public static function forCompany(int $companyId): array
    {
        $db = Database::pdo();
        $stmt = $db->prepare("
            SELECT * FROM photos
            WHERE company_id = ?
            ORDER BY is_cover DESC, sort_order ASC, created_at DESC
        ");
        $stmt->execute([$companyId]);
        return array_map(fn($r) => self::fromRow($r), $stmt->fetchAll());
    }

    public static function findDuplicateByContent(int $companyId, string $path): ?self
    {
        if (!is_file($path)) return null;

        $hash = hash_file('sha256', $path);
        if ($hash === false) return null;

        foreach (self::forCompany($companyId) as $photo) {
            $existingPath = __DIR__ . '/../storage/uploads/' . $photo->filename;
            if (is_file($existingPath) && hash_file('sha256', $existingPath) === $hash) {
                return $photo;
            }
        }

        return null;
    }

    public static function create(int $companyId, array $data): self
    {
        $db = Database::pdo();

        if (!empty($data['is_cover'])) {
            $db->prepare("UPDATE photos SET is_cover = 0 WHERE company_id = ?")
               ->execute([$companyId]);
        }

        $stmt = $db->prepare("
            INSERT INTO photos 
            (company_id, filename, original_name, mime_type, size, is_cover)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $companyId,
            $data['filename'],
            $data['original_name'] ?? null,
            $data['mime_type'] ?? null,
            $data['size'] ?? 0,
            (int) ($data['is_cover'] ?? 0),
        ]);

        return self::findById((int) $db->lastInsertId());
    }

    public function setAsCover(): bool
    {
        if ($this->id === null) return false;

        $db = Database::pdo();
        $db->prepare("UPDATE photos SET is_cover = 0 WHERE company_id = ?")
           ->execute([$this->company_id]);

        $stmt = $db->prepare("UPDATE photos SET is_cover = 1 WHERE id = ?");
        return $stmt->execute([$this->id]);
    }

    public function delete(): bool
    {
        if ($this->id === null) return false;

        // Fshij file-in fizik
        $path = __DIR__ . '/../storage/uploads/' . $this->filename;
        if (file_exists($path)) {
            @unlink($path);
        }

        return Database::pdo()
            ->prepare("DELETE FROM photos WHERE id = ?")
            ->execute([$this->id]);
    }

    public function toArray(): array
    {
           $url = ($_ENV['APP_URL'] ?? 'http://localhost/booking-api')
               . '/public/storage/uploads/' . $this->filename;

        return [
            'id'            => $this->id,
            'company_id'    => $this->company_id,
            'filename'      => $this->filename,
            'original_name' => $this->original_name,
            'mime_type'     => $this->mime_type,
            'size'          => $this->size,
            'sort_order'    => $this->sort_order,
            'is_cover'      => $this->is_cover,
            'url'           => $url,
            'created_at'    => $this->created_at,
        ];
    }

    private static function fromRow(array $row): self
    {
        $p = new self();
        $p->id            = (int) $row['id'];
        $p->company_id    = (int) $row['company_id'];
        $p->filename      = $row['filename'];
        $p->original_name = $row['original_name'] ?? null;
        $p->mime_type     = $row['mime_type'] ?? null;
        $p->size          = (int) $row['size'];
        $p->sort_order    = (int) $row['sort_order'];
        $p->is_cover      = (int) $row['is_cover'];
        $p->created_at    = $row['created_at'] ?? null;
        return $p;
    }
}