<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Config\Database;
use App\Models\AuditLog;

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
                c.status,
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
        json_ok($stmt->fetchAll());
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
        json_ok($stmt->fetchAll());
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
        json_ok($stmt->fetchAll());
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
        json_ok($stmt->fetchAll());
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
        json_ok($stmt->fetchAll());
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
        json_ok($stmt->fetchAll());
    }

    public function companyDetail(array $params): void
    {
        $this->requireSuperAdmin();
        $db = Database::pdo();

        $id = (int) ($params['id'] ?? 0);
        if (!$id) json_err('Company ID is required', 422);

        $stmt = $db->prepare("
            SELECT 
                c.*,
                (SELECT u.id FROM company_user cu
                 JOIN users u ON u.id = cu.user_id
                 JOIN roles r ON r.id = cu.role_id
                 WHERE cu.company_id = c.id AND r.name = 'owner'
                 LIMIT 1) AS owner_id,
                (SELECT u.name FROM company_user cu
                 JOIN users u ON u.id = cu.user_id
                 JOIN roles r ON r.id = cu.role_id
                 WHERE cu.company_id = c.id AND r.name = 'owner'
                 LIMIT 1) AS owner_name,
                (SELECT u.email FROM company_user cu
                 JOIN users u ON u.id = cu.user_id
                 JOIN roles r ON r.id = cu.role_id
                 WHERE cu.company_id = c.id AND r.name = 'owner'
                 LIMIT 1) AS owner_email
            FROM companies c
            WHERE c.id = ?
            LIMIT 1
        ");
        $stmt->execute([$id]);
        $company = $stmt->fetch();

        if (!$company) json_err('Company not found', 404);

        $stats = $db->prepare("
            SELECT 
                (SELECT COUNT(*) FROM bookings WHERE company_id = ?) AS total_bookings,
                (SELECT COUNT(*) FROM customers WHERE company_id = ?) AS total_customers,
                (SELECT COUNT(*) FROM services WHERE company_id = ?) AS total_services,
                (SELECT COUNT(*) FROM products WHERE company_id = ?) AS total_products,
                (SELECT COALESCE(SUM(total), 0) FROM invoices WHERE company_id = ? AND status = 'paid') AS total_revenue,
                (SELECT COUNT(*) FROM company_user WHERE company_id = ?) AS total_staff
        ");
        $stats->execute([$id, $id, $id, $id, $id, $id]);
        $companyStats = $stats->fetch();

        $staff = $db->prepare("
            SELECT 
                u.id, u.name, u.email, u.email_verified_at,
                r.name AS role,
                cu.created_at AS joined_at
            FROM company_user cu
            JOIN users u ON u.id = cu.user_id
            JOIN roles r ON r.id = cu.role_id
            WHERE cu.company_id = ?
            ORDER BY cu.created_at ASC
        ");
        $staff->execute([$id]);
        $staffList = $staff->fetchAll();

        $bookings = $db->prepare("
            SELECT 
                b.id, b.reference, b.booking_date, b.start_time, b.status,
                b.total_price, b.needs_assistance,
                cu.name AS customer_name,
                s.name AS service_name
            FROM bookings b
            JOIN customers cu ON cu.id = b.customer_id
            JOIN services s ON s.id = b.service_id
            WHERE b.company_id = ?
            ORDER BY b.created_at DESC
            LIMIT 10
        ");
        $bookings->execute([$id]);
        $recentBookings = $bookings->fetchAll();

        json_ok([
            'company'         => $company,
            'stats'           => $companyStats,
            'staff'           => $staffList,
            'recent_bookings' => $recentBookings,
        ]);
    }

    public function userDetail(array $params): void
    {
        $this->requireSuperAdmin();
        $db = Database::pdo();

        $id = (int) ($params['id'] ?? 0);
        if (!$id) json_err('User ID required', 422);

        $stmt = $db->prepare("
            SELECT id, name, email, email_verified_at, status, created_at, updated_at
            FROM users
            WHERE id = ?
            LIMIT 1
        ");
        $stmt->execute([$id]);
        $user = $stmt->fetch();

        if (!$user) json_err('User not found', 404);

        $companies = $db->prepare("
            SELECT 
                c.id AS company_id,
                c.name AS company_name,
                c.slug AS company_slug,
                c.status AS company_status,
                r.name AS role,
                cu.created_at AS joined_at
            FROM company_user cu
            JOIN companies c ON c.id = cu.company_id
            JOIN roles r ON r.id = cu.role_id
            WHERE cu.user_id = ?
            ORDER BY cu.created_at ASC
        ");
        $companies->execute([$id]);
        $companiesList = $companies->fetchAll();

        $customer = $db->prepare("
            SELECT id, company_id, name, email, phone, created_at
            FROM customers
            WHERE user_id = ?
            LIMIT 1
        ");
        $customer->execute([$id]);
        $customerData = $customer->fetch();

        $stats = [
            'total_bookings' => 0,
            'total_spent'    => 0,
        ];

        if ($customerData) {
            $stmt = $db->prepare("
                SELECT 
                    COUNT(*) AS total_bookings,
                    COALESCE(SUM(total_price), 0) AS total_spent
                FROM bookings
                WHERE customer_id = ?
            ");
            $stmt->execute([$customerData['id']]);
            $stats = $stmt->fetch();
        }

        json_ok([
            'user'      => $user,
            'companies' => $companiesList,
            'customer'  => $customerData,
            'stats'     => $stats,
        ]);
    }

    public function toggleUserStatus(array $params): void
    {
        $uid = $this->requireSuperAdmin();
        $db = Database::pdo();

        $id = (int) ($params['id'] ?? 0);
        if (!$id) json_err('User ID required', 422);

        $input = input();
        $status = $input['status'] ?? '';
        $reason = trim($input['reason'] ?? '');

        if (!in_array($status, ['active', 'blocked'], true)) {
            json_err('Invalid status. Use "active" or "blocked"', 422);
        }

        $currentUid = auth_user_id();
        if ($currentUid === $id && $status === 'blocked') {
            json_err('You cannot block yourself', 403);
        }

        $userStmt = $db->prepare("SELECT name, email FROM users WHERE id = ? LIMIT 1");
        $userStmt->execute([$id]);
        $userInfo = $userStmt->fetch();

        $db->prepare("
            UPDATE users 
            SET status = ?, blocked_at = ?, blocked_reason = ?
            WHERE id = ?
        ")->execute([
            $status,
            $status === 'blocked' ? date('Y-m-d H:i:s') : null,
            $status === 'blocked' ? $reason : null,
            $id,
        ]);

        AuditLog::log($uid, 'user.' . $status, 'user', $id, [
            'name'   => $userInfo['name'] ?? '',
            'email'  => $userInfo['email'] ?? '',
            'reason' => $reason,
        ]);

        json_ok([
            'message' => $status === 'blocked' ? 'User blocked' : 'User activated',
            'status'  => $status,
        ]);
    }

    public function deleteUser(array $params): void
    {
        $uid = $this->requireSuperAdmin();
        $db = Database::pdo();

        $id = (int) ($params['id'] ?? 0);
        if (!$id) json_err('User ID required', 422);

        $currentUid = auth_user_id();
        if ($currentUid === $id) {
            json_err('You cannot delete yourself', 403);
        }

        $userStmt = $db->prepare("SELECT name, email FROM users WHERE id = ? LIMIT 1");
        $userStmt->execute([$id]);
        $userInfo = $userStmt->fetch();

        try {
            $db->beginTransaction();

            $db->prepare("DELETE FROM company_user WHERE user_id = ?")->execute([$id]);
            $db->prepare("UPDATE customers SET user_id = NULL WHERE user_id = ?")->execute([$id]);
            $db->prepare("DELETE FROM users WHERE id = ?")->execute([$id]);

            $db->commit();

            AuditLog::log($uid, 'user.delete', 'user', $id, [
                'name'  => $userInfo['name'] ?? '',
                'email' => $userInfo['email'] ?? '',
            ]);

            json_ok(['message' => 'User deleted']);
        } catch (\Throwable $e) {
            if ($db->inTransaction()) $db->rollBack();
            json_err('Delete failed: ' . $e->getMessage(), 500);
        }
    }

    public function allUsers(): void
    {
        $this->requireSuperAdmin();
        $db = Database::pdo();

        $search = $_GET['search'] ?? '';
        $role = $_GET['role'] ?? '';
        $limit = min((int) ($_GET['limit'] ?? 100), 500);

        $sql = "SELECT
            u.id,
            u.name,
            u.email,
            u.email_verified_at,
            u.status,
            u.created_at,
            GROUP_CONCAT(DISTINCT r.name SEPARATOR ', ') AS roles,
            GROUP_CONCAT(DISTINCT c.name SEPARATOR ', ') AS companies
        FROM users u
        LEFT JOIN company_user cu ON cu.user_id = u.id
        LEFT JOIN roles r ON r.id = cu.role_id
        LEFT JOIN companies c ON c.id = cu.company_id";

        $params = [];
        $where = [];

        if ($search) {
            $where[] = "(u.name LIKE ? OR u.email LIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }

        if ($role) {
            $where[] = "EXISTS(
                SELECT 1 FROM company_user cu2
                JOIN roles r2 ON r2.id = cu2.role_id
                WHERE cu2.user_id = u.id AND r2.name = ?
            )";
            $params[] = $role;
        }

        if ($where) {
            $sql .= " WHERE " . implode(' AND ', $where);
        }

        $sql .= " GROUP BY u.id ORDER BY u.created_at DESC LIMIT $limit";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        json_ok($stmt->fetchAll());
    }

    public function allBookings(): void
    {
        $this->requireSuperAdmin();
        $db = Database::pdo();

        $search = $_GET['search'] ?? '';
        $status = $_GET['status'] ?? '';
        $companyId = (int) ($_GET['company_id'] ?? 0);
        $filter = $_GET['filter'] ?? '';
        $limit = min((int) ($_GET['limit'] ?? 100), 500);
        $offset = max((int) ($_GET['offset'] ?? 0), 0);

        $sql = "SELECT
            b.id,
            b.reference,
            b.booking_date,
            b.start_time,
            b.end_time,
            b.status,
            b.total_price,
            b.needs_assistance,
            b.created_at,
            c.id AS company_id,
            c.name AS company_name,
            cu.name AS customer_name,
            cu.email AS customer_email,
            cu.phone AS customer_phone,
            s.name AS service_name
        FROM bookings b
        JOIN companies c ON c.id = b.company_id
        JOIN customers cu ON cu.id = b.customer_id
        JOIN services s ON s.id = b.service_id";

        $params = [];
        $where = [];

        if ($search) {
            $where[] = "(b.reference LIKE ? OR cu.name LIKE ? OR cu.email LIKE ? OR c.name LIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }

        if ($status) {
            $where[] = "b.status = ?";
            $params[] = $status;
        }

        if ($companyId) {
            $where[] = "b.company_id = ?";
            $params[] = $companyId;
        }

        if ($filter === 'today') {
            $where[] = "b.booking_date = CURDATE()";
        } elseif ($filter === 'month') {
            $where[] = "MONTH(b.booking_date) = MONTH(CURDATE()) AND YEAR(b.booking_date) = YEAR(CURDATE())";
        } elseif ($filter === 'priority') {
            $where[] = "b.needs_assistance = 1 AND b.status != 'completed'";
        }

        if ($where) {
            $sql .= " WHERE " . implode(' AND ', $where);
        }

        $sql .= " ORDER BY b.created_at DESC LIMIT $limit OFFSET $offset";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $bookings = $stmt->fetchAll();

        $countSql = "SELECT COUNT(*) FROM bookings b
                     JOIN companies c ON c.id = b.company_id
                     JOIN customers cu ON cu.id = b.customer_id";
        if ($where) {
            $countSql .= " WHERE " . implode(' AND ', $where);
        }
        $countStmt = $db->prepare($countSql);
        $countStmt->execute($params);
        $total = (int) $countStmt->fetchColumn();

        json_ok([
            'bookings' => $bookings,
            'total'    => $total,
            'limit'    => $limit,
            'offset'   => $offset,
        ]);
    }

    public function monthlyReport(): void
    {
        $this->requireSuperAdmin();
        $db = Database::pdo();

        $revenue = $db->query("
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m') AS month,
                COUNT(*) AS invoices_count,
                SUM(total) AS revenue
            FROM invoices
            WHERE status = 'paid'
              AND created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY month ASC
        ")->fetchAll();

        $bookings = $db->query("
            SELECT 
                DATE_FORMAT(booking_date, '%Y-%m') AS month,
                COUNT(*) AS bookings_count
            FROM bookings
            WHERE booking_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
            GROUP BY DATE_FORMAT(booking_date, '%Y-%m')
            ORDER BY month ASC
        ")->fetchAll();

        $topServices = $db->query("
            SELECT 
                s.name AS service_name,
                c.name AS company_name,
                COUNT(b.id) AS bookings_count,
                COALESCE(SUM(b.total_price), 0) AS revenue
            FROM services s
            JOIN companies c ON c.id = s.company_id
            LEFT JOIN bookings b ON b.service_id = s.id
            GROUP BY s.id
            ORDER BY bookings_count DESC, revenue DESC
            LIMIT 10
        ")->fetchAll();

        $byCompany = $db->query("
            SELECT 
                c.id,
                c.name,
                COUNT(DISTINCT b.id) AS bookings_count,
                COALESCE(SUM(i.total), 0) AS revenue
            FROM companies c
            LEFT JOIN bookings b ON b.company_id = c.id
            LEFT JOIN invoices i ON i.company_id = c.id AND i.status = 'paid'
            GROUP BY c.id
            ORDER BY revenue DESC
        ")->fetchAll();

        $statusBreakdown = $db->query("
            SELECT status, COUNT(*) AS count
            FROM bookings
            GROUP BY status
        ")->fetchAll(\PDO::FETCH_KEY_PAIR);

        json_ok([
            'revenue'            => $revenue,
            'bookings'           => $bookings,
            'top_services'       => $topServices,
            'revenue_by_company' => $byCompany,
            'status_breakdown'   => $statusBreakdown,
        ]);
    }

    public function contactMessages(): void
    {
        $this->requireSuperAdmin();
        $db = Database::pdo();

        $status = $_GET['status'] ?? '';
        $search = $_GET['search'] ?? '';

        $sql = "SELECT * FROM contact_messages";
        $params = [];
        $where = [];

        if ($status) {
            $where[] = "status = ?";
            $params[] = $status;
        }

        if ($search) {
            $where[] = "(name LIKE ? OR email LIKE ? OR subject LIKE ? OR message LIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }

        if ($where) {
            $sql .= " WHERE " . implode(' AND ', $where);
        }

        $sql .= " ORDER BY created_at DESC LIMIT 200";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        json_ok($stmt->fetchAll());
    }

    public function markMessageRead(array $params): void
    {
        $this->requireSuperAdmin();
        $db = Database::pdo();

        $id = (int) ($params['id'] ?? 0);
        if (!$id) json_err('Message ID required', 422);

        $db->prepare("UPDATE contact_messages SET status = 'read', read_at = NOW() WHERE id = ?")
           ->execute([$id]);

        json_ok(['message' => 'Message marked as read']);
    }

    public function deleteMessage(array $params): void
    {
        $this->requireSuperAdmin();
        $db = Database::pdo();

        $id = (int) ($params['id'] ?? 0);
        if (!$id) json_err('Message ID required', 422);

        $db->prepare("DELETE FROM contact_messages WHERE id = ?")->execute([$id]);

        json_ok(['message' => 'Message deleted']);
    }

    public function toggleCompanyStatus(array $params): void
    {
        $uid = $this->requireSuperAdmin();
        $db = Database::pdo();

        $id = (int) ($params['id'] ?? 0);
        if (!$id) json_err('Company ID is required', 422);

        $input = input();
        $status = $input['status'] ?? '';
        $reason = trim($input['reason'] ?? '');

        if (!in_array($status, ['active', 'blocked'], true)) {
            json_err('Invalid status. Use "active" or "blocked"', 422);
        }

        $companyStmt = $db->prepare("SELECT name, slug FROM companies WHERE id = ? LIMIT 1");
        $companyStmt->execute([$id]);
        $companyInfo = $companyStmt->fetch();

        if ($status === 'blocked') {
            $db->prepare("
                UPDATE companies 
                SET status = ?, blocked_at = NOW(), blocked_reason = ?
                WHERE id = ?
            ")->execute([$status, $reason, $id]);
        } else {
            $db->prepare("
                UPDATE companies 
                SET status = ?, blocked_at = NULL, blocked_reason = NULL
                WHERE id = ?
            ")->execute([$status, $id]);
        }

        AuditLog::log($uid, 'company.' . $status, 'company', $id, [
            'name'   => $companyInfo['name'] ?? '',
            'slug'   => $companyInfo['slug'] ?? '',
            'reason' => $reason,
        ]);

        json_ok([
            'message' => $status === 'blocked' ? 'Company blocked' : 'Company activated',
            'status'  => $status,
        ]);
    }

    public function deleteCompany(array $params): void
    {
        $uid = $this->requireSuperAdmin();
        $db = Database::pdo();

        $id = (int) ($params['id'] ?? 0);
        if (!$id) json_err('Company ID required', 422);

        $stmt = $db->prepare("SELECT slug, name FROM companies WHERE id = ? LIMIT 1");
        $stmt->execute([$id]);
        $companyRow = $stmt->fetch();

        if (!$companyRow) {
            json_err('Company not found', 404);
        }

        if ($companyRow['slug'] === 'platform-admin') {
            json_err('Cannot delete the platform admin company', 403);
        }

        try {
            $db->beginTransaction();

            $db->prepare("DELETE FROM bookings WHERE company_id = ?")->execute([$id]);
            $db->prepare("DELETE FROM invoices WHERE company_id = ?")->execute([$id]);
            $db->prepare("DELETE FROM customers WHERE company_id = ?")->execute([$id]);
            $db->prepare("DELETE FROM services WHERE company_id = ?")->execute([$id]);
            $db->prepare("DELETE FROM products WHERE company_id = ?")->execute([$id]);
            $db->prepare("DELETE FROM photos WHERE company_id = ?")->execute([$id]);
            $db->prepare("DELETE FROM company_user WHERE company_id = ?")->execute([$id]);
            $db->prepare("DELETE FROM companies WHERE id = ?")->execute([$id]);

            $db->commit();

            AuditLog::log($uid, 'company.delete', 'company', $id, [
                'name' => $companyRow['name'] ?? '',
                'slug' => $companyRow['slug'] ?? '',
            ]);

            json_ok(['message' => 'Company deleted']);
        } catch (\Throwable $e) {
            if ($db->inTransaction()) $db->rollBack();
            json_err('Delete failed: ' . $e->getMessage(), 500);
        }
    }

    public function auditLogs(): void
    {
        $this->requireSuperAdmin();
        json_ok(AuditLog::recent(200));
    }
}