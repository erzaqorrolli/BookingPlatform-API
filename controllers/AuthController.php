<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Models\User;
use App\Utils\Mailer;

class AuthController
{
    public function register(): void
    {
        $input    = input();
        $name     = trim($input['name'] ?? '');
        $email    = trim(strtolower($input['email'] ?? ''));
        $password = $input['password'] ?? '';

        if ($name === '') json_err('Name is required', 422);
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) json_err('Email is not valid', 422);
        if (strlen($password) < 6) json_err('Password must be at least 6 characters', 422);

        if (User::findByEmail($email)) {
            json_err('Email already exists', 409);
        }

        $verificationToken = bin2hex(random_bytes(32));
        $user = User::create($name, $email, $password, $verificationToken);

        Mailer::sendVerification($email, $name, $verificationToken);

        json_ok([
            'message'     => 'Successfully registered. Please check your email to verify your account.',
            'user'        => $user->toArray(),
            'debug_token' => ($_ENV['APP_DEBUG'] ?? 'false') === 'true' ? $verificationToken : null,
        ], 201);
    }

    public function verify(): void
    {
        $input = input();
        $token = $input['token'] ?? '';

        if (!$token) json_err('Token is required', 422);

        $user = User::findByVerificationToken($token);
        if (!$user) json_err('Invalid or expired token', 400);

        $user->markEmailAsVerified();

        json_ok(['message' => 'Email verified successfully']);
    }
public function login(): void
{
    $input    = input();
    $email    = trim(strtolower($input['email'] ?? ''));
    $password = $input['password'] ?? '';

    if (!$email || !$password) json_err('Email and password required', 422);

    $user = User::findByEmail($email);
    if (!$user || !$user->verifyPassword($password)) {
        json_err('Invalid credentials', 401);
    }

    $token = jwt_encode([
        'uid' => $user->id,
        'exp' => time() + (int) $_ENV['JWT_EXPIRES'],
    ]);

    // Merr rolet në kompanitë ku user-i është anëtar
    $db = \App\Config\Database::pdo();
    $stmt = $db->prepare("
        SELECT c.id AS company_id, c.name AS company_name, r.name AS role
        FROM company_user cu
        JOIN companies c ON c.id = cu.company_id
        JOIN roles r ON r.id = cu.role_id
        WHERE cu.user_id = ?
    ");
    $stmt->execute([$user->id]);
    $companies = $stmt->fetchAll();

    json_ok([
        'token'     => $token,
        'user'      => $user->toArray(),
        'companies' => $companies,
    ]);
}

    public function forgotPassword(): void
    {
        $input = input();
        $email = trim(strtolower($input['email'] ?? ''));

        if (!$email) json_err('Email required', 422);

        $user = User::findByEmail($email);

        if (!$user) {
            json_ok(['message' => 'If email exists, you will receive a link']);
        }

        $token = bin2hex(random_bytes(32));
        $user->setResetToken($token);

        Mailer::sendPasswordReset($email, $user->name, $token);

        json_ok([
            'message'     => 'If email exists, you will receive a link',
            'debug_token' => ($_ENV['APP_DEBUG'] ?? 'false') === 'true' ? $token : null,
        ]);
    }

    public function resetPassword(): void
    {
        $input    = input();
        $token    = $input['token'] ?? '';
        $password = $input['password'] ?? '';

        if (!$token) json_err('Token required', 422);
        if (strlen($password) < 6) json_err('Password must have at least 6 characters', 422);

        $user = User::findByResetToken($token);
        if (!$user) json_err('Invalid or expired token', 400);

        $user->updatePassword($password);
        $user->clearResetToken();

        json_ok(['message' => 'Password reset successfully']);
    }
public function me(): void
{
    $uid = auth_user_id();
    if (!$uid) json_err('Unauthorized', 401);

    $user = User::findById($uid);
    if (!$user) json_err('User not found', 404);

    $db = \App\Config\Database::pdo();
    $stmt = $db->prepare("
        SELECT c.id AS company_id, r.name AS role
        FROM company_user cu
        JOIN companies c ON c.id = cu.company_id
        JOIN roles r ON r.id = cu.role_id
        WHERE cu.user_id = ?
    ");
    $stmt->execute([$uid]);
    $companies = $stmt->fetchAll();

    $data = $user->toArray();
    $data['companies'] = $companies;

    json_ok($data);
}

    public function changePassword(): void
    {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $input   = input();
        $current = $input['current_password'] ?? '';
        $new     = $input['new_password'] ?? '';

        if (strlen($new) < 6) json_err('New password must have at least 6 characters', 422);

        $user = User::findById($uid);
        if (!$user || !$user->verifyPassword($current)) {
            json_err('Current password is incorrect', 400);
        }

        $user->updatePassword($new);

        json_ok(['message' => 'Password changed successfully']);
    }

    public function logout(): void
    {
        json_ok(['message' => 'Logged out']);
    }

   public function registerBusiness(): void
{
    $input       = input();
    $name        = trim($input['name'] ?? '');
    $email       = trim(strtolower($input['email'] ?? ''));
    $password    = $input['password'] ?? '';
    $companyName = trim($input['company_name'] ?? '');

    if ($name === '') json_err('Name is required', 422);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) json_err('Email is not valid', 422);
    if (strlen($password) < 6) json_err('Password must be at least 6 characters', 422);
    if ($companyName === '') json_err('Company name is required', 422);

    if (User::findByEmail($email)) {
        json_err('Email already exists', 409);
    }

    $token = bin2hex(random_bytes(32));
    $user  = User::create($name, $email, $password, $token);

    $company = \App\Models\Company::createWithOwner($companyName, $user->id, $email);

    try {
        \App\Utils\Mailer::sendVerification($email, $name, $token);
    } catch (\Throwable $e) {}

    json_ok([
        'message'     => 'Company registered successfully',
        'user'        => $user->toArray(),
        'company'     => $company->toArray(),
        'user_type'   => 'business',
        'debug_token' => ($_ENV['APP_DEBUG'] ?? 'false') === 'true' ? $token : null,
    ], 201);
}

public function registerCustomer(): void
{
    $input    = input();
    $name     = trim($input['name'] ?? '');
    $email    = trim(strtolower($input['email'] ?? ''));
    $password = $input['password'] ?? '';

    if ($name === '') json_err('Name is required', 422);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) json_err('Email is not valid', 422);
    if (strlen($password) < 6) json_err('Password must be at least 6 characters', 422);

    if (User::findByEmail($email)) {
        json_err('Email already exists', 409);
    }

    $token = bin2hex(random_bytes(32));
    $user  = User::create($name, $email, $password, $token);

    try {
        \App\Utils\Mailer::sendVerification($email, $name, $token);
    } catch (\Throwable $e) {}

    json_ok([
        'message'     => 'Customer registered successfully',
        'user'        => $user->toArray(),
        'user_type'   => 'customer',
        'debug_token' => ($_ENV['APP_DEBUG'] ?? 'false') === 'true' ? $token : null,
    ], 201);
}

public function registerInvited(): void
{
    $input    = input();
    $token    = $input['token'] ?? '';
    $name     = trim($input['name'] ?? '');
    $password = $input['password'] ?? '';

    if (!$token) json_err('Token required', 422);
    if ($name === '') json_err('Name required', 422);
    if (strlen($password) < 6) json_err('Password min 6 characters', 422);

    $db = \App\Config\Database::pdo();

    $stmt = $db->prepare("
        SELECT ci.*, c.name AS company_name, r.name AS role_name
        FROM company_invitations ci
        JOIN companies c ON c.id = ci.company_id
        JOIN roles r ON r.id = ci.role_id
        WHERE ci.token = ? AND ci.accepted_at IS NULL AND ci.expires_at > NOW()
    ");
    $stmt->execute([$token]);
    $invite = $stmt->fetch();

    if (!$invite) json_err('Invalid or expired invitation', 400);

    if (User::findByEmail($invite['email'])) {
        json_err('Email already registered. Please login.', 409);
    }


    try {
        $verToken = bin2hex(random_bytes(32));
        $user = User::create($name, $invite['email'], $password, $verToken);

        $db->prepare("UPDATE users SET email_verified_at = NOW(), verification_token = NULL WHERE id = ?")
           ->execute([$user->id]);

        $db->prepare("INSERT INTO company_user (user_id, company_id, role_id) VALUES (?, ?, ?)")
           ->execute([$user->id, $invite['company_id'], $invite['role_id']]);

        $db->prepare("UPDATE company_invitations SET accepted_at = NOW() WHERE id = ?")
           ->execute([$invite['id']]);

        $db->commit();

        json_ok([
            'message' => 'U regjistrove me sukses!',
            'user'    => $user->toArray(),
            'company' => [
                'id'   => (int) $invite['company_id'],
                'name' => $invite['company_name'],
            ],
            'role'    => $invite['role_name'],
        ], 201);

    } catch (\Throwable $e) {
        $db->rollBack();
        throw $e;
    }
}
}