<?php
declare(strict_types=1);

namespace App\Config;

class Router
{
    private static array $routes = [];

    public static function get(string $path, $handler): void
    {
        self::$routes[] = ['GET', $path, $handler];
    }

    public static function post(string $path, $handler): void
    {
        self::$routes[] = ['POST', $path, $handler];
    }

    public static function put(string $path, $handler): void
    {
        self::$routes[] = ['PUT', $path, $handler];
    }

    public static function delete(string $path, $handler): void
    {
        self::$routes[] = ['DELETE', $path, $handler];
    }

    public static function dispatch(): void
    {
        $method = $_SERVER['REQUEST_METHOD'];
        $uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

        // Hiq base path
        $base = '/booking-api/public';
        if (str_starts_with($uri, $base)) {
            $uri = substr($uri, strlen($base));
        }
        if ($uri === '') {
            $uri = '/';
        }

        require __DIR__ . '/../routes/api.php';

        foreach (self::$routes as [$routeMethod, $routePath, $handler]) {
            if ($routeMethod !== $method) {
                continue;
            }

            $pattern = '#^' . preg_replace('#\{(\w+)\}#', '(?P<$1>[^/]+)', $routePath) . '$#';

            if (preg_match($pattern, $uri, $matches)) {
                $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);

                if (is_array($handler)) {
                    [$class, $methodName] = $handler;
                    $controller = new $class();
                    $result = $controller->$methodName($params);
                } else {
                    $result = $handler($params);
                }

                if ($result !== null) {
                    json_ok($result);
                }
                return;
            }
        }

        json_err('Route not found: ' . $uri, 404);
    }
}