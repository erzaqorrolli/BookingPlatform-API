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

        json_ok([
            'token' => $token,
            'user'  => $user->toArray(),
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

        json_ok($user->toArray());
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
}