<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/includes/validator.php';
require_once dirname(__DIR__) . '/includes/auth.php';
auth_response_headers();

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache');

$appRoot = dirname(dirname(__DIR__));
try {
    $validator = kvazi_load_validator($appRoot);
    header('X-Rules-Version: ' . $validator->getRulesVersion());
    echo json_encode($validator->getNormativeData(), JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
} catch (Throwable) {
    http_response_code(503);
    echo json_encode(['error' => 'Normativní data nejsou dostupná.']);
}
