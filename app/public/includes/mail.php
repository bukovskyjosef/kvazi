<?php
declare(strict_types=1);

/**
 * Minimal transactional mail adapter for Nejdelší kvazivěta.
 *
 * Two transports:
 *   smtp   – dependency-free SMTP client (EHLO, STARTTLS, AUTH LOGIN, DATA)
 *   outbox – deterministic JSONL for integration testing (forbidden in production)
 *
 * Public API: kvazi_mail_send(string $to, string $subject, string $textBody): void
 */

/**
 * Send a plain-text transactional e-mail.
 *
 * @throws RuntimeException on any transport or configuration failure
 */
function kvazi_mail_send(string $to, string $subject, string $textBody): void
{
    _kvazi_mail_reject_header_injection($to, 'recipient');
    _kvazi_mail_reject_header_injection($subject, 'subject');

    $transport = getenv('MAIL_TRANSPORT') ?: '';
    if ($transport === '') {
        throw new RuntimeException('MAIL_TRANSPORT is not configured');
    }

    $from = _kvazi_mail_from();

    if ($transport === 'outbox') {
        _kvazi_mail_outbox($to, $subject, $textBody, $from);
        return;
    }

    if ($transport === 'smtp') {
        _kvazi_mail_smtp($to, $subject, $textBody, $from);
        return;
    }

    throw new RuntimeException('Unknown MAIL_TRANSPORT: ' . $transport);
}

/**
 * Reject values containing CR/LF to prevent header injection.
 *
 * @throws RuntimeException
 */
function _kvazi_mail_reject_header_injection(string $value, string $field): void
{
    if (preg_match("/[\r\n]/", $value)) {
        throw new RuntimeException("Header injection rejected in $field");
    }
}

/**
 * Build RFC 5322 "From" value from env.
 *
 * @throws RuntimeException
 */
function _kvazi_mail_from(): string
{
    $address = getenv('MAIL_FROM_ADDRESS') ?: '';
    if ($address === '') {
        throw new RuntimeException('MAIL_FROM_ADDRESS is not configured');
    }
    _kvazi_mail_reject_header_injection($address, 'from address');

    $name = getenv('MAIL_FROM_NAME') ?: '';
    if ($name !== '') {
        _kvazi_mail_reject_header_injection($name, 'from name');
        return '"' . str_replace('"', '\\"', $name) . '" <' . $address . '>';
    }
    return $address;
}

// ---------- outbox transport ----------

/**
 * Write a JSONL record to MAIL_OUTBOX_PATH. Forbidden in production.
 *
 * @throws RuntimeException
 */
function _kvazi_mail_outbox(string $to, string $subject, string $textBody, string $from): void
{
    if (getenv('APP_ENV') === 'production') {
        throw new RuntimeException('Outbox transport is forbidden in production');
    }

    $path = getenv('MAIL_OUTBOX_PATH') ?: '';
    if ($path === '') {
        throw new RuntimeException('MAIL_OUTBOX_PATH is not configured');
    }

    $record = json_encode([
        'timestamp' => gmdate('Y-m-d\\TH:i:s\\Z'),
        'from'      => $from,
        'to'        => $to,
        'subject'   => $subject,
        'body'      => $textBody,
    ], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR) . "\n";

    $written = @file_put_contents($path, $record, FILE_APPEND | LOCK_EX);
    if ($written === false) {
        throw new RuntimeException('Failed to write outbox record to ' . $path);
    }
}

// ---------- SMTP transport ----------

/**
 * Send via raw SMTP (EHLO, STARTTLS, AUTH LOGIN, DATA, QUIT).
 *
 * @throws RuntimeException
 */
