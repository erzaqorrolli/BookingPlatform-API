<?php

declare(strict_types= 1);

namespace App\Models;


use App\Config\Database;

class Product{

public ?int $id = null; 
public int $company_id=0;
public string $name='';

public ?string $description = null;

public float $price = 0.0;
public int $stock =0;
public  ?string $image_url = null;
public int $active = 1;

public ?string $created_at=null;


public static function findById(int $id): ?self{

$db = Database :: pdo();
$stmt = $db->prepare("SELECT * FROM products WHERE id = ?");
$stmt->execute([$id]);
$row= $stmt->fetch();
return $row ? self::fromRow($row) : null;
}


public static function forCompany(int $companyId): array{
$db=Database::pdo();
$stmt = $db->prepare("SELECT * FROM products WHERE company_id = ? ORDER BY name");
$stmt->execute([$companyId]);

$rows = $stmt->fetchAll();
return array_map(fn(array $row): self => self::fromRow($row), $rows);

}

public function update (array $data): bool{
    if($this->id === null) return false;

    $db = Database::pdo();
    $fields = [];
    $values=[];

    foreach (['name', 'description', 'price', 'stock', 'image_url', 'active'] as $f) {
        if(array_key_exists($f, $data)){
            $fields[] = "$f = ?";
            $values[] = $data[$f];
        }
    }
    if(empty($fields)) return false;

    $values[] = $this->id;
    $sql = "UPDATE products SET " . implode(', ', $fields) . " WHERE id = ?";
    return $db->prepare($sql)->execute($values);

}
public function delete ():bool{

if($this->id === null) return false;

$db=Database::pdo();
return $db->prepare("DELETE FROM products WHERE id = ?")->execute([$this->id]);
}
public function toArray():array{
    return [
        'id' => $this->id,
        'company_id'=> $this->company_id,
        'name' => $this->name,
        'description'=> $this->description,
        'price'=> (float) $this->price,
        'stock' =>$this->stock,
        'image_url' => $this->image_url,
        'active'=> $this->active,
        'created_at'=> $this->created_at,
    ];
}

private static function fromRow(array $row): self{

$p =new self();
$p->id = (int) $row['id'];
$p->company_id = (int) $row['company_id'];
$p->name = (string) $row['name'];
$p->description = $row['description'] ?? null;
$p->price = (float) ($row['price'] ?? 0);
$p->stock= (int) $row['stock'];
$p->image_url = $row['image_url'] ?? null;
$p->active = (int) $row['active'] ;
$p->created_at =$row['created_at'] ?? null;

return $p;
}

}

