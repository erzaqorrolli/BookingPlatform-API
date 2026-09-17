<?php

declare (strict_types= 1);  

namespace App\Models;

use App\Config\Database;

class Company{
public int $id=null;
public string $name='';
public string $slug='';
public ?string $email=null;
public ?string $phone=null;
public ?string $address=null;

public ?string $logo_url=null;

public ?string $timezone=null;

public ?string $created_at=null;

public static function findById(int $id): ?self{

$db=Database::pdo();
$stmt= $db->prepare("SELECT * FROM companies WHERE id = ?");
$stmt->execute([$id]);
$row=$stmt->fetch();
return $row ? self::fromRow($row):null;

}
public static function findBySlug(string $slug): ?self{
$db=Database::pdo();
$stmt= $db->prepare("SELECT * FROM companies WHERE slug = ?");
$stmt->execute([$slug]);
$row=$stmt->fetch();
return $row ? self::fromRow($row):null;
}


public static function createWithOwner(
    string $name,
    int $ownerId,
    ?string $email=null,
    ?string $phone=null,
    ?string $address=null,

):self{
    $db=Database::pdo();
    $db->beginTransaction();

    try {
        $baseSlug=slugify($name);
        $slug=$baseSlug . '-' . substr(bin2hex(random_bytes(3)),0,6);

        $stmt=$db->prepare("INSERT INTO companies (name, slug, email, phone, address) VALUES (?,?,?,?,?)");
        $stmt->execute([$name, $slug, $email, $phone, $address, $baseSlug]);
        $companyId= (int) $db->lastInsertId();

        $roleId= (int) $db->query("SELECT id FROM roles WHERE name='owner'")->fetchColumn();
        $stmt=$db->prepare("INSERT INTO company_user (user_id, company_id,role_id) VALUES (?,?,?)");

        $stmt->execute([$ownerId,$companyId,$roleId]);

        for($d = 1; $d<=6; $d++){
            $stmt=$db->prepare("INSERT INTO working_hours (company_id,day_of_week, open_time, close_time)
            VALUES (?,?,?,?)");
            $stmt->execute([ $companyId, $d, '09:00:00', '17:00:00']);
        }
        $db->commit();
        return self::findById($companyId);
    } catch (\Throwable $e) {
        $db->rollBack();
        throw $e;
        }

}

public  static function forUser (int $userId): array{
$db=Database::pdo();
$stmt=$db->prepare(
    "SELECT c.id, c.name, c.slug, c.email, c.phone, c.address, c.logo_url, c.timezone, c.created_at
    FROM company_user cu
    JOIN companies c ON cu.company_id = c.id
    WHERE cu.user_id = ?
    ORDER BY c.name
    ");
$stmt->execute([$userId]);
return $stmt->fetchAll();
}

public static function userBelongsTo(int $userId, int $companyId):bool{
    $db=Database::pdo();
    $stmt=$db->prepare("SELECT 1 FROM company_user WHERE user_id = ? AND company_id = ?");
    $stmt->execute([$userId, $companyId]);
    return (bool) $stmt->fetch();
    }

    public static function userRole(int $userId, int $companyId): ?string{
        $db=Database::pdo();
        $stmt=$db->prepare(
            "SELECT r.name
            FROM company_user cu
            JOIN roles r ON r.id = cu.role_id
            WHERE cu.user_id = ? AND cu.company_id = ?");
        $stmt->execute([$userId, $companyId]);
        $result=$stmt->fetchColumn();
        return $result ?: null;
    }

    public function toArray(): array{
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'email' => $this->email,
            'phone' => $this->phone,
            'address' => $this->address,
            'logo_url' => $this->logo_url,
            'timezone' => $this->timezone,
            'created_at' => $this->created_at
        ];
    }
    private static function fromRow(array $row): self{
    $c = new self();
    $c->name = $row['name'];
    $c->slug = $row['slug'];
    $c->email = $row['email'] ?? null;
    $c->phone = $row['phone'] ?? null;
    $c->address = $row['address'] ?? null;
    $c->logo_url = $row['logo_url'] ?? null;
    $c->timezone = $row['timezone'] ?? 'Europe/Berlin';
    $c->created_at = $row['created_at'] ?? null;    

    }
}