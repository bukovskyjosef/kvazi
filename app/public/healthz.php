<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/auth.php';
auth_response_headers();
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    header('Allow: GET');
    echo '{"status":"unavailable"}';
    exit;
}
try {
    if ((int)kvazi_db()->query('SELECT 1')->fetchColumn() !== 1) throw new RuntimeException();
    echo '{"status":"ok"}';
} catch (Throwable) {
    http_response_code(503);
    echo '{"status":"unavailable"}';
}
