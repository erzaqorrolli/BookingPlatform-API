<?php

declare (strict_types=1);

namespace App\Config;

use PDO;
use PDOException;

class Database{

private static ?PDO $pdo=null;  

public static function pdo(): PDO{
if(self::$pdo !== null){
    return self::$pdo;

}

$dsn= sprintf(
'mysql:host=%s;port=%s;dbname=%s;charset=%s',
$_ENV['DB_HOST'],
$_ENV['DB_PORT'],
$_ENV['DB_NAME'],
$_ENV['DB_CHARSET'],

);

try{
self::$pdo=new PDO($dsn,$_ENV['DB_USER'], $_ENV['DB_PASS'], 
[
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
]);

}catch(PDOException $e){
http_response_code(500);
echo json_encode([
    'error'=> 'Database connection failed',
    'message'=> ($_ENV['APP_DEBUG'] ?? 'false') === 'true'? $e->getMessage() : null,
]);
exit;
}
return self::$pdo;
}}











?>