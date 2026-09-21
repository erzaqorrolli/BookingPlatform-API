<?php
declare(strict_types=1);

use App\Config\Router;
use App\Controllers\AuthController;
use App\Controllers\CompanyController;
use App\Controllers\ServiceController;
use App\Controllers\BookingController;
use App\Controllers\WorkingHoursController;
use App\Controllers\DiscountController;
use App\Controllers\HolidayController;
use App\Controllers\CustomerPortalController;
use App\Controllers\CustomerController;
use App\Controllers\HappyHourController;

Router::post('/api/auth/register',        [AuthController::class, 'register']);
Router::post('/api/auth/login',           [AuthController::class, 'login']);
Router::post('/api/auth/verify',          [AuthController::class, 'verify']);
Router::post('/api/auth/forgot',          [AuthController::class, 'forgotPassword']);
Router::post('/api/auth/reset',           [AuthController::class, 'resetPassword']);
Router::get('/api/auth/me',               [AuthController::class, 'me']);
Router::post('/api/auth/change-password', [AuthController::class, 'changePassword']);
Router::post('/api/auth/logout',          [AuthController::class, 'logout']);

Router::get('/api/companies/{id}/members', [CompanyController::class, 'members']);
Router::post('/api/companies/{id}/invite', [CompanyController::class, 'invite']);


Router::get('/api/companies/{companyId}/holidays',         [HolidayController::class, 'index']);
Router::post('/api/companies/{companyId}/holidays',        [HolidayController::class, 'store']);
Router::delete('/api/companies/{companyId}/holidays/{id}', [HolidayController::class, 'destroy']);

Router::get('/api/companies',                    [CompanyController::class, 'index']);
Router::post('/api/companies',                   [CompanyController::class, 'store']);
Router::get('/api/companies/{id}',               [CompanyController::class, 'show']);
Router::put('/api/companies/{id}',               [CompanyController::class, 'update']);
Router::post('/api/companies/{id}/invite',       [CompanyController::class, 'invite']);
Router::get('/api/companies/{id}/members',       [CompanyController::class, 'members']);
Router::post('/api/invitations/accept',          [CompanyController::class, 'acceptInvite']);

Router::get('/api/companies/{companyId}/discounts',         [DiscountController::class, 'index']);
Router::post('/api/companies/{companyId}/discounts',        [DiscountController::class, 'store']);
Router::delete('/api/companies/{companyId}/discounts/{id}', [DiscountController::class, 'destroy']);

Router::get('/api/companies/{companyId}/services',        [ServiceController::class, 'index']);
Router::post('/api/companies/{companyId}/services',       [ServiceController::class, 'store']);
Router::get('/api/companies/{companyId}/services/{id}',   [ServiceController::class, 'show']);
Router::put('/api/companies/{companyId}/services/{id}',   [ServiceController::class, 'update']);
Router::delete('/api/companies/{companyId}/services/{id}',[ServiceController::class, 'destroy']);

Router::get('/api/companies/{companyId}/bookings',                [BookingController::class, 'index']);
Router::put('/api/companies/{companyId}/bookings/{id}/status',    [BookingController::class, 'updateStatus']);

Router::get('/api/companies/{companyId}/working-hours',       [WorkingHoursController::class, 'index']);
Router::put('/api/companies/{companyId}/working-hours/{day}',  [WorkingHoursController::class, 'update']);

Router::get('/api/public/companies',       [BookingController::class, 'publicCompanies']);
Router::get('/api/public/availability',    [BookingController::class, 'availability']);
Router::post('/api/public/bookings',       [BookingController::class, 'createPublic']);

Router::get('/api/public/companies/{slug}', [BookingController::class, 'publicCompanyBySlug']);
Router::get('/api/me/bookings', [CustomerPortalController::class, 'myBookings']);

Router::get('/api/companies/{companyId}/happy-hours',         [HappyHourController::class, 'index']);
Router::post('/api/companies/{companyId}/happy-hours',        [HappyHourController::class, 'store']);
Router::put('/api/companies/{companyId}/happy-hours/{id}',    [HappyHourController::class, 'update']);
Router::delete('/api/companies/{companyId}/happy-hours/{id}', [HappyHourController::class, 'destroy']);

Router::get('/api/companies/{companyId}/customers',         [CustomerController::class, 'index']);
Router::post('/api/companies/{companyId}/customers',        [CustomerController::class, 'store']);
Router::put('/api/companies/{companyId}/customers/{id}',    [CustomerController::class, 'update']);
Router::delete('/api/companies/{companyId}/customers/{id}', [CustomerController::class, 'destroy']);
Router::post('/api/debug', function () {
    return [
        'input_result'   => input(),
        'raw_input'      => file_get_contents('php://input'),
        'post_array'     => $_POST,
        'content_type'   => $_SERVER['CONTENT_TYPE'] ?? null,
        'content_length' => $_SERVER['CONTENT_LENGTH'] ?? null,
    ];
});