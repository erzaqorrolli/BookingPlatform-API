<?php


declare(strict_types=1);

namespace App\Models;

use App\Config\Database;

class HappyHour{

public ?int $id=null;
public int $company_id=0;
public string $name='';
public int $day_of_week=0;
public string $start_time='';

public string $end_time='';
public int $discount_percent=0;

public int $active =1;
public ?string $created_at=null;


public static function findById(int $id): ?self{
    $db=Database::pdo();
    $stmt=$db->prepare("SELECT * FROM happy_hours WHERE id=?");
    $stmt->execute([$id]);
    $row=$stmt->fetch();
    return $row ? self:: fromRow($row) : null;
}

public static function forCompany(int $companyId): array{
    $db = Database::pdo();
    $stmt= $db->prepare("SELECT * FROM happy_hours WHERE company_id=? ORDER BY day_of_week, start_time");
    $stmt->execute([$companyId]);
    return array_map(fn($r)=> self::fromRow($r),$stmt->fetchAll());
}

public static function getActiveAt(int $companyId, string $date, string $time): ?self{
    $dow=(int) date('w', strtotime($date));

    $db=Database::pdo();
    $stmt=$db->prepare("SELECT * FROM happy_hours WHERE company_id=? AND day_of_week=? AND active=1 AND start_time <=? AND end_time > ? ORDER BY discount_percent DESC LIMIT 1");
    $stmt->execute([$companyId,$dow,$time,$time]);
    $row= $stmt->fetch();
    return $row ? self:: fromRow($row) : null;

}

public static function create (int $companyId, array $data): self{
    $db=Database::pdo();
    $stmt = $db->prepare("INSERT INTO happy_hours (company_id,name,day_of_week, start_time, end_time,discount_percent,active) VALUES (?,?,?,?,?,?,?)");
    $stmt->execute([$companyId, trim($data['name']),
    (int) $data['day_of_week'],
    $data['start_time'],
    $data['end_time'],
    (int) $data['discount_percent'],
    (int) ($data['active'] ?? 1),
    ]);
    return self::findById((int) $db->lastInsertId());
}
public function update(array $data): bool{

if($this->id ===null) return false;

$db=Database::pdo();
$fields=[];
$values=[];

foreach(['name', 'day_of_week','start_time', 'end_time','discount_percent','active'] as $f){
    if(array_key_exists($f,$data)){
        $fields[]="$f = ?";
        $values[] = $data[$f];
    }
}

if(empty($fields)) return false;

$values[]=$this->id;

$sql="UPDATE happy_hours SET " . implode(', ', $fields) . " WHERE id=?"; return $db->prepare($sql)->execute($values);
}

public function delete ():bool{
    if($this->id ===null) return false;
    return Database::pdo()
    ->prepare("DELETE FROM happy_hours WHERE id=?")
    ->execute([$this->id]);
}

public function toArray():array{
    return [
        'id' => $this->id,
        'company_id' => $this->company_id,
        'name'=> $this->name,
        'day_of_week' => $this->day_of_week,
        'start_time'=> $this->start_time,
        'end_time' => $this->end_time,
        'discount_percent' => $this->discount_percent,
        'active' =>$this->active,
        'created_at' => $this->created_at,
    ];
}

private static function fromRow(array $row): self{
    $h=new self();
    $h->id=(int) $row['id'];
    $h->company_id =(int) $row['company_id'];
    $h->name= $row['name'];
    $h->day_of_week=(int) $row['day_of_week'];
    $h->start_time = $row['start_time'];
    $h->end_time = $row['end_time'];
    $h->discount_percent = (int) $row['discount_percent'];
    $h->active = (int) $row['active'];
    $h->created_at = $row['created_at']?? null;
    return $h;
}}