<?php

declare(strict_types= 1);

namespace App\Models;

use App\Config\Database;

class Customer{

public ?int $id = null;

public ?int $company_id= 0;

public string $name='';

public string $email= '';

public ?string $phone= null;
public ?string $created_at=null;

public int $is_vip = 0;

public int $total_bookings=0;


public static function findById(int $id): ?self{
    $db=Database::pdo();
    $stmt = $db->prepare("SELECT * FROM customers WHERE id=?");
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    return $row ? self::fromRow($row) : null;
}

public static function findByEmail(int $companyId, string $email): ?self{
$db=Database::pdo();
$stmt=$db->prepare("SELECT * FROM customers WHERE company_id=? AND email=?");
$stmt->execute([$companyId, strtolower(trim($email))]);
$row=$stmt->fetch();

return $row ? self::fromRow($row): null;

}

public static function forCompany (int $companyId) : array{
    $db=Database::pdo();
    $stmt = $db->prepare("SELECT * FROM customers WHERE company_id=? ORDER BY created_at DESC");

    $stmt->execute([$companyId]);
    return array_map(fn($r) => self::fromRow ($r), $stmt->fetchAll());
}

public static function findOrCreate(

int $companyId,
string $name,
string $email,
?string $phone = null

): self{
    $existing= self::findByEmail($companyId, $email);
    if($existing) return $existing;

    $db=Database::pdo();
    $stmt=$db->prepare("INSERT INTO customers (company_id, name, email, phone)
    VALUES (?,?,?,?)");
    $stmt->execute([$companyId, trim($name), strtolower(trim($email)), $phone]);
    return self::findById((int) $db->lastInsertId());
}

public  function  update (array $data): bool{
    if($this->id ===null) return false;

    $db=Database::pdo();
    $fields=[];
    $values=[];

    foreach(['name', 'email','phone'] as $f){
        if(array_key_exists($f, $data)){
            $fields[]="$f =?";
            $values[]= $data[$f];
        }
    }

    if(empty($fields)) return false;
    $values[]=$this->id;
    $sql="UPDATE customers SET" . implode(',', $fields) . "WHERE id=?";
    return $db->prepare($sql)->execute($values);
}

public function delete():bool{
    if($this->id===null) return false;

    return Database::pdo()
    ->prepare("DELTE FROM customers WHERE id=?")
    ->execute([$this->id]);
}

public function toArray(): array{
    return [
        'id' => $this->id,
        'company_id' => $this->company_id,
        'name' => $this->name,
        'email' => $this->email,
        'phone'=> $this->phone,
        'created_at'=> $this->created_at,
        'is_vip' => $this->is_vip,
        'total_bookings'=>$this->total_bookings,
    ];
}

 private static function fromRow(array $row): self
    {
        $c = new self();
        $c->id         = (int) $row['id'];
        $c->company_id = (int) $row['company_id'];
        $c->name       = $row['name'];
        $c->email      = $row['email'];
        $c->phone      = $row['phone'] ?? null;
        $c->created_at = $row['created_at'] ?? null;
        $c->is_vip=  (int) ($row['is_vip'] ?? 0);
        $c-> total_bookings =(int)($row['total_bookings'] ?? 0); 
        return $c;
    }

    public static function updateVipStatus(int $customerId): void{
        $db=Database::pdo();

        $stmt=$db->prepare("SELECT COUNT (*) FROM bookings WHERE customer_id ? AND status IN ('confirmed', 'completed') ");
        $stmt->execute([$customerId]);
        $count = (int) $stmt->fetchColumn();


        $isVip = $count >= 30 ? 1:0;

        $db->prepare("UPDATE customers SET total_bookings = ?, is_vip = ? WHERE id=?")->execute([$count,$isVip,$customerId]);


    }

}