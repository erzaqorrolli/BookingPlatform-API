<?php

declare(strict_types= 1);

namespace App\Controllers;

use App\Models\Company; 
use App\Models\Database;

class CompanyController {

public function index(): void{
    $uid = auth_user_id();
    if(!$uid) json_err('Unauthorized', 401);

    $companies=Company:: forUser($uid);
    json_ok($companies);    
}


public static function store(): void{
    $uid =auth_user_id();
    if(!$uid) json_err('Unauthorized',401);
    $input =input();
    $name = trim($input['name']?? '');

    if($name === '') json_err('Company name is required', 422);
    if(strlen($name)<2) json_err('Company name must be at least 2 charachters',422);

    $company = Company::createdWithOwner(
        $name,
        $uid,
        $input['email'] ?? null,
        $input['phone'] ?? null,
        $input['address'] ?? null
    );

    json_ok(['message' => 'Company created successfully',
    'company' => $company->toArray(),
    ],201);
}
public function show (array $params): void{
    $uid= auth_user_id();
    if(!$uid) json_err('Unauthorized',401);

    $id=(int) $params['id'];

    if(!Company::userBelongsTo($uid,$id)) json_err('Forbidden',403);

    $company =Company::findById($id);
    if(!$company) json_err('Company not found', 404);

    $role = Company::userRoles($uid,$id);

    json_ok(
        [
        'company' => $company->toArray(),
        'user_role'=> $role,
    ]);

}
public function update(array $params): void{
    $uid= auth_user_id();
    if(!$uid) json_err('Unauthorized',401);
    $id=(int) $params['id'];

    if(!Company::userBelongsTo($uid,$id)){ json_err('Forbidden',403);

    }
    $input = input();
    $db=Database::pdo();

    $fields=[];
    $values=[];

    foreach(['name','email','phone','address','logo_url', 'timezone'] as $field){
        if(isset($input[$field])){
            $fields[]="$field=?";
            $values[]=$input[$field];
        }
    }

    if(empty($fields)){
        json_err('Nothing to update',422);

    }

    $values[]=$id;
    $sql = "UPDATE companies SET ".implode(', ',$fields)." WHERE id=?";
    $db->prepare($sql)->execute($values);

    $company = Company::findById($id);
     json_ok([
        'message' =>'Company updated',
        'company' => $company->toArray(),
     ]);
}

public function invite(array $params): void
{
    $uid = auth_user_id();

    if(!$uid) json_err('Unauthorized', 401);

    $companyId = (int) $params['id'];

    $role = Company::userRole($uid,$companyId);
    if(!in_array($role, ['owner','admin'])) json_err('Forbidden', 403);

    $input = input();
    $email=trim(strtolower($input['email'] ?? ''));
    $roleName= $input['role'] ?? 'staff';

    if(!filter_var($email, FILTER_VALIDATE_EMAIL)){
        json_err('Invalid email address', 422);
    }

    $db = Database::pdo();
    $stmt= $db->prepare("SELECT id FROM roles WHERE name = ?");
    $stmt->execute([$roleName]);
    $roleId = $stmt->fetchColumn();
    if(!$roleId) json_err("Invalid role",422);

    $token = bin2hex(random_bytes(24));
    $stmt = $db->prepare("
INSERT INTO company_invitations (company_id,email,role_id,token,expires_at)
VALUES (?,?,?,?, DATE_ADD(NOW(), INTERVAL 7 DAY))");
    $stmt->execute([$companyId, $email, $roleId, $token ]);

  $link = ($_ENV['FRONTEND_URL'] ?? 'http://localhost:5173') . "/accept-invite?token=$token";

        json_ok([
            'message' => 'Invitation sent',
            'invite_link' => ($_ENV['APP_DEBUG'] ?? 'false') === 'true' ? $link : null,
        ], 201);
    }

    public function acceptInvite(): void{
    $uid = auth_user_id();
    if(!$uid) json_err('Unauthorized', 401);

    $input = input();
    $token = $input['token'] ?? '';

    if(!$token) json_err('Token required',422);

    $db = Database::pdo();

    $stmt = $db->prepare("SELECT  * FROM company_invitations WHERE token = ? AND accepted_at IS NULL AND expires_at> NOW()");

    $stmt->execute([$token]);
    $invite = $stmt->fetch();

    if(!$invite) json_err('Invalid or expired invitation', 400);

    $stmt = $db->prepare("SELECT email FROM users WHERE id = ?");
    $stmt->execute([$uid]);
    $userEmail = $stmt->fetchColumn();

    if($userEmail !== $invite['email']){
        json_err('Invitation is for a different email',403);
    }
    $stmt = $db->prepare("INSERT IGNORE INTO company_user (user_id,company_id, role_id) VALUES (?,?,?)");
    $stmt->execute([$uid, $invite['company_id'], $invite['role_id']]);

    $stmt = $db->prepare("UPDATE company_invitations SET accepted_at = NOW() WHERE id = ?");
    $stmt->execute([$invite['id']]);

    json_ok(['message' => 'Invitation accepted']);
    }

    public function members(array $params): void{
        $uid = auth_user_id();
        if(!$uid) json_err('Unauthorized', 401);

        $companyId = (int) $params['id'];
        if(!Company::userBelongsTo($uid,$companyId)){
            json_err('Forbidden',403);
        }

        $db = Database::pdo();
        $stmt = $db->prepare("SELECT u.id, u.name, u.email,r.name AS role, cu.created_at
        FROM company_user cu
        JOIN users u ON u.id = cu.user_id
        JOIN roles r ON r.id = cu.role_id
        WHERE cu.company_id = ?
        ORDER BY r.name, u.name");
        $stmt->execute([$companyId]);

        json_ok($stmt->fetchAll());
    }
}
