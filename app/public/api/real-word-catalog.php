<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/includes/review-api.php';
try {
    $payload = kvazi_review_api_request(false, ['token']);
    if (!is_array($payload['token'] ?? null)) throw new InvalidArgumentException('Chybí kompletní deklarace slova.');
    $nd = kvazi_load_validator(dirname(__DIR__, 2))->getNormativeData();
    $key = kvazi_exact_key($payload['token'], $nd, true);
    if ($key === null) throw new InvalidArgumentException('Normativní výjimka nepotřebuje katalogové ověření.');
    echo json_encode(['ok' => true, 'exactMatch' => kvazi_catalog_match(kvazi_db(), $key)], JSON_THROW_ON_ERROR);
} catch (Throwable $e) { kvazi_review_api_failure($e); }
