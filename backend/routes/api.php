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
use App\Controllers\ShiftController;
use App\Controllers\UserShiftController;
use App\Controllers\ProductController;
use App\Controllers\PhotoController;
use App\Controllers\ReviewController;
use App\Controllers\InvoiceController;
use App\Controllers\ContactController;
use App\Controllers\SuperAdminController;
use App\Controllers\GoogleCalendarController;


Router::get('/api/health', function() {
    return [
        'status' => 'ok',
        'time'   => date('c'),
        'php'    => PHP_VERSION,
    ];
});

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
Router::get('/api/companies/{companyId}/payroll/me', [CompanyController::class, 'myPayroll']);
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
// SHIFTS
Router::get('/api/companies/{companyId}/shifts',         [ShiftController::class, 'index']);
Router::post('/api/companies/{companyId}/shifts',        [ShiftController::class, 'store']);
Router::put('/api/companies/{companyId}/shifts/{id}',    [ShiftController::class, 'update']);
Router::delete('/api/companies/{companyId}/shifts/{id}', [ShiftController::class, 'destroy']);

Router::get('/api/companies/{companyId}/schedule',         [UserShiftController::class, 'index']);
Router::get('/api/companies/{companyId}/schedule/me',      [UserShiftController::class, 'mySchedule']);
Router::post('/api/companies/{companyId}/schedule',        [UserShiftController::class, 'store']);
Router::put('/api/companies/{companyId}/schedule/{id}',    [UserShiftController::class, 'update']);
Router::delete('/api/companies/{companyId}/schedule/{id}', [UserShiftController::class, 'destroy']);

Router::get('/api/companies/{companyId}/products',         [ProductController::class, 'index']);
Router::post('/api/companies/{companyId}/products',        [ProductController::class, 'store']);
Router::get('/api/companies/{companyId}/products/{id}',    [ProductController::class, 'show']);
Router::put('/api/companies/{companyId}/products/{id}',    [ProductController::class, 'update']);
Router::delete('/api/companies/{companyId}/products/{id}', [ProductController::class, 'destroy']);


// PHOTOS
Router::get('/api/companies/{companyId}/photos',          [PhotoController::class, 'index']);
Router::post('/api/companies/{companyId}/photos',         [PhotoController::class, 'upload']);
Router::put('/api/companies/{companyId}/photos/{id}/cover', [PhotoController::class, 'setCover']);
Router::delete('/api/companies/{companyId}/photos/{id}',  [PhotoController::class, 'destroy']);


Router::post('/api/auth/register-business', [AuthController::class, 'registerBusiness']);
Router::post('/api/auth/register-customer', [AuthController::class, 'registerCustomer']);
Router::post('/api/auth/register-invited',  [AuthController::class, 'registerInvited']);

Router::get('/api/invitations/{token}', [CompanyController::class, 'getInvitation']);


Router::post('/api/auth/register-business', [AuthController::class, 'registerBusiness']);
Router::post('/api/auth/register-customer', [AuthController::class, 'registerCustomer']);
Router::post('/api/auth/register-invited',  [AuthController::class, 'registerInvited']);
Router::get('/api/invitations/{token}',     [CompanyController::class, 'getInvitation']);

Router::get('/api/companies/{companyId}/reviews',    [ReviewController::class, 'index']);
Router::get('/api/me/reviews',                        [ReviewController::class, 'myReviews']);
Router::get('/api/me/bookings-to-review',             [ReviewController::class, 'bookingsToReview']);
Router::post('/api/me/reviews',                       [ReviewController::class, 'store']);
Router::delete('/api/me/reviews/{id}',                [ReviewController::class, 'destroy']);

Router::get('/api/companies/{companyId}/invoices', [InvoiceController::class, 'index']);
Router::get('/api/companies/{companyId}/invoices/{id}', [InvoiceController::class, 'show']);
Router::post('/api/companies/{companyId}/invoices', [InvoiceController::class, 'store']);
Router::post('/api/companies/{companyId}/bookings/{bookingId}/invoice', [InvoiceController::class, 'createFromBooking']);
Router::put('/api/companies/{companyId}/invoices/{id}/status', [InvoiceController::class, 'updateStatus']);
Router::delete('/api/companies/{companyId}/invoices/{id}', [InvoiceController::class, 'destroy']);

Router::get('/api/companies/{companyId}/customers/{id}', [CustomerController::class, 'show']);

Router::post('/api/contact', [ContactController::class, 'store']);

Router::get('/api/admin/contact-messages', [ContactController::class, 'index']);
Router::get('/api/admin/contact-messages/{id}', [ContactController::class, 'show']);
Router::put('/api/admin/contact-messages/{id}', [ContactController::class, 'update']);
Router::delete('/api/admin/contact-messages/{id}', [ContactController::class, 'destroy']);

Router::get('/api/companies/{companyId}/calendar-events', [BookingController::class, 'calendarEvents']);

Router::get('/api/superadmin/stats',            [SuperAdminController::class, 'stats']);
Router::get('/api/superadmin/companies',        [SuperAdminController::class, 'companies']);
Router::get('/api/superadmin/users',            [SuperAdminController::class, 'users']);
Router::get('/api/superadmin/recent-bookings',  [SuperAdminController::class, 'recentBookings']);
Router::get('/api/superadmin/monthly-revenue',  [SuperAdminController::class, 'monthlyRevenue']);
Router::get('/api/superadmin/top-companies',    [SuperAdminController::class, 'topCompanies']);
Router::get('/api/superadmin/bookings-chart',   [SuperAdminController::class, 'bookingsChart']);

Router::get('/api/superadmin/companies/{id}',         [SuperAdminController::class, 'companyDetail']);
Router::put('/api/superadmin/companies/{id}/status',  [SuperAdminController::class, 'toggleCompanyStatus']);
Router::delete('/api/superadmin/companies/{id}',      [SuperAdminController::class, 'deleteCompany']);

Router::get('/api/superadmin/users',                [SuperAdminController::class, 'allUsers']);
Router::get('/api/superadmin/users/{id}',           [SuperAdminController::class, 'userDetail']);
Router::put('/api/superadmin/users/{id}/status',    [SuperAdminController::class, 'toggleUserStatus']);
Router::delete('/api/superadmin/users/{id}',        [SuperAdminController::class, 'deleteUser']);

Router::get('/api/superadmin/bookings',             [SuperAdminController::class, 'allBookings']);

Router::get('/api/superadmin/reports',              [SuperAdminController::class, 'monthlyReport']);

Router::get('/api/superadmin/contact-messages',     [SuperAdminController::class, 'contactMessages']);
Router::put('/api/superadmin/contact-messages/{id}/read', [SuperAdminController::class, 'markMessageRead']);
Router::delete('/api/superadmin/contact-messages/{id}',   [SuperAdminController::class, 'deleteMessage']);

Router::get('/api/google/connect', [GoogleCalendarController::class,'connect']);
Router::get('/api/google/callback', [GoogleCalendarController::class, 'callback']);
Router::get('/api/google/status', [GoogleCalendarController::class, 'status']);
Router::post('/api/google/disconnect', [GoogleCalendarController::class, 'disconnect']);
Router::get('/api/me/holidays', [HolidayController::class, 'myHolidays']);

Router::get('/api/public/invoices/{token}', [InvoiceController::class, 'publicView']);
Router::post('/api/public/invoices/{token}/mark-paid', [InvoiceController::class, 'publicMarkPaid']);