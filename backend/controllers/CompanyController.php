<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Models\Company; 
use App\Config\Database;
use App\Utils\Mailer;

class CompanyController {

    public function index(): void {
        $uid = auth_user_id();
        if(!$uid) json_err('Unauthorized', 401);

        $companies = Company::forUser($uid);
        json_ok($companies);    
    }

    public static function store(): void {
        $uid = auth_user_id();
        if(!$uid) json_err('Unauthorized', 401);
        $input = input();
        $name = trim($input['name'] ?? '');

        if($name === '') json_err('Company name is required', 422);
        if(\strlen($name) < 2) json_err('Company name must be at least 2 characters', 422);

        $company = Company::createWithOwner(
            $name,
            $uid,
            $input['email'] ?? null,
            $input['phone'] ?? null,
            $input['address'] ?? null
        );

        json_ok([
            'message' => 'Company created successfully',
            'company' => $company->toArray(),
        ], 201);
    }

    public function show(array $params): void {
        $uid = auth_user_id();
        if(!$uid) json_err('Unauthorized', 401);

        $id = (int) $params['id'];

        if(!Company::userBelongsTo($uid, $id)) json_err('Forbidden', 403);

        $company = Company::findById($id);
        if(!$company) json_err('Company not found', 404);

        $role = Company::userRole($uid, $id);

        json_ok([
            'company' => $company->toArray(),
            'user_role' => $role,
        ]);
    }

    public function update(array $params): void {
        $uid = auth_user_id();
        if(!$uid) json_err('Unauthorized', 401);
        $id = (int) $params['id'];

        $role = Company::userRole($uid, $id);
        if (!\in_array($role, ['owner', 'admin'], true)) json_err('Forbidden', 403);
        $input = input();
        $db = Database::pdo();

        $fields = [];
        $values = [];

        foreach(['name', 'email', 'phone', 'address', 'logo_url', 'timezone'] as $field){
            if(isset($input[$field])){
                $fields[] = "$field=?";
                $values[] = $input[$field];
            }
        }

        if(empty($fields)){
            json_err('Nothing to update', 422);
        }

        $values[] = $id;
        $sql = "UPDATE companies SET " . implode(', ', $fields) . " WHERE id=?";
        $db->prepare($sql)->execute($values);

        $company = Company::findById($id);
        json_ok([
            'message' => 'Company updated',
            'company' => $company->toArray(),
        ]);
    }

    public function invite(array $params): void {
        $uid = auth_user_id();
        if(!$uid) json_err('Unauthorized', 401);

        $companyId = (int) $params['id'];

        $role = Company::userRole($uid, $companyId);
        if(!\in_array($role, ['owner', 'admin'])) json_err('Forbidden', 403);

        $input = input();
        $email = trim(strtolower($input['email'] ?? ''));
        $roleName = $input['role'] ?? 'staff';

        if ($roleName === 'owner' || ($roleName === 'admin' && $role !== 'owner')) {
            json_err('This role cannot be assigned', 403);
        }

        if(!filter_var($email, FILTER_VALIDATE_EMAIL)){
            json_err('Invalid email address', 422);
        }

        $db = Database::pdo();
        $stmt = $db->prepare("SELECT id FROM roles WHERE name = ?");
        $stmt->execute([$roleName]);
        $roleId = $stmt->fetchColumn();
        if(!$roleId) json_err("Invalid role", 422);

        $token = bin2hex(random_bytes(24));
        $stmt = $db->prepare("
            INSERT INTO company_invitations (company_id, email, role_id, token, expires_at)
            VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))
        ");
        $stmt->execute([$companyId, $email, $roleId, $token]);

        $link = ($_ENV['FRONTEND_URL'] ?? 'http://localhost:5173') . "/accept-invite?token=$token";
        Mailer::sendInvitation($email, $link, $roleName);

