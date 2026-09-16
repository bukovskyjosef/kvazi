<?php
declare(strict_types=1);

// Coolify CMD allows a simple executable/path, without shell/PHP expressions.
// Keep readiness HTTP-based, using PHP already present in the application image.
$body = @file_get_contents('http://127.0.0.1:80/healthz', false, stream_context_create([
    'http' => ['timeout' => 3, 'follow_location' => 0, 'ignore_errors' => true],
]));
if ($body === false || preg_match('~^HTTP/1\.[01] 200(?: |$)~', $http_response_header[0] ?? '') !== 1) {
    exit(1);
}
try {
    exit(json_decode($body, true, 512, JSON_THROW_ON_ERROR) === ['status' => 'ok'] ? 0 : 1);
} catch (Throwable) {
    exit(1);
}
