<?php

declare(strict_types=1);

namespace App\Models;

use App\Config\Database;

class Shift{

public ?int $id=null;
public int $company_id=0;
public string $name='';
public string $start_time='';
public string $end_time='';
public  string $color ='#6366f1';
public ?string $created_at=null;

public static function findById(int $id): ?self{

$db=Database::pdo();
$stmt=$db->prepare("SELECT * FROM shifts WHERE id=?");
$stmt->execute([$id]);
$row=$stmt->fetch();
return $row ? self::fromRow($row) : null;
}

public static function forCompany(int $companyId): array{
    $db=Database::pdo();
    $stmt=$db->prepare("SELECT * FROM shifts WHERE company_id=? ORDER BY start_time");
    $stmt->execute([$companyId]);
    return array_map(fn($r) => self::fromRow($r), $stmt->fetchAll());

}

public static function create(int $companyId,array $data): self{
    $db=Database::pdo();
    $stmt=$db->prepare("INSERT INTO shifts (company_id,name,start_time,end_time,color) VALUES(?,?,?,?,?)");

    $stmt->execute([$companyId, trim($data['name']),
    $data['start_time'],
    $data['end_time'],
    $data['color'] ?? '6366f1',
    ]);
    return self:: findById((int) $db->lastInsertId());
}

public function update (array $data): bool{
    if($this->id === null) return false;
    $db=Database::pdo();
    $fields=[];
    $values=[];

    foreach(['name', 'start_time', 'end_time', 'color'] as $f){
        if(array_key_exists($f,$data)){
            $fields[]="$f=?";
            $values[]=$data[$f];
        }
    }

    if(empty($fields)) return false;

    $values[]=$this->id;
    $sql="UPDATE shifts SET " . implode (', ', $fields) . " WHERE id=?";
    return $db->prepare($sql)->execute($values);

}
public function delete(): bool{
    if($this->id === null) return false;

    return Database::pdo()
    ->prepare("DELETE FROM shifts WHERE id=?")
    ->execute([$this->id]);
}
public function toArray(): array{
    return [
        'id' => $this->id,
        'company_id'=> $this->company_id,
        'name'=> $this->name,
        'start_time'=> $this->start_time,
        'end_time'=> $this->end_time,
        'color' => $this->color,
        'created_at' => $this->created_at,
    ];
}

private static function fromRow(array $row): self{
     $s = new self();
        $s->id         = (int) $row['id'];
        $s->company_id = (int) $row['company_id'];
        $s->name       = $row['name'];
        $s->start_time = $row['start_time'];
        $s->end_time   = $row['end_time'];
        $s->color      = $row['color'] ?? '#6366f1';
        $s->created_at = $row['created_at'] ?? null;
        return $s;
}

}