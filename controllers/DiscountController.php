<?php

declare(strict_types= 1);

namespace App\Controllers;

use App\Models\Discount; 
use App\Models\Database;

class DiscountController{

public function index(array $params):void{

$uid = auth_user_id();

if(!$uid)json_err('Unauthorized',401);

$companyId=(int) $params['companyId'];
if(!Company::userBelongsTo($uid,$companyId))json_err('Forbidden',403);

$discounts= Discount::forCompany($companyId);
json_ok(array_map(fn($d)=> $d->toArray(),$discounts));
}

public function store (array $params): void{
    $uid=auth_user_id();
    if(!$uid)json_err('Unauthorized',401);

    $companyId=(int) $params['companyId'];

    $role =Company::userRole($uid,$companyId);

    if(!in_array($role,['owner','admin','manager'])){
        json_err('Forbidden',403);
    }

    $input = input();
    if(empty($input['code'])) json_err('Code is reuqired',422);
    if(!isset($input['value'])) json_err('Value is required',422);

    $discount=Discount::create($companyId,$input);

    json_ok([
        'message' =>'Discount created',
        'discount' => $discount->toArray(),
    ],201);
}

public function destroy (array $params):void{
    $uid=auth_user_id();

    if(!uid) json_err('Unauthorized',401);

    $companyId =(int) $params['companyId'];
    $id=(int)$params['id'];

    $role=Company::userRole($uid,$companyId);
    if(!in_array($role,['owner','admin'])){
        json_err('Forbidden',403);
}
$discount= Discount::findById($id);

if(!discount || $discount->company_id !== $companyId ){
    json_err('Discount not found',404);
}
$discount->delete();
json_ok(['message' => 'Discount deleted']);
}

}