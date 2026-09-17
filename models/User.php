<?php
declare(strict_types=1);

namespace App\Models;

use App\Config\Database;

class User
{
    public ?int $id = null;
    public string $name = '';
    public string $email = '';
    public string $password = '';
    public ?string $email_verified_at = null;
    public ?string $verification_token = null;
    public ?string $reset_token = null;
    public ?string $reset_expires = null;
    public ?string $created_at = null;
    public ?string $updated_at = null;

    public static function findById(int $id): ?self
    {
        $db = Database::pdo();
        $stmt = $db->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();

        return $row ? self::fromRow($row) : null;
    }

    public static function findByEmail(string $email): ?self
    {
        $db = Database::pdo();
        $stmt = $db->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([strtolower(trim($email))]);
        $row = $stmt->fetch();

        return $row ? self::fromRow($row) : null;
    }

    public static function findByVerificationToken(string $token): ?self
    {
        $db = Database::pdo();
        $stmt = $db->prepare("SELECT * FROM users WHERE verification_token = ?");
        $stmt->execute([$token]);
        $row = $stmt->fetch();

        return $row ? self::fromRow($row) : null;
    }

    public static function findByResetToken(string $token): ?self
    {
        $db = Database::pdo();
        $stmt = $db->prepare("
            SELECT * FROM users
            WHERE reset_token = ? AND reset_expires > NOW()
        ");
        $stmt->execute([$token]);
        $row = $stmt->fetch();

        return $row ? self::fromRow($row) : null;
    }

    public static function create(string $name, string $email, string $password, string $verificationToken): self
    {
        $db = Database::pdo();
        $stmt = $db->prepare("
            INSERT INTO users (name, email, password, verification_token)
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([
            trim($name),
            strtolower(trim($email)),
            password_hash($password, PASSWORD_BCRYPT),
            $verificationToken,
        ]);

        return self::findById((int) $db->lastInsertId());
    }

    public function markEmailAsVerified(): bool
    {
        if ($this->id === null) return false;

        $db = Database::pdo();
        $stmt = $db->prepare("
            UPDATE users
            SET email_verified_at = NOW(), verification_token = NULL
            WHERE id = ?
        ");
        $stmt->execute([$this->id]);

        return $stmt->rowCount() > 0;
    }

    public function updatePassword(string $newPassword): bool
    {
        if ($this->id === null) return false;

        $db = Database::pdo();
        $stmt = $db->prepare("UPDATE users SET password = ? WHERE id = ?");
        $stmt->execute([
            password_hash($newPassword, PASSWORD_BCRYPT),
            $this->id,
        ]);

        return $stmt->rowCount() > 0;
    }

    public function setResetToken(string $token): bool
    {
        if ($this->id === null) return false;

        $db = Database::pdo();
        $stmt = $db->prepare("
            UPDATE users
            SET reset_token = ?, reset_expires = DATE_ADD(NOW(), INTERVAL 1 HOUR)
            WHERE id = ?
        ");
        $stmt->execute([$token, $this->id]);

        return $stmt->rowCount() > 0;
    }

    public function clearResetToken(): bool
    {
        if ($this->id === null) return false;

        $db = Database::pdo();
        $stmt = $db->prepare("
            UPDATE users
            SET reset_token = NULL, reset_expires = NULL
            WHERE id = ?
        ");
        $stmt->execute([$this->id]);

        return $stmt->rowCount() > 0;
    }

    public function verifyPassword(string $password): bool
    {
        return password_verify($password, $this->password);
    }

    public function isVerified(): bool
    {
        return $this->email_verified_at !== null;
    }

    public function toArray(): array
    {
        return [
            'id'                => $this->id,
            'name'              => $this->name,
            'email'             => $this->email,
            'email_verified_at' => $this->email_verified_at,
            'created_at'        => $this->created_at,
        ];
    }

    private static function fromRow(array $row): self
    {
        $user = new self();
        $user->id                 = (int) $row['id'];
        $user->name               = $row['name'];
        $user->email              = $row['email'];
        $user->password           = $row['password'];
        $user->email_verified_at  = $row['email_verified_at'];
        $user->verification_token = $row['verification_token'];
        $user->reset_token        = $row['reset_token'];
        $user->reset_expires      = $row['reset_expires'];
        $user->created_at         = $row['created_at'];
        $user->updated_at         = $row['updated_at'];
        return $user;
    }
}