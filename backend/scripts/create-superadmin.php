<?php
declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

$name     = $_ENV['SUPERADMIN_NAME'] ?? 'Superadmin';
$email    = $_ENV['SUPERADMIN_EMAIL'] ?? '';
$password = $_ENV['SUPERADMIN_PASSWORD'] ?? '';

if ($email === '' || $password === '') {
    echo "SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD must be set in the .env file.\n";
    exit(1);
}

$db = new PDO(
    'mysql:host=' . $_ENV['DB_HOST'] . ';port=' . $_ENV['DB_PORT'] . ';dbname=' . $_ENV['DB_NAME'] . ';charset=utf8mb4',
    $_ENV['DB_USER'],
    $_ENV['DB_PASS'],
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

echo "===========================================\n";
echo "  CREATING SUPERADMIN\n";
echo "===========================================\n\n";

try {
    $db->beginTransaction();

    $stmt = $db->prepare("SELECT id FROM roles WHERE name = 'superadmin' LIMIT 1");
    $stmt->execute();
    $roleId = $stmt->fetchColumn();

    if (!$roleId) {
        $db->prepare("INSERT INTO roles (name, created_at) VALUES (?, NOW())")
           ->execute(['superadmin']);
        $roleId = (int) $db->lastInsertId();
        echo " Role 'superadmin' created (ID: $roleId)\n";
    } else {
        echo "  Role 'superadmin' already exists (ID: $roleId)\n";
    }

    // 2. Create or get the user
    $stmt = $db->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    $userId = $stmt->fetchColumn();

    if (!$userId) {
        $passwordHash = password_hash($password, PASSWORD_BCRYPT);
        $db->prepare("
            INSERT INTO users (name, email, password, email_verified_at, created_at)
            VALUES (?, ?, ?, NOW(), NOW())
        ")->execute([$name, $email, $passwordHash]);
        $userId = (int) $db->lastInsertId();
        echo "User created (ID: $userId)\n";
    } else {
        echo "ℹ  User already exists (ID: $userId)\n";
        $passwordHash = password_hash($password, PASSWORD_BCRYPT);
        $db->prepare("UPDATE users SET password = ? WHERE id = ?")
           ->execute([$passwordHash, $userId]);
        echo " Password updated\n";
    }

    $stmt = $db->prepare("SELECT id FROM companies WHERE slug = 'platform-admin' LIMIT 1");
    $stmt->execute();
    $companyId = $stmt->fetchColumn();

    if (!$companyId) {
        $db->prepare("
            INSERT INTO companies (name, slug, email, created_at)
            VALUES (?, ?, ?, NOW())
        ")->execute(['Platform Admin', 'platform-admin', $email]);
        $companyId = (int) $db->lastInsertId();
        echo " Company 'Platform Admin' created (ID: $companyId)\n";
    } else {
        echo "Company already exists (ID: $companyId)\n";
    }

    $stmt = $db->prepare("
        SELECT 1 FROM company_user 
        WHERE user_id = ? AND company_id = ? AND role_id = ?
        LIMIT 1
    ");
    $stmt->execute([$userId, $companyId, $roleId]);

    if (!$stmt->fetchColumn()) {
        $db->prepare("
            INSERT INTO company_user (user_id, company_id, role_id, created_at)
            VALUES (?, ?, ?, NOW())
        ")->execute([$userId, $companyId, $roleId]);
        echo "Role 'superadmin' assigned\n";
    } else {
        echo "ℹ  Role already assigned\n";
    }

    $db->commit();

    echo "\nSuperadmin setup completed successfully!\n";

} catch (\Throwable $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    echo " ERROR: " . $e->getMessage() . "\n";
    echo "   At: " . $e->getFile() . ":" . $e->getLine() . "\n";
    exit(1);
}