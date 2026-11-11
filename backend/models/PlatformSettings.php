<?php

    declare(strict_types=1);
    
    namespace App\Models;

    use App\Config\Database;


    class PlatformSettings{


        private static ?array $cache= null;

        public static function get(): array {

        if(self::$cache !==null) return self::$cache;
        $db=Database::pdo();
        $stmt=$db->query("SEELCT * FROM platform_settings WHERE id=1");
        self::$cache=$stmt->fetch() ?:[];
        return self::$cache;
        }

        public static function getValue(string $key, $default = null)
        {
            $settings = self::get();
            return $settings[$key] ?? $default;
        }


    }