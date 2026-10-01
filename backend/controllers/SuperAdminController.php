<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Config\Database;
use App\Models\User;

class SuperAdminController
{
    private function requireSuperAdmin(): int
    {
        $uid = auth_user_id();
        if (!$uid) {
            json_err('Unauthorized', 401);
        }

        $db = Database::pdo();
        $stmt = $db->prepare("
            SELECT 1 FROM company_user cu
            JOIN roles r ON r.id = cu.role_id
            WHERE cu.user_id = ? AND r.name = 'superadmin'
            LIMIT 1
        ");
        $stmt->execute([$uid]);

        if (!$stmt->fetchColumn()) {
            json_err('Forbidden - Superadmin access required', 403);
        }

        return $uid;
    }

    public function stats(): void
    {
        $this->requireSuperAdmin();
        $db = Database::pdo();

        $totalCompanies = (int) $db->query("SELECT COUNT(*) FROM companies")->fetchColumn();
        $totalUsers = (int) $db->query("SELECT COUNT(*) FROM users")->fetchColumn();
        $totalCustomers = (int) $db->query("SELECT COUNT(*) FROM customers")->fetchColumn();
        $totalBookings = (int) $db->query("SELECT COUNT(*) FROM bookings")->fetchColumn();
        $totalInvoices = (int) $db->query("SELECT COUNT(*) FROM invoices")->fetchColumn();

        $totalRevenue = (float) $db->query("
            SELECT COALESCE(SUM(total), 0) FROM invoices WHERE status = 'paid'
        ")->fetchColumn();

        $pendingRevenue = (float) $db->query("
            SELECT COALESCE(SUM(total), 0) FROM invoices 
            WHERE status IN ('draft', 'sent')
        ")->fetchColumn();

        $bookingsByStatus = $db->query("
            SELECT status, COUNT(*) AS count 
            FROM bookings 
            GROUP BY status
        ")->fetchAll(\PDO::FETCH_KEY_PAIR);

        $priorityBookings = (int) $db->query("
            SELECT COUNT(*) FROM bookings 
            WHERE needs_assistance = 1 AND status != 'completed'
        ")->fetchColumn();

        $bookingsToday = (int) $db->query("
            SELECT COUNT(*) FROM bookings WHERE booking_date = CURDATE()
        ")->fetchColumn();

        $bookingsThisWeek = (int) $db->query("
            SELECT COUNT(*) FROM bookings 
            WHERE YEARWEEK(booking_date, 1) = YEARWEEK(CURDATE(), 1)
        ")->fetchColumn();

        $bookingsThisMonth = (int) $db->query("
            SELECT COUNT(*) FROM bookings 
            WHERE MONTH(booking_date) = MONTH(CURDATE()) 
              AND YEAR(booking_date) = YEAR(CURDATE())
        ")->fetchColumn();

        $newCompaniesThisMonth = (int) $db->query("
            SELECT COUNT(*) FROM companies 
            WHERE MONTH(created_at) = MONTH(CURDATE()) 
              AND YEAR(created_at) = YEAR(CURDATE())
        ")->fetchColumn();

        $newUsersThisMonth = (int) $db->query("
            SELECT COUNT(*) FROM users 
            WHERE MONTH(created_at) = MONTH(CURDATE()) 
              AND YEAR(created_at) = YEAR(CURDATE())
        ")->fetchColumn();

        json_ok([
            'total_companies'          => $totalCompanies,
            'total_users'              => $totalUsers,
            'total_customers'          => $totalCustomers,
            'total_bookings'           => $totalBookings,
            'total_invoices'           => $totalInvoices,
            'total_revenue'            => $totalRevenue,
            'pending_revenue'          => $pendingRevenue,
            'bookings_by_status'       => $bookingsByStatus,
            'priority_bookings'        => $priorityBookings,
            'bookings_today'           => $bookingsToday,
            'bookings_this_week'       => $bookingsThisWeek,
            'bookings_this_month'      => $bookingsThisMonth,
            'new_companies_this_month' => $newCompaniesThisMonth,
            'new_users_this_month'     => $newUsersThisMonth,
        ]);
    }

   
    public function companies(): void
    {
        $this->requireSuperAdmin();
        $db = Database::pdo();

        $stmt = $db->query("
            SELECT 
                c.id,
                c.name,
                c.slug,
                c.email,
                c.phone,
                c.address,
                c.created_at,
                (SELECT COUNT(*) FROM bookings b WHERE b.company_id = c.id) AS bookings_count,
                (SELECT COUNT(*) FROM services s WHERE s.company_id = c.id) AS services_count,
                (SELECT COUNT(*) FROM customers cu WHERE cu.company_id = c.id) AS customers_count,
                (SELECT COALESCE(SUM(i.total), 0) FROM invoices i 
                 WHERE i.company_id = c.id AND i.status = 'paid') AS revenue,
                (SELECT u.email FROM company_user cu2
                 JOIN users u ON u.id = cu2.user_id
                 JOIN roles r ON r.id = cu2.role_id
                 WHERE cu2.company_id = c.id AND r.name = 'owner'
                 LIMIT 1) AS owner_email,
                (SELECT u.name FROM company_user cu3
                 JOIN users u ON u.id = cu3.user_id
                 JOIN roles r ON r.id = cu3.role_id
                 WHERE cu3.company_id = c.id AND r.name = 'owner'
                 LIMIT 1) AS owner_name
            FROM companies c
            ORDER BY c.created_at DESC
        ");
        $companies = $stmt->fetchAll();

        json_ok($companies);
    }

    
    public function users(): void
    {
        $this->requireSuperAdmin();
        $db = Database::pdo();

        $stmt = $db->query("
            SELECT 
                u.id,
                u.name,
                u.email,
                u.email_verified_at,
                u.created_at,
                GROUP_CONCAT(DISTINCT r.name SEPARATOR ', ') AS roles,
                GROUP_CONCAT(DISTINCT c.name SEPARATOR ', ') AS companies
            FROM users u
            LEFT JOIN company_user cu ON cu.user_id = u.id
            LEFT JOIN roles r ON r.id = cu.role_id
            LEFT JOIN companies c ON c.id = cu.company_id
            GROUP BY u.id
            ORDER BY u.created_at DESC
            LIMIT 500
        ");
        $users = $stmt->fetchAll();

        json_ok($users);
    }

   
    public function recentBookings(): void
    {
        $this->requireSuperAdmin();
        $db = Database::pdo();

        $stmt = $db->query("
            SELECT 
                b.id,
                b.reference,
                b.booking_date,
                b.start_time,
                b.status,
                b.total_price,
                b.needs_assistance,
                c.name AS company_name,
                c.slug AS company_slug,
                cu.name AS customer_name,
                cu.email AS customer_email,
                s.name AS service_name
            FROM bookings b
            JOIN companies c ON c.id = b.company_id
            JOIN customers cu ON cu.id = b.customer_id
            JOIN services s ON s.id = b.service_id
            ORDER BY b.created_at DESC
            LIMIT 20
        ");
        $bookings = $stmt->fetchAll();

        json_ok($bookings);
    }

   
    public function monthlyRevenue(): void
    {
        $this->requireSuperAdmin();
        $db = Database::pdo();

        $stmt = $db->query("
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m') AS month,
                COUNT(*) AS invoices_count,
                SUM(total) AS revenue
            FROM invoices
            WHERE status = 'paid' 
              AND created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY month ASC
        ");
        $data = $stmt->fetchAll();

        json_ok($data);
    }

   
    public function topCompanies(): void
    {
        $this->requireSuperAdmin();
        $db = Database::pdo();

        $stmt = $db->query("
            SELECT 
                c.id,
                c.name,
                c.slug,
                COUNT(DISTINCT b.id) AS bookings_count,
                COALESCE(SUM(i.total), 0) AS revenue
            FROM companies c
            LEFT JOIN bookings b ON b.company_id = c.id
            LEFT JOIN invoices i ON i.company_id = c.id AND i.status = 'paid'
            GROUP BY c.id
            ORDER BY revenue DESC, bookings_count DESC
            LIMIT 10
        ");
        $data = $stmt->fetchAll();

        json_ok($data);
    }

    public function bookingsChart(): void
    {
        $this->requireSuperAdmin();
        $db = Database::pdo();

        $stmt = $db->query("
            SELECT 
                booking_date AS date,
                COUNT(*) AS count
            FROM bookings
            WHERE booking_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY booking_date
            ORDER BY booking_date ASC
        ");
        $data = $stmt->fetchAll();

        json_ok($data);
    }
}