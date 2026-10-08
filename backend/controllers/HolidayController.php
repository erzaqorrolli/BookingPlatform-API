<?php

declare(strict_types= 1);

namespace App\Controllers;

use App\Models\Company; 
use App\Config\Database;
use App\Models\Holiday;

class HolidayController{

public static function index(array $params):void{
    $uid = auth_user_id();
    if(!$uid) json_err('Unauthorized',401);
    $companyId = (int) $params['companyId'];

    if(!Company::userBelongsTo($uid,$companyId)){
        json_err('Forbidden',403);
    }

    json_ok(Holiday::forCompany($companyId));
}

public function store(array $params): void
{
    $uid = auth_user_id();
    if(!$uid) json_err('Unauthorized',401);

    $companyId = (int) $params['companyId'];

    $role = Company::userRole($uid,$companyId);
    if(!in_array($role,['owner', 'admin','manager'])){
        json_err('Forbidden',403);
    }

    $input = input();
    if(empty($input['date'])) json_err('Date is required',422);
    if(empty($input['name'])) json_err('Name is required', 422);
    $id= Holiday::create($companyId,$input);

    json_ok(['message' =>'Holiday created', 'id' => $id], 201);
}
public function destroy (array $params): void{
    $uid = auth_user_id();
    if(!$uid) json_err('Unauthorized',401);

    $companyId = (int) $params['companyId'];
    $id = (int) $params['id'];

    $role = Company::userRole($uid,$companyId); 
    if(!in_array($role, ['owner', 'admin'])){
        json_err('Forbidden',403);
    }

    $holiday = new Holiday();
    $holiday->delete($companyId, $id);

    json_ok(['message'=> 'Holiday deleted']);
}

public function myHolidays(): void 
{
    $uid = auth_user_id();
    if (!$uid) json_err('Unauthorized', 401);

    $companyId = (int) ($_GET['company_id'] ?? 0);
    if (!$companyId) json_err('Company ID required', 422);

    if (!Company::userBelongsTo($uid, $companyId)) {
        json_err('Forbidden', 403);
    }

    $db = Database::pdo();
    $stmt = $db->prepare("
        SELECT id, name, date
        FROM holidays
        WHERE company_id = ? AND date >= CURDATE()
        ORDER BY date ASC
    ");
    $stmt->execute([$companyId]);
    $holidays = $stmt->fetchAll();

    $today = new \DateTime();          
    $today->setTime(0, 0, 0);

    foreach ($holidays as &$h) {
        $date = new \DateTime($h['date']);
        $date->setTime(0, 0, 0);
        $diff = $today->diff($date);
        $daysLeft = (int) $diff->format('%r%a');

        $h['days_left'] = $daysLeft;
        $h['is_today'] = ($daysLeft === 0);
        $h['is_tomorrow'] = ($daysLeft === 1);
        $h['is_past'] = ($daysLeft < 0);
    }

    json_ok($holidays);
}
}