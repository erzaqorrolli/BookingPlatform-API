<?php

declare(strict_types= 1);

namespace App\Controllers;

use App\Models\Company; 
use App\Models\Database;
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

    Holiday::delete($companyId,$id);

    json_ok(['message'=> 'Holiday deleted']);
}
}