<?php
declare(strict_types=1);

namespace App\Models;

use App\Config\Database;

class ContactMessage
{
    public ?int $id = null;
    public string $name = '';
    public string $email = '';
    public string $subject = '';
    public string $message = '';
    public string $status = 'new';
    public ?string $read_at = null;
    public ?string $replied_at = null;
    public ?string $notes = null;
    public ?string $created_at = null;


    public static function findById(int $id): ?self
    {
        $db = Database::pdo();
        $stmt = $db->prepare("SELECT * FROM contact_messages WHERE id = ? LIMIT 1");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ? self::fromRow($row) : null;
    }

    public static function forAdmin(array $filters = []): array
    {
        $db = Database::pdo();

        $sql = "SELECT * FROM contact_messages WHERE 1=1";
        $params = [];

        if (!empty($filters['status']) && in_array($filters['status'], ['new', 'read', 'replied', 'archived'], true)) {
            $sql .= " AND status = ?";
            $params[] = $filters['status'];
        }

        if (!empty($filters['search'])) {
            $sql .= " AND (name LIKE ? OR email LIKE ? OR subject LIKE ?)";
            $like = '%' . $filters['search'] . '%';
            $params[] = $like;
            $params[] = $like;
            $params[] = $like;
        }

        $sql .= " ORDER BY created_at DESC LIMIT 500";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        return array_map(fn($r) => self::fromRow($r), $stmt->fetchAll());
    }

    public static function countByStatus(string $status): int
    {
        $db = Database::pdo();
        $stmt = $db->prepare("SELECT COUNT(*) FROM contact_messages WHERE status = ?");
        $stmt->execute([$status]);
        return (int) $stmt->fetchColumn();
    }

    public static function create(array $data): self
    {
        $db = Database::pdo();
        $stmt = $db->prepare("
            INSERT INTO contact_messages (name, email, subject, message)
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([
            trim($data['name']),
            strtolower(trim($data['email'])),
            trim($data['subject']),
            trim($data['message']),
        ]);

        return self::findById((int) $db->lastInsertId());
    }


    public function markAsRead(): bool
    {
        if ($this->id === null) return false;

        $db = Database::pdo();
        $stmt = $db->prepare("
            UPDATE contact_messages
            SET status = 'read', read_at = NOW()
            WHERE id = ? AND status = 'new'
        ");
        $stmt->execute([$this->id]);

        if ($stmt->rowCount() > 0) {
            $this->status = 'read';
            $this->read_at = date('Y-m-d H:i:s');
            return true;
        }
        return false;
    }

    public function markAsReplied(): bool
    {
        if ($this->id === null) return false;

        $db = Database::pdo();
        $stmt = $db->prepare("
            UPDATE contact_messages
            SET status = 'replied', replied_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$this->id]);

        $this->status = 'replied';
        $this->replied_at = date('Y-m-d H:i:s');
        return $stmt->rowCount() > 0;
    }

    public function updateStatus(string $status): bool
    {
        if ($this->id === null) return false;
        if (!in_array($status, ['new', 'read', 'replied', 'archived'], true)) return false;

        $db = Database::pdo();

        if ($status === 'replied') {
            $stmt = $db->prepare("UPDATE contact_messages SET status = ?, replied_at = NOW() WHERE id = ?");
        } elseif ($status === 'read') {
            $stmt = $db->prepare("UPDATE contact_messages SET status = ?, read_at = NOW() WHERE id = ?");
        } else {
            $stmt = $db->prepare("UPDATE contact_messages SET status = ? WHERE id = ?");
        }

        return $stmt->execute([$status, $this->id]);
    }

    public function updateNotes(?string $notes): bool
    {
        if ($this->id === null) return false;

        $db = Database::pdo();
        $stmt = $db->prepare("UPDATE contact_messages SET notes = ? WHERE id = ?");
        return $stmt->execute([$notes, $this->id]);
    }

    public function delete(): bool
    {
        if ($this->id === null) return false;
        return Database::pdo()
            ->prepare("DELETE FROM contact_messages WHERE id = ?")
            ->execute([$this->id]);
    }


    public function toArray(): array
    {
        return [
            'id'         => $this->id,
            'name'       => $this->name,
            'email'      => $this->email,
            'subject'    => $this->subject,
            'message'    => $this->message,
            'status'     => $this->status,
            'read_at'    => $this->read_at,
            'replied_at' => $this->replied_at,
            'notes'      => $this->notes,
            'created_at' => $this->created_at,
        ];
    }

    public static function fromRow(array $row): self
    {
        $m = new self();
        $m->id         = (int) $row['id'];
        $m->name       = $row['name'];
        $m->email      = $row['email'];
        $m->subject    = $row['subject'];
        $m->message    = $row['message'];
        $m->status     = $row['status'] ?? 'new';
        $m->read_at    = $row['read_at'] ?? null;
        $m->replied_at = $row['replied_at'] ?? null;
        $m->notes      = $row['notes'] ?? null;
        $m->created_at = $row['created_at'] ?? null;
        return $m;
    }
}