<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/auth.php';
auth_session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit;
}
if (!auth_csrf_check()) { http_response_code(403); exit; }
auth_logout();

header('Location: /');
exit;
