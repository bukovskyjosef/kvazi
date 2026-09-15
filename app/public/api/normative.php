<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/includes/auth.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=3600');

$appRoot = dirname(dirname(__DIR__));
try {
    $ar = json_decode(
        (string)file_get_contents($appRoot . '/data/active-release.json'),
        true, 512, JSON_THROW_ON_ERROR
    );
    $version = $ar['version'] ?? '';
    if (!$version) throw new RuntimeException('No active rules version');
    $nd = file_get_contents($appRoot . "/data/rules/{$version}/normative.json");
    if ($nd === false) throw new RuntimeException('Cannot read normative.json');
    header('X-Rules-Version: ' . $version);
    echo $nd;
} catch (Throwable) {
    http_response_code(503);
    echo json_encode(['error' => 'Normativní data nejsou dostupná.']);
}
