<?php
/**
 * CLI helper for parity.test.mjs — reads a draft JSON from stdin,
 * runs KvaziValidator::deriveValidationState, and prints the result as JSON to stdout.
 *
 * Usage: echo '<draft-json>' | php run-php-validator.php
 *
 * The script uses kvazi_load_validator() which loads the active rules release,
 * verifies the normative.json hash, and constructs the validator — the same code
 * path used by submit.php in production.
 */
declare(strict_types=1);

$appRoot = dirname(__DIR__); // app/
require_once $appRoot . '/public/includes/validator.php';

$input = stream_get_contents(STDIN);
if ($input === false || trim($input) === '') {
    fwrite(STDERR, "run-php-validator: no input on stdin\n");
    exit(1);
}

$draft = json_decode($input, true, 512);
if (!is_array($draft)) {
    fwrite(STDERR, "run-php-validator: invalid JSON input\n");
    exit(1);
}

try {
    $validator = kvazi_load_validator($appRoot);
    $result    = $validator->deriveValidationState($draft);
    echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
} catch (Throwable $e) {
    fwrite(STDERR, "run-php-validator: " . $e->getMessage() . "\n");
    exit(2);
}
