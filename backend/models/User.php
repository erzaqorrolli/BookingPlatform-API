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
    public ?string $status = 'active';
    public ?string $blocked_at = null;
    public ?string $blocked_reason = null;

    public ?string $verification_token = null;
    public ?string $reset_token = null;
    public ?string $reset_expires = null;
    public ?string $created_at = null;
    public ?string $updated_at = null;

    // constructor is a special method that is called automaticlly when an object is cretaing
    //in this case , class doesn't use a constructor because class uses variables with default values
    // values are self initialized, thats why we dont need to use construct to initalize variables everytime an object is created
    public static function findById(int $id): ?self // method findById, accepts as a parameter id as an integer, and 
   //returns actual type of class, but '?' tells that it can be null
    {
        $db = Database::pdo();
        $stmt = $db->prepare("SELECT * FROM users WHERE id = ?");//prepare is used when we want to avoid sql injection , while also using ?, so that hackers will not have space to get code
        $stmt->execute([$id]);// executes statement and sends id in placeholder
        $row = $stmt->fetch(); // fetches everything from row

        return $row ? self::fromRow($row) : null; 
    } 

    public static function findByEmail(string $email): ?self 
    {
        $db = Database::pdo();
        $stmt = $db->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([strtolower(trim($email))]);
        $row = $stmt->fetch();

        return $row ? self::fromRow($row) : null; // if row has values, return it and convert in User(class) object, if not return null
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
        $db = Database::pdo();// database is using static method pdo from Database
        $stmt = $db->prepare("
            INSERT INTO users (name, email, password, verification_token)
            VALUES (?, ?, ?, ?)
        "); // we use ???? in VALUES because we don't know the values that user will type into
        $stmt->execute([ // we use trim to remove spaces around 
            trim($name),
            strtolower(trim($email)),
            password_hash($password, PASSWORD_BCRYPT),
            $verificationToken,
        ]);

        return self::findById((int) $db->lastInsertId());
    }

    public function markEmailAsVerified(): bool // doesn't accept parameter, returns boolean
    {
        if ($this->id === null) return false; // if id is null return false

        $db = Database::pdo(); // using method pdo from Database class
        $stmt = $db->prepare("
            UPDATE users
            SET email_verified_at = NOW(), verification_token = NULL
            WHERE id = ?
        ");
        $stmt->execute([$this->id]);

        return $stmt->rowCount() > 0; // rowCount, counts how many rows have changed, if changes are > 0 , then return true or false
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

    public function isBlocked(): bool{
        return $this->status === 'blocked';
    }

    public function toArray(): array //converets object user in array, so that it can be returned like JSON in API
    {
        return [
            'id'                => $this->id,
            'name'              => $this->name,
            'email'             => $this->email,
            'email_verified_at' => $this->email_verified_at,
            'created_at'        => $this->created_at,
        ];
    }

    private static function fromRow(array $row): self // database returns array, but we ned objects so we can work with methods
    { //created null objects and it fills them with data from array
        $user = new self();
        $user->id                 = (int) $row['id'];
        $user->name               = $row['name'];
        $user->email              = $row['email'];
        $user->password           = $row['password'];
        $user->email_verified_at  = $row['email_verified_at'];
        $user->status             = $row['status'];
        $user->blocked_at         = $row['blocked_at'];
        $user->blocked_reason     = $row['blocked_reason'];
        $user->verification_token = $row['verification_token'];
        $user->reset_token        = $row['reset_token'];
        $user->reset_expires      = $row['reset_expires'];
        $user->created_at         = $row['created_at'];
        $user->updated_at         = $row['updated_at'];
        return $user;
    }
}