function _kvazi_mail_smtp(string $to, string $subject, string $textBody, string $from): void
{
    $host    = getenv('SMTP_HOST') ?: '';
    $port    = (int)(getenv('SMTP_PORT') ?: 0);
    $tlsMode = getenv('SMTP_TLS_MODE') ?: 'starttls';
    $user    = getenv('SMTP_USERNAME') ?: '';
    $pass    = getenv('SMTP_PASSWORD') ?: '';

    if ($host === '' || $port === 0) {
        throw new RuntimeException('SMTP_HOST and SMTP_PORT must be configured');
    }
    if ($user === '' || $pass === '') {
        throw new RuntimeException('SMTP_USERNAME and SMTP_PASSWORD must be configured');
    }

    if ($tlsMode === 'none' && getenv('APP_ENV') === 'production') {
        throw new RuntimeException('Plaintext SMTP is forbidden in production');
    }

    $socket = @stream_socket_client("tcp://$host:$port", $errno, $errstr, 10);
    if ($socket === false) {
        throw new RuntimeException("SMTP connect failed: $errstr ($errno)");
    }
    stream_set_timeout($socket, 30);

    try {
        _kvazi_smtp_expect($socket, 220);

        $ehloHost = gethostname() ?: 'localhost';
        _kvazi_smtp_command($socket, "EHLO $ehloHost", 250);

        if ($tlsMode === 'starttls') {
            _kvazi_smtp_command($socket, 'STARTTLS', 220);
            $crypto = stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT | STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT);
            if ($crypto !== true) {
                throw new RuntimeException('STARTTLS crypto negotiation failed');
            }
            _kvazi_smtp_command($socket, "EHLO $ehloHost", 250);
        }

        // AUTH LOGIN
        _kvazi_smtp_command($socket, 'AUTH LOGIN', 334);
        _kvazi_smtp_command($socket, base64_encode($user), 334);
        _kvazi_smtp_command($socket, base64_encode($pass), 235);

        // Envelope
        $fromAddress = getenv('MAIL_FROM_ADDRESS') ?: '';
        _kvazi_smtp_command($socket, "MAIL FROM:<$fromAddress>", 250);
        _kvazi_smtp_command($socket, "RCPT TO:<$to>", 250);

        // DATA
        _kvazi_smtp_command($socket, 'DATA', 354);

        $date = gmdate('r');
        $headers  = "From: $from\r\n";
        $headers .= "To: $to\r\n";
        $headers .= "Subject: $subject\r\n";
        $headers .= "Date: $date\r\n";
        $headers .= "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
        $headers .= "Content-Transfer-Encoding: 8bit\r\n";

        // Dot-stuffing per RFC 5321 §4.5.2
        $body = str_replace("\n", "\r\n", str_replace("\r\n", "\n", $textBody));
        $body = preg_replace('/^\\./m', '..', $body);

        fwrite($socket, $headers . "\r\n" . $body . "\r\n.\r\n");
        _kvazi_smtp_expect($socket, 250);

        _kvazi_smtp_command($socket, 'QUIT', 221);
    } finally {
        @fclose($socket);
    }
}

/**
 * Send an SMTP command and expect a specific reply code.
 *
 * @throws RuntimeException
 */
function _kvazi_smtp_command($socket, string $command, int $expectedCode): string
{
    fwrite($socket, $command . "\r\n");
    return _kvazi_smtp_expect($socket, $expectedCode);
}

/**
 * Read an SMTP reply (possibly multiline) and assert the code.
 *
 * @throws RuntimeException
 */
function _kvazi_smtp_expect($socket, int $expectedCode): string
{
    $response = '';
    while (true) {
        $line = fgets($socket, 4096);
        if ($line === false) {
            throw new RuntimeException("SMTP read failed (expected $expectedCode), got so far: $response");
        }
        $response .= $line;
        // Multiline replies: "250-..." continues, "250 ..." is final.
        if (isset($line[3]) && $line[3] !== '-') {
            break;
        }
    }
    $code = (int)substr($response, 0, 3);
    if ($code !== $expectedCode) {
        throw new RuntimeException("SMTP expected $expectedCode, got $code: " . trim($response));
    }
    return $response;
}
