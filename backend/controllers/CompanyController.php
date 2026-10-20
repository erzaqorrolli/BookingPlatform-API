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
        if(strlen($name) < 2) json_err('Company name must be at least 2 characters', 422);

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
        if (!in_array($role, ['owner', 'admin'], true)) json_err('Forbidden', 403);
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
        if(!in_array($role, ['owner', 'admin'])) json_err('Forbidden', 403);

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

        // Kontrollon nëse përdoruesi ekziston tashmë
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
        if(!in_array($role, ['owner', 'admin'], true)) {
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


    public function requestDeletion(array $params): void{

    $uid = auth_user_id();
    if(!$uid)json_err('Unauthorized',401);
    $companyId =(int) $params['id'];

    $role =Company::userRole($uid,$companyId);
    if($role !=='owner'){
        json_err('Only the owner can request deletion',403);
    }

    $db=Database::pdo();
    $stmt=$db->prepare("SELECT name FROM companies WHERE id=?");
    $stmt->execute([$companyId]);
    $companyName=$stmt->fetchColumn();


    if(!$companyName) json_err('Company not found',404);

    $stmt =$db->prepare("SELECT 1 FROM deletion_requests WHERE company_id =?  AND status = 'pending'");

    $stmt->execute([$companyId]);
    if($stmt->fetchColumn()){
        json_err('You already have a pending deletion request.', 422);
    }

    $stmt=$db->prepare("INSERT INTO deletion_requests (company_id,requested_by) VALUES(?, ?)");
    $stmt->execute([$companyId,$uid]);

    $superAdmins=$db->query(" SELECT cu.user_id FROM company_user cu JOIN
    roles r ON r.id = cu.role_id WHERE r.name = 'superadmin'")->fetchAll(\PDO::FETCH_COLUMN);

    foreach($superAdmins as $saId){
        \App\Models\Notification::create(
            (int) $saId,
            'deletion_request',
            'Request to delete company',
            "Company owner '{$companyName}'requested to delete company",
            "/admin/superadmin/companies" 
        );
    }
    json_ok(['message' =>'Request sent successfully! Superadmin will contact you']);
    }
}