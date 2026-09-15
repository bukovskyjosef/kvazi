<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/auth.php';
auth_session_start();

$token = $_GET['token'] ?? '';
if ($token !== '' && auth_user() !== null && hash_equals(auth_csrf_token(), $token)) {
    auth_logout();
}

header('Location: /');
exit;
