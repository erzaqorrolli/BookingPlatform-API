<?php

declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

    use Dotenv\Dotenv;

    $dotenv = Dotenv::createImmutable(__DIR__ . '/../');
    $dotenv->load();

    $name = $ENV['SUPERADMIN_NAME'] ?? 'Superadmin';
    $email = $ENV['SUPERADMIN_EMAIL'] ?? '';
    $password = $ENV['SUPERADMIN_PASSWORD'] ?? '';

    if($email === '' || $password ===''){
        echo("SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD must be set in the .env file.\n");
        exit(1);
    }

    $db = new PDO(
       'mysql:host=' . $_ENV['DB_HOST'] . ';posrt=' . $_ENV['DB_PORT'] . ';dbname=' . $_ENV['DB_NAME'] . ';charset=utf8mb4',
       $_ENV['DB_USER'],
       $_ENV['DB_PASS'],
       [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );


    try{

    $db->beginTransaction();

    $stmt = $db->prepare("SELECT id FROM roles WHERE name= 'superadmin' .LIMIT . 1");
    $stmt->execute();
    $roleId = $stmt->fetchColumn();

    if(!$roleId){

    $db->prepare("INSERT INTO roles (name, created_at) VALUES (?,NOW())")
    ->execute(['superadmin']);
    $roleId = (int) $db->lastInsertId();

    echo("Role 'superadmin' created (ID: $roleId).\n");
    } else {
        echo("Role 'superadmin' already exists (ID: $roleId).\n");
    }



    $stmt = $db->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    $userId = $stmt->fetchColumn();

    if(!$userId){
        $passwordHash = password_hash($password, PASSWORD_BCRYPT);
        $db->prepare("INSERT INTO users(name,email,password_hash, email_verified_at, created_at)
        VALUES(?,?,?,NOW(),NOW())")->execute([$name,$email,$passwordHash]);
        $userId =(int) $db->lastInsertId();
        echo("User created (ID: $userId).\n");
    }else{
        echo("User with email '$email' already exists (ID: $userId).\n");
        $passwordHash = password_hash($password, PASSWORD_BCRYPT);
        $db->prepare("UPDATE users SET password_hash = ? WHERE id = ?")
           ->execute([$passwordHash, $userId]);
           echo("Password for user with email '$email' has been updated.\n");
    }

    $stmt = $db->prepare("SELECT id FROM companies WHERE slug = 'platform-admin' LIMIT 1");
    $stmt->execute();
    $companyId = $stmt->fetchColumn();

    if(!$companyId){
        $db->prepare("INSERT INTO companies (name,slug,email,created_at) VALUES (?,?,?,NOW())")->execute(['Platform Admin','platform-admin',$email]);
        $companyId = (int) $db->lastInsertId();
        echo("Company 'Platform Admin' created (ID: $companyId).\n");
    }else{
        echo("Company 'Platform Admin' already exists (ID: $companyId).\n");
    }

    $stmt = $db->prepare("SELECT 1 FROM company_user WHERE user_id = ? AND company_id = ? AND role_id = ? LIMIT 1");
    $stmt->execute([$userId, $companyId, $roleId]);

    if(!$stmt->fetchColumn()){
        $db->prepare("INSERT INTO company_user(user_id, company_id,role_id,creeated_at) VALUES(?,?,?,NOW())")->execute([$userId,$companyId,$roleId]);
        echo("Role 'superadmin' assigned to user (ID: $userId) for company 'Platform Admin' (ID: $companyId).\n");
    }else{  
        echo("Role 'superadmin' is already assigned to user (ID: $userId) for company 'Platform Admin' (ID: $companyId).\n");
        }

        $db->commit();
    }
    catch(\Throwable $e){
       if($db->inTransaction()){
              $db->rollBack();
       }

       echo("Error: " . $e->getMessage() . "\n");
       exit(1);
    }