        json_ok([
            'message' => 'Invitation sent',
            'invite_link' => ($_ENV['APP_DEBUG'] ?? 'false') === 'true' ? $link : null,
        ], 201);
    }

    public function acceptInvite(): void {
        $uid = auth_user_id();
        if(!$uid) json_err('Unauthorized', 401);

        $input = input();
        $token = $input['token'] ?? '';

        if(!$token) json_err('Token required', 422);

        $db = Database::pdo();
        $stmt = $db->prepare("SELECT * FROM company_invitations WHERE token = ? AND accepted_at IS NULL AND expires_at > NOW()");
        $stmt->execute([$token]);
        $invite = $stmt->fetch();

        if(!$invite) json_err('Invalid or expired invitation', 400);

        $stmt = $db->prepare("SELECT email FROM users WHERE id = ?");
        $stmt->execute([$uid]);
        $userEmail = $stmt->fetchColumn();

        if($userEmail !== $invite['email']){
            json_err('Invitation is for a different email', 403);
        }
        
        $stmt = $db->prepare("INSERT IGNORE INTO company_user (user_id, company_id, role_id) VALUES (?, ?, ?)");
        $stmt->execute([$uid, $invite['company_id'], $invite['role_id']]);

        $stmt = $db->prepare("UPDATE company_invitations SET accepted_at = NOW() WHERE id = ?");
        $stmt->execute([$invite['id']]);

        json_ok(['message' => 'Invitation accepted']);
    }

    public function members(array $params): void {
        $uid = auth_user_id();
        if(!$uid) json_err('Unauthorized', 401);

        $companyId = (int) $params['id'];
        if(!Company::userBelongsTo($uid, $companyId)){
            json_err('Forbidden', 403);
        }

        $db = Database::pdo();
        $stmt = $db->prepare("
            SELECT u.id, u.name, u.email, r.name AS role, cu.created_at
            FROM company_user cu
            JOIN users u ON u.id = cu.user_id
            JOIN roles r ON r.id = cu.role_id
            WHERE cu.company_id = ?
            ORDER BY r.name, u.name
        ");
        $stmt->execute([$companyId]);

        json_ok($stmt->fetchAll());
    }

    public function myPayroll(array $params): void {
        $uid = auth_user_id();
        if (!$uid) json_err('Unauthorized', 401);

        $companyId = (int) $params['companyId'];
        if (!Company::userBelongsTo($uid, $companyId)) {
            json_err('Forbidden', 403);
        }

        \App\Models\PayrollEarning::calculateEarnings($companyId, $uid);
        $totals = \App\Models\PayrollEarning::getUnpaidTotal($companyId, $uid);
        $compensation = \App\Models\StaffCompensation::findForUser($companyId, $uid);

        json_ok([
            'total' => (float) $totals['total'],
            'total_hours' => (float) $totals['total_hours'],
            'shifts_count' => (int) $totals['shifts_count'],
            'hourly_rate' => $compensation ? (float) $compensation['hourly_rate'] : 0,
            'configured' => $compensation !== null,
        ]);
    }

    public function getInvitation(array $params): void {
        $token = $params['token'] ?? '';
        if (!$token) json_err('Token required', 422);

        $db = Database::pdo();
        $stmt = $db->prepare("
            SELECT ci.email, c.name AS company_name, r.name AS role_name
            FROM company_invitations ci
            JOIN companies c ON c.id = ci.company_id
            JOIN roles r ON r.id = ci.role_id
            WHERE ci.token = ? AND ci.accepted_at IS NULL AND ci.expires_at > NOW()
        ");
        $stmt->execute([$token]);
        $invite = $stmt->fetch();

        if (!$invite) json_err('Invalid or expired invitation', 400);

        $userStmt = $db->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
        $userStmt->execute([$invite['email']]);
        $invite['user_exists'] = (bool) $userStmt->fetchColumn();

        json_ok($invite);
    }

    public function removeMember(array $params): void {
        $uid = auth_user_id();
        if(!$uid) json_err('Unauthorized', 401);

        $companyId = (int) $params['companyId'];
        $memberId = (int) $params['id'];

        $role = Company::userRole($uid, $companyId);
        if(!\in_array($role, ['owner', 'admin'], true)) {
            json_err('Forbidden', 403);
        }
        if($uid === $memberId) {
            json_err('You cannot remove yourself', 422);
        }

        $db = Database::pdo();
        $memberRole = Company::userRole($memberId, $companyId);
        if($memberRole === 'owner') {
            json_err('Cannot remove the owner', 403);
        }

        $stmt = $db->prepare("DELETE FROM company_user WHERE user_id = ? AND company_id = ?");
        $stmt->execute([$memberId, $companyId]);
        
        json_ok(['message' => 'Member removed from company']);
    }

    public function deleteMemberAccount(array $params): void {
        $uid = auth_user_id();
        if(!$uid) json_err('Unauthorized', 401);

        $companyId = (int) $params['companyId'];
        $memberId = (int) $params['id'];

        $role = Company::userRole($uid, $companyId);
        if($role !== 'owner') {
            json_err('Only the owner can delete an account', 403);
        }

        if($uid === $memberId) {
            json_err('You cannot delete yourself', 422);
        }

        $db = Database::pdo();
        $memberRole = Company::userRole($memberId, $companyId);
        if($memberRole === 'owner') {
            json_err('Cannot delete an owner account', 403);
        }

        try {
            $db->beginTransaction();

            $db->prepare("DELETE FROM company_user WHERE user_id = ?")->execute([$memberId]);
            $db->prepare("UPDATE customers SET user_id = NULL WHERE user_id = ?")->execute([$memberId]);
            $db->prepare("DELETE FROM users WHERE id = ?")->execute([$memberId]);

            $db->commit();

            json_ok(['message' => 'Account deleted permanently']);
        } catch(\Throwable $e) {
            if($db->inTransaction()) $db->rollBack();
            json_err('Delete failed: ' . $e->getMessage(), 500);
        }
    }


    public function requestDeletion(array $params): void {
        $uid = auth_user_id();
        if(!$uid) json_err('Unauthorized', 401);
        $companyId = (int) $params['id'];

        $role = Company::userRole($uid, $companyId);
        if($role !== 'owner'){
            json_err('Only the owner can request deletion', 403);
        }

        $db = Database::pdo();
        $stmt = $db->prepare("SELECT name FROM companies WHERE id=?");
        $stmt->execute([$companyId]);
        $companyName = $stmt->fetchColumn();

        if(!$companyName) json_err('Company not found', 404);

        $stmt = $db->prepare("SELECT 1 FROM deletion_requests WHERE company_id =? AND status = 'pending'");
        $stmt->execute([$companyId]);
        if($stmt->fetchColumn()){
            json_err('You already have a pending deletion request.', 422);
        }

        $stmt = $db->prepare("INSERT INTO deletion_requests (company_id,requested_by) VALUES(?, ?)");
        $stmt->execute([$companyId, $uid]);

        $superAdmins = $db->query("
            SELECT cu.user_id FROM company_user cu 
            JOIN roles r ON r.id = cu.role_id 
            WHERE r.name = 'superadmin'
        ")->fetchAll(\PDO::FETCH_COLUMN);

        foreach($superAdmins as $saId){
            \App\Models\Notification::create(
                (int) $saId,
                'deletion_request',
                'Request to delete company',
                "Company owner '{$companyName}' requested to delete company",
                "/admin/superadmin/companies" 
            );
        }
        json_ok(['message' => 'Request sent successfully! Superadmin will contact you']);
    }


    public function updateSmtpSettings(array $params): void
    {
        $uid = auth_user_id();
        $companyId = (int) $params['id'];
        $role = Company::userRole($uid, $companyId);

        if ($role !== 'owner') json_err('Only owner can change this', 403);

        $input = input();
        $db = Database::pdo();
        
        $stmt = $db->prepare("
            INSERT INTO company_settings (company_id, smtp_host, smtp_port, smtp_user, smtp_pass, smtp_encryption, from_email, from_name) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?) 
            ON DUPLICATE KEY UPDATE
                smtp_host = VALUES(smtp_host),
                smtp_port = VALUES(smtp_port),
                smtp_user = VALUES(smtp_user),
                smtp_pass = VALUES(smtp_pass),
                smtp_encryption = VALUES(smtp_encryption),
                from_email = VALUES(from_email),
                from_name = VALUES(from_name)
        ");

        $stmt->execute([
            $companyId,
            $input['smtp_host'],
            $input['smtp_port'],
            $input['smtp_user'],
            $input['smtp_pass'],
            $input['smtp_encryption'] ?? 'tls',
            $input['from_email'] ?? $input['smtp_user'],
            $input['from_name'] ?? 'BookWise'
        ]);

        json_ok(['message' => 'SMTP settings saved']);
    }


    public function testSmtp(array $params): void
    {
        $uid = auth_user_id();
        $companyId = (int) $params['id'];
        
        if (Company::userRole($uid, $companyId) !== 'owner') {
            json_err('Forbidden', 403);
        }

        $rawInput = file_get_contents('php://input');
        $jsonData = json_decode($rawInput, true);
        
        $to = $jsonData['email_to'] ?? $_POST['email_to'] ?? input()['email_to'] ?? '';

        if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
            json_err('Valid email required. Received: ' . $to, 422);
        }

        $sent = \App\Utils\TenantMailer::send(
            $companyId, 
            $to, 
            'Test Email from Booking Platform', 
            '<h1>Success!</h1><p>If you are reading this email, your company smtp configuration is working 100%.</p>'
        );

        if ($sent) {
            json_ok(['message' => 'Test email sent successfully!']);
        } else {
            json_err('Failed to send. Check your SMTP credentials.', 500);
        }
    }


    public function getChatMessages(array $params): void
    {
        $uid = auth_user_id();
        $companyId = (int) $params['id'];
        $customerEmail = $_GET['email'] ?? '';

        if (!Company::userBelongsTo($uid, $companyId)) {
            json_err('Forbidden', 403);
        }

        if (!$customerEmail) {
            json_err('Customer email required', 422);
        }

        $db = Database::pdo();
        $stmt = $db->prepare("
            SELECT * FROM email_messages 
            WHERE company_id = ? AND customer_email = ? 
            ORDER BY created_at ASC
        ");
        $stmt->execute([$companyId, $customerEmail]);
        
        json_ok($stmt->fetchAll());
    }

    public function sendChatMessage(array $params): void
    {
        $uid = auth_user_id();
        $companyId = (int) $params['id'];
        $role = Company::userRole($uid, $companyId);

        if(!Company::userBelongsTo($uid, $companyId)){
            json_err('Forbidden', 403);
        }

        if($role !== 'owner' && $role !== 'admin'){
            $db = Database::pdo();
            $stmt = $db->prepare("
                SELECT p.permission_key FROM company_user_custom_roles cu
                JOIN company_role_permissions p ON p.role_id = cu.custom_role_id 
                WHERE cu.company_id = ? AND cu.user_id = ? AND p.enabled = 1
            ");
            $stmt->execute([$companyId, $uid]);
            $customPermissions = $stmt->fetchAll(\PDO::FETCH_COLUMN);

            if(!in_array('staff_can_send_emails', $customPermissions)){
                json_err('You do not have permission to send emails', 403);
            }
        }

        $input = input();
        $email = $input['customer_email'] ?? '';
        $body = $input['body'] ?? '';
        $companyName = $input['company_name'] ?? 'Platform';

        if (!$email || !$body) {
            json_err('Email and body required', 422);
        }

        $sent = \App\Utils\TenantMailer::send(
            $companyId,
            $email,
            "New message from {$companyName}",
            $body
        );

        if ($sent) {
            json_ok(['message' => 'Message sent']);
        } else {
            json_err('Message failed to send. Check SMTP.', 500);
        }
    }

    public function getChatCustomers(array $params): void
    {
        $uid = auth_user_id();
        $companyId = (int) $params['id'];
        
        if(!Company::userBelongsTo($uid, $companyId)){
            json_err('Forbidden', 403);
        }

        $db = Database::pdo();
        $stmt = $db->prepare("
            SELECT DISTINCT email
            FROM customers
            WHERE company_id = ? AND email IS NOT NULL AND email != ''
            ORDER BY email ASC
        ");
        $stmt->execute([$companyId]);

        json_ok($stmt->fetchAll(\PDO::FETCH_COLUMN));
    }

    public function getCompanyCustomers(array $params): void
    {
        $uid = auth_user_id();
        $companyId = (int) $params['id'];

        if (!Company::userBelongsTo($uid, $companyId)) {
            json_err('Forbidden', 403);
        }

        $db = Database::pdo();
        $stmt = $db->prepare("SELECT id, name, email FROM customers WHERE company_id = ? ORDER BY name ASC");
        $stmt->execute([$companyId]);
        
        json_ok($stmt->fetchAll());
    }

    public function syncInbox(array $params): void
    {
        $uid = auth_user_id();
        $companyId = (int) $params['id'];

        if(!Company::userBelongsTo($uid, $companyId)){
            json_err('Forbidden', 403);
        }

        $synced = \App\Utils\ImapSyncer::syncInbox($companyId);
        json_ok(['synced' => $synced, 'message' => "Synced $synced new answer"]);
    }

    public function getCustomRoles(array $params): void
    {
        $uid = auth_user_id();
        $companyId = (int) $params['id'];
        if(Company::userRole($uid,$companyId) !== 'owner') json_err('Forbidden', 403);

        $db = Database::pdo();
        $stmt = $db->prepare("
            SELECT r.id, r.name, GROUP_CONCAT(p.permission_key) as permissions 
            FROM company_roles r 
            LEFT JOIN company_role_permissions p ON p.role_id = r.id AND p.enabled = 1
            WHERE r.company_id = ? 
            GROUP BY r.id
            ORDER BY r.name ASC
        ");
        $stmt->execute([$companyId]);

        $roles = $stmt->fetchAll();

        foreach($roles as &$role){
            $role['permissions'] = $role['permissions'] ? explode(',', $role['permissions']) : [];
        }
        json_ok($roles);
    }

    public function createCustomRole(array $params): void
    {
        $uid = auth_user_id();
        $companyId = (int) $params['id'];

        if(Company::userRole($uid, $companyId) !== 'owner') json_err('Forbidden', 403);

        $input = input();
        $name = trim($input['name'] ?? '');

        if(!$name) json_err('Role name is required', 422);

        $db = Database::pdo();

        try {
            $stmt = $db->prepare("INSERT INTO company_roles (company_id, name) VALUES (?, ?)");
            $stmt->execute([$companyId, $name]);
            $roleId = (int) $db->lastInsertId();

            json_ok(['message' => 'Role created', 'role_id' => $roleId], 201);
        } catch(\Throwable $e) {
            json_err('Role already exists or error occurred', 400);
        }
    }

       public function updateRolePermissions(array $params): void
    {
        $uid = auth_user_id();
        $companyId = (int) $params['id'];
        $roleId = (int) $params['roleId'];

        if(Company::userRole($uid, $companyId) !== 'owner') json_err('Forbidden', 403);

        $input = input();
        $permissions = $input['permissions'] ?? [];

        $db = Database::pdo();

        $deleteStmt = $db->prepare("DELETE FROM company_role_permissions WHERE role_id = ?");
        $deleteStmt->execute([$roleId]);

        $stmt = $db->prepare("INSERT INTO company_role_permissions (role_id, permission_key, enabled) VALUES (?, ?, 1)");
        foreach($permissions as $perm){
            $stmt->execute([$roleId, $perm]);
        } 

        json_ok(['message' => 'Permissions updated']);
    }

    public function getUserCustomRole(array $params): void
    {
        $uid = auth_user_id();
        $companyId = (int) $params['id'];
        $targetUserId = (int) $params['userId'];

        if(Company::userRole($uid, $companyId) !== 'owner' && $uid !== $targetUserId){
            json_err('Forbidden', 403);
        }

        $db = Database::pdo();
        $stmt = $db->prepare("SELECT custom_role_id FROM company_user_custom_roles WHERE company_id = ? AND user_id = ?");
        $stmt->execute([$companyId, $targetUserId]);

        json_ok(['custom_role_id' => $stmt->fetchColumn() ?: null]);
    }

    public function assignCustomRole(array $params): void
    {
        $uid = auth_user_id();
        $companyId = (int) $params['id'];
        $targetUserId = (int) $params['userId'];

        if(Company::userRole($uid, $companyId) !== 'owner'){
            json_err('Only the owner can assign roles', 403);
        }

        $input = input();
        $customRoleId = $input['custom_role_id'] ?? null;

        $db = Database::pdo();

        $db->prepare("DELETE FROM company_user_custom_roles WHERE company_id = ? AND user_id = ?")
           ->execute([$companyId, $targetUserId]);

        if($customRoleId){
            $check = $db->prepare("SELECT 1 FROM company_roles WHERE id = ? AND company_id = ?");
            $check->execute([$customRoleId, $companyId]);
            if(!$check->fetchColumn()){
                json_err('Invalid role', 422);
            }

            $db->prepare("INSERT INTO company_user_custom_roles (user_id, company_id, custom_role_id) VALUES (?, ?, ?)")
               ->execute([$targetUserId, $companyId, $customRoleId]);
        }
        json_ok(['message' => 'Role updated']);
    }

    public function getMyPermissions(array $params): void{
    $uid=auth_user_id();   
    $companyId = (int) $params['id'];

    if(!Company::userBelongsTo($uid,$companyId)){
        json_err('Forbidden',403);
    }

    $role = Company::userRole ($uid,$companyId);

    if(in_array($role,['owner','admin'])){
        json_ok(['is_admin' => true, 'permissions'=>['*']]);
        return;
    }

    $db=Database::pdo();
    $stmt=$db->prepare("SELECT p.permission_key
    FROM company_user_custom_roles cu
    JOIN company_role_permissions p ON p.role_id = cu.custom_role_id 
    WHERE cu.company_id = ? AND cu.user_id = ? AND p.enabled = 1");

    $stmt->execute([$companyId,$uid]);
    $permissions = $stmt->fetchAll(\PDO::FETCH_COLUMN);

    json_ok(['is_admin' => false, 'permissions'=>$permissions]);
        
    }

      public function deleteCustomRole(array $params): void
    {
        $uid = auth_user_id();
        $companyId = (int) $params['id'];
        $roleId = (int) $params['roleId'];

        if (Company::userRole($uid, $companyId) !== 'owner') {
            json_err('Only the owner can delete roles', 403);
        }

        $db = Database::pdo();

        $stmt = $db->prepare("SELECT name FROM company_roles WHERE id = ? AND company_id = ?");
        $stmt->execute([$roleId, $companyId]);
        $role = $stmt->fetch();

        if (!$role) {
            json_err('Role not found', 404);
        }

        try {
            $db->beginTransaction();

            $db->prepare("DELETE FROM company_user_custom_roles WHERE custom_role_id = ?")
               ->execute([$roleId]);

            $db->prepare("DELETE FROM company_role_permissions WHERE role_id = ?")
               ->execute([$roleId]);

            $db->prepare("DELETE FROM company_roles WHERE id = ?")
               ->execute([$roleId]);

            $db->commit();

            json_ok(['message' => 'Role deleted successfully']);

        } catch (\Throwable $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            json_err('Delete failed: ' . $e->getMessage(), 500);
        }
    }

      public function updateCustomRole(array $params): void
    {
        $uid = auth_user_id();
        $companyId = (int) $params['id'];
        $roleId = (int) $params['roleId'];

        if (Company::userRole($uid, $companyId) !== 'owner') {
            json_err('Only the owner can edit roles', 403);
        }

        $input = input();
        $name = trim($input['name'] ?? '');

        if (!$name) json_err('Role name is required', 422);

        $db = Database::pdo();
        
        $check = $db->prepare("SELECT id FROM company_roles WHERE id = ? AND company_id = ?");
        $check->execute([$roleId, $companyId]);
        if (!$check->fetchColumn()) {
            json_err('Role not found', 404);
        }

        $stmt = $db->prepare("UPDATE company_roles SET name = ? WHERE id = ? AND company_id = ?");
        $stmt->execute([$name, $roleId, $companyId]);

        json_ok(['message' => 'Role updated']);
    }

    public function getMyRoleDetails(array $params): void
    {
        $uid = auth_user_id();
        $companyId = (int) $params['id'];

        if (!Company::userBelongsTo($uid, $companyId)) {
            json_err('Forbidden', 403);
        }

        $role = Company::userRole($uid, $companyId);
        
        if (in_array($role, ['owner', 'admin'])) {
            json_ok([
                'role_name' => ucfirst($role),
                'is_admin' => true,
                'permissions' => [],
            ]);
            return;
        }

        $db = Database::pdo();
        
        $stmt = $db->prepare("
            SELECT cr.name as role_name, cr.id as role_id
            FROM company_user_custom_roles cucr
            JOIN company_roles cr ON cr.id = cucr.custom_role_id
            WHERE cucr.company_id = ? AND cucr.user_id = ?
            LIMIT 1
        ");
        $stmt->execute([$companyId, $uid]);
        $customRole = $stmt->fetch();

        if (!$customRole) {
            json_ok([
                'role_name' => 'Standard Staff',
                'is_admin' => false,
                'permissions' => [],
            ]);
            return;
        }

        $stmt = $db->prepare("
            SELECT permission_key 
            FROM company_role_permissions 
            WHERE role_id = ? AND enabled = 1
        ");
        $stmt->execute([$customRole['role_id']]);
        $permissions = $stmt->fetchAll(\PDO::FETCH_COLUMN);

        json_ok([
            'role_name' => $customRole['role_name'],
            'is_admin' => false,
            'permissions' => $permissions,
        ]);
    }}