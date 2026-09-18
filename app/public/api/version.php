<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store');
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    header('Allow: GET');
    exit;
}
$sha = @file_get_contents('/var/www/.build-sha');
echo json_encode(['sha' => $sha !== false ? trim($sha) : 'unknown']);
