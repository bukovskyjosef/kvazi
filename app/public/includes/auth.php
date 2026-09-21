<?php
declare(strict_types=1);

// Public responses never contain PHP warnings, paths or stack traces.
ini_set('display_errors', '0');
ini_set('log_errors', '1');

/**
 * Auth helpers for Nejdelší kvazivěta.
 * Include at the top of every page that needs auth state.
 * Call auth_session_start() before any output.
 */

function auth_response_headers(): void {
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: same-origin');
    header('X-Frame-Options: DENY');
}

/** Preserve a local URL, rejecting browser authority changes and encoded controls. */
function auth_safe_internal_return_path(mixed $value): string {
    if (!is_string($value)) return '/moje.php';
    $decoded = $value;
    for ($i = 0; $i < 8; $i++) {
        if (!preg_match('~\A/[A-Za-z0-9_-]~', $decoded)
            || preg_match('~[\x00-\x20\x7f\\\\]~', $decoded)) return '/moje.php';
        $next = rawurldecode($decoded);
        if ($next === $decoded) return $value;
        $decoded = $next;
    }
    return '/moje.php';
}

/** Small byte-based IPv4/IPv6 CIDR match; malformed entries never grant trust. */
function auth_ip_in_cidr(string $ip, string $cidr): bool {
    $parts = explode('/', $cidr);
    if (count($parts) !== 2 || !filter_var($ip, FILTER_VALIDATE_IP)
        || !filter_var($parts[0], FILTER_VALIDATE_IP) || !preg_match('/\A[0-9]{1,3}\z/', $parts[1])) return false;
    $address = inet_pton($ip);
    $network = inet_pton($parts[0]);
    $bits = (int)$parts[1];
    if (strlen($address) !== strlen($network) || $bits > strlen($address) * 8) return false;
    $bytes = intdiv($bits, 8);
    if (substr($address, 0, $bytes) !== substr($network, 0, $bytes)) return false;
    $remaining = $bits % 8;
    return $remaining === 0 || ((ord($address[$bytes]) ^ ord($network[$bytes])) & (255 << (8 - $remaining))) === 0;
}

/** Trust only the immediate configured proxy and one CF-Connecting-IP value. */
function auth_client_ip(): string {
    $remote = $_SERVER['REMOTE_ADDR'] ?? '';
    if (!is_string($remote) || !filter_var($remote, FILTER_VALIDATE_IP)) return 'local';
    $remote = inet_ntop(inet_pton($remote));
    foreach (explode(',', getenv('TRUSTED_PROXY_CIDRS') ?: '') as $cidr) {
        if (!auth_ip_in_cidr($remote, trim($cidr))) continue;
        $client = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? '';
        return is_string($client) && filter_var($client, FILTER_VALIDATE_IP)
            ? inet_ntop(inet_pton($client)) : $remote;
    }
    return $remote;
}

function auth_session_start(): void {
    if (session_status() !== PHP_SESSION_NONE) return;
    auth_response_headers();
    $secure = getenv('AUTH_COOKIE_SECURE') === '1' || (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
    ini_set('session.cookie_httponly', '1');
    ini_set('session.cookie_samesite', 'Lax');
    ini_set('session.cookie_secure', $secure ? '1' : '0');
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.gc_maxlifetime', '7200');
    session_start();
    // Absolute two-hour lifetime, enforced server-side regardless of PHP GC.
    if (isset($_SESSION['started_at']) && time() - $_SESSION['started_at'] >= 7200) {
        $_SESSION = [];
        session_regenerate_id(true);
    }
    $_SESSION['started_at'] ??= time();
}

function kvazi_db(): PDO {
    static $pdo = null;
    if ($pdo !== null) return $pdo;
    $dsn = sprintf(
        'pgsql:host=%s;port=%s;dbname=%s',
        getenv('DB_HOST') ?: 'db',
        getenv('DB_PORT') ?: '5432',
        getenv('DB_NAME') ?: 'kvazi'
    );
    $pdo = new PDO($dsn, getenv('DB_USER') ?: 'kvazi', getenv('DB_PASSWORD') ?: 'kvazi', [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    return $pdo;
}

/** Returns current user array ['id','username','email','role'] or null. */
function auth_user(): ?array {
    auth_session_start();
    return $_SESSION['auth_user'] ?? null;
}

function auth_is_admin(): bool {
    $user = auth_user();
    if ($user === null || ($user['role'] ?? '') !== 'ADMIN') return false;
    // Recheck persisted role so revocation takes effect in an existing session.
    $stmt = kvazi_db()->prepare('SELECT role FROM kvazi.user_account WHERE id = :id');
    $stmt->execute([':id' => $user['id']]);
    return $stmt->fetchColumn() === 'ADMIN';
}

/** Reusable ADMIN gate for future pages and JSON APIs. */
function auth_require_admin(): void {
    if (!auth_is_admin()) {
        http_response_code(403);
        exit;
    }
}

/** Redirect to login if not authenticated. */
function auth_require(string $returnTo = ''): void {
    if (auth_user() === null) {
        $qs = $returnTo ? '?return=' . urlencode(auth_safe_internal_return_path($returnTo)) : '';
        header('Location: /login.php' . $qs);
        exit;
    }
}

function auth_csrf_token(): string {
    auth_session_start();
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf'];
}

function auth_csrf_check(): bool {
    $token = $_POST['csrf'] ?? '';
    return is_string($token) && auth_csrf_check_value($token);
}

/** Check a raw CSRF token value (used by JSON API endpoints). */
function auth_csrf_check_value(string $value): bool {
    return $value !== '' && hash_equals(auth_csrf_token(), $value);
}

/**
 * Attempt login with email or username + password.
 * Returns user array on success, or a Czech error string on failure.
 */
function auth_login(string $identifier, string $password): array|string {
    if ($identifier === '' || $password === '') {
        return 'Vyplňte e-mail i heslo.';
    }
    try {
        $pdo  = kvazi_db();
        // Atomic attempt reservation prevents parallel failed logins bypassing
        // the ten-attempt / fifteen-minute window. Forwarded IP requires explicit trust.
        $remote = auth_client_ip();
        $pdo->exec("DELETE FROM kvazi.login_throttle WHERE window_started_at < now() - interval '1 day'");
        $limit = $pdo->prepare("INSERT INTO kvazi.login_throttle (remote_address, failures)
            VALUES (:remote, 1) ON CONFLICT (remote_address) DO UPDATE SET
            failures = CASE WHEN login_throttle.window_started_at <= now() - interval '15 minutes' THEN 1 ELSE least(login_throttle.failures + 1, 11) END,
            window_started_at = CASE WHEN login_throttle.window_started_at <= now() - interval '15 minutes' THEN now() ELSE login_throttle.window_started_at END
            RETURNING failures");
        $limit->execute([':remote' => $remote]);
        if ((int)$limit->fetchColumn() > 10) return 'Příliš mnoho pokusů. Zkuste přihlášení později.';
        $stmt = $pdo->prepare(
            'SELECT id, username, email, password_hash, role, email_verified_at
               FROM kvazi.user_account
              WHERE lower(email) = lower(:id) OR lower(username) = lower(:id)
              LIMIT 1'
        );
        $stmt->execute([':id' => trim($identifier)]);
        $row = $stmt->fetch();
    } catch (Throwable) {
        return 'Chyba databáze. Zkuste to znovu.';
    }

    // Dummy hash is not an account credential; unknown identifiers pay the same
    // bcrypt work as known ones, without confirming account existence.
    $hash = $row === false ? '$2y$12$ayl3x4QCZ.ihKqvdkMnsAexYrEwzm2GEkmp.WYFWKJ7TL330bUp8y' : $row['password_hash'];
    $passwordOk = password_verify($password, $hash);
    if ($row === false || !$passwordOk) {
        return 'Nesprávný e-mail/uživatelské jméno nebo heslo.';
    }

    if ($row['email_verified_at'] === null) {
        return 'E-mail nebyl ověřen. Zkontrolujte svou e-mailovou schránku nebo použijte opětovné zaslání.';
    }

    auth_session_start();
    session_regenerate_id(true);
    $_SESSION['started_at'] = time();
    unset($_SESSION['csrf']);
    $pdo->prepare('DELETE FROM kvazi.login_throttle WHERE remote_address = :remote')->execute([':remote' => $remote]);
    $user = [
        'id'       => (int)$row['id'],
        'username' => $row['username'],
        'email'    => $row['email'],
        'role'     => $row['role'],
    ];
    $_SESSION['auth_user'] = $user;

    // Rehash if needed (cost upgrade etc.)
    if (password_needs_rehash($row['password_hash'], PASSWORD_BCRYPT, ['cost' => 12])) {
        try {
            $pdo->prepare('UPDATE kvazi.user_account SET password_hash = :h WHERE id = :id')
                ->execute([':h' => password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]),
                           ':id' => $row['id']]);
        } catch (Throwable) { /* non-fatal */ }
    }

    return $user;
}

function auth_logout(): void {
    auth_session_start();
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', ['expires' => time() - 42000,
            'path' => $p['path'], 'domain' => $p['domain'], 'secure' => $p['secure'],
            'httponly' => $p['httponly'], 'samesite' => $p['samesite']]);
    }
    session_destroy();
}

/**
 * Register a new USER account.
 * Returns true on success, Czech error string on failure.
 */
function auth_register(string $username, string $email, string $password, string $password2): true|string {
    $username = trim($username);
    $email    = strtolower(trim($email));

    if (!preg_match('/^[A-Za-z0-9_-]{3,30}$/', $username)) {
        return 'Uživatelské jméno: 3–30 znaků, povolena jsou písmena A–Z/a–z, číslice, podtržítko a pomlčka.';
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return 'Zadejte platný e-mail.';
    }
    if (mb_strlen($password) < 8) {
        return 'Heslo musí mít alespoň 8 znaků.';
    }
    if ($password !== $password2) {
        return 'Hesla se neshodují.';
    }

    try {
        $pdo  = kvazi_db();
        $stmt = $pdo->prepare(
            'SELECT id FROM kvazi.user_account
              WHERE lower(email) = lower(:e) OR lower(username) = lower(:u)
              LIMIT 1'
        );
        $stmt->execute([':e' => $email, ':u' => $username]);
        if ($stmt->fetch()) {
            return 'E-mail nebo uživatelské jméno je již obsazeno.';
        }

        $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
        $pdo->prepare(
            "INSERT INTO kvazi.user_account (username, email, password_hash, role)
             VALUES (:u, :e, :h, 'USER')"
        )->execute([':u' => $username, ':e' => $email, ':h' => $hash]);

        return true;
    } catch (Throwable) {
        return 'Chyba databáze. Zkuste to znovu.';
    }
}

/**
 * Lazy cleanup of used/expired auth tokens past the 7-day retention window.
 * Called opportunistically from token-generating functions; failures are non-fatal.
 */
function auth_cleanup_expired_tokens(): void {
    try {
        kvazi_db()->exec(
            "DELETE FROM kvazi.auth_token
              WHERE (used_at IS NOT NULL AND used_at < now() - interval '7 days')
                 OR (used_at IS NULL AND expires_at < now() - interval '7 days')"
        );
    } catch (\Throwable) {
        // Non-fatal: cleanup is best-effort.
    }
}

/**
 * Generate a verification token for a user.
 * Invalidates prior unused tokens for same user+purpose.
 * Returns the raw hex token (64 chars) for inclusion in the URL.
 */
function auth_generate_verification_token(int $userId): string {
    auth_cleanup_expired_tokens();
    $raw  = bin2hex(random_bytes(32));
    $hash = hash('sha256', $raw);
    $pdo  = kvazi_db();
    // Invalidate prior unused tokens for same user+purpose.
    $pdo->prepare(
        "UPDATE kvazi.auth_token SET used_at = now()
          WHERE user_id = :uid AND purpose = 'email_verification' AND used_at IS NULL"
    )->execute([':uid' => $userId]);
    $pdo->prepare(
        "INSERT INTO kvazi.auth_token (user_id, purpose, token_hash, expires_at)
         VALUES (:uid, 'email_verification', :hash, now() + interval '24 hours')"
    )->execute([':uid' => $userId, ':hash' => $hash]);
    return $raw;
}

/**
 * Verify an email token.
 * Returns true on success, or a Czech error string on failure.
 */
function auth_verify_email_token(string $rawToken): true|string {
    if (!preg_match('/^[a-f0-9]{64}$/', $rawToken)) {
        return 'Neplatný ověřovací odkaz.';
    }
    $hash = hash('sha256', $rawToken);
    try {
        $pdo = kvazi_db();
        $pdo->beginTransaction();
        $stmt = $pdo->prepare(
            "SELECT t.id, t.user_id FROM kvazi.auth_token t
              WHERE t.token_hash = :hash AND t.purpose = 'email_verification'
                AND t.used_at IS NULL AND t.expires_at > now()
              FOR UPDATE"
        );
        $stmt->execute([':hash' => $hash]);
        $row = $stmt->fetch();
        if ($row === false) {
            $pdo->rollBack();
            return 'Ověřovací odkaz je neplatný nebo vypršel. Požádejte o nové zaslání.';
        }
        $pdo->prepare('UPDATE kvazi.auth_token SET used_at = now() WHERE id = :id')
            ->execute([':id' => $row['id']]);
        $pdo->prepare('UPDATE kvazi.user_account SET email_verified_at = now() WHERE id = :uid AND email_verified_at IS NULL')
            ->execute([':uid' => $row['user_id']]);
        $pdo->commit();
        return true;
    } catch (Throwable) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        return 'Chyba databáze. Zkuste to znovu.';
    }
}

// ─────────────────────────────────────────────────────────
// Password recovery (#105)
// ─────────────────────────────────────────────────────────

/**
 * Validate the two-word surface challenge for password recovery.
 *
 * Reuses the canonical KvaziValidator Phase 1 surface validation:
 * NFC, charset, length/single-token exceptions, motif/token boundary, prefix.
 * No morphology, syntax, catalog or deep validation.
 *
 * Input: raw user text. Must contain exactly two word tokens and one
 * terminal punctuation mark (. ? !).
 *
 * Returns true on success, or a Czech error string on failure.
 */
function auth_validate_recovery_challenge(string $input): true|string {
    $input = trim($input);
    if ($input === '') {
        return 'Zadejte dvouslovnou kvazivětu.';
    }

    // Terminal punctuation is required and determines sentence type.
    $lastChar = mb_substr($input, -1, 1, 'UTF-8');
    $punctuation = ['.' => 'declarative', '?' => 'interrogative', '!' => 'imperative'];
    if (!isset($punctuation[$lastChar])) {
        return 'Dvouslovná věta musí končit tečkou, otazníkem nebo vykřičníkem.';
    }

    // Strip terminal punctuation to get the word content.
    $words = mb_substr($input, 0, mb_strlen($input, 'UTF-8') - 1, 'UTF-8');
    $words = trim($words);
    if ($words === '') {
        return 'Zadejte dvouslovnou kvazivětu.';
    }

    // Split on whitespace into tokens.
    $tokens = preg_split('/\s+/u', $words);
    if (count($tokens) !== 2) {
        return 'Challenge musí obsahovat právě dvě slova a závěrečnou interpunkci.';
    }

    // Build token array for the canonical validator.
    $tokenArray = [];
    foreach ($tokens as $i => $surface) {
        $tokenArray[] = [
            'id'      => 't' . ($i + 1),
            'surface' => $surface,
        ];
    }

    // Load the canonical validator and run Phase 1 surface validation.
    $validator = kvazi_load_validator(dirname(__DIR__, 2));
    $result = $validator->validateTokenSequencePublic($tokenArray);

    if (!$result['ok']) {
        return 'Dvouslovná věta neprošla povrchovou kontrolou.';
    }

    return true;
}

/**
 * Atomically check recovery throttle and generate a recovery token.
 *
 * Uses SELECT ... FOR UPDATE on the user row to serialize concurrent
 * recovery requests. Throttle: max 3 tokens per hour per user.
 *
 * Returns the raw hex token on success, or null if throttled.
 */
function auth_try_recovery_request(int $userId): ?string {
    auth_cleanup_expired_tokens();
    $pdo = kvazi_db();
    $pdo->beginTransaction();
    try {
        $pdo->prepare('SELECT id FROM kvazi.user_account WHERE id = :uid FOR UPDATE')
            ->execute([':uid' => $userId]);

        $stmt = $pdo->prepare(
            "SELECT count(*) FROM kvazi.auth_token
              WHERE user_id = :uid AND purpose = 'password_recovery'
                AND created_at > now() - interval '1 hour'"
        );
        $stmt->execute([':uid' => $userId]);
        if ((int)$stmt->fetchColumn() >= 3) {
            $pdo->rollBack();
            return null;
        }

        $raw  = bin2hex(random_bytes(32));
        $hash = hash('sha256', $raw);
        // Invalidate prior unused recovery tokens.
        $pdo->prepare(
            "UPDATE kvazi.auth_token SET used_at = now()
              WHERE user_id = :uid AND purpose = 'password_recovery' AND used_at IS NULL"
        )->execute([':uid' => $userId]);
        $pdo->prepare(
            "INSERT INTO kvazi.auth_token (user_id, purpose, token_hash, expires_at)
             VALUES (:uid, 'password_recovery', :hash, now() + interval '24 hours')"
        )->execute([':uid' => $userId, ':hash' => $hash]);

        $pdo->commit();
        return $raw;
    } catch (Throwable) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        return null;
    }
}

/**
 * Atomically consume a password recovery token and reset the password.
 *
 * Returns true on success, or a Czech error string on failure.
 * Does NOT change email_verified_at.
 */
function auth_reset_password_with_token(string $rawToken, string $newPassword, string $newPassword2): true|string {
    if (!preg_match('/^[a-f0-9]{64}$/', $rawToken)) {
        return 'Neplatný odkaz pro obnovu hesla.';
    }
    if (mb_strlen($newPassword) < 8) {
        return 'Heslo musí mít alespoň 8 znaků.';
    }
    if ($newPassword !== $newPassword2) {
        return 'Hesla se neshodují.';
    }

    $hash = hash('sha256', $rawToken);
    try {
        $pdo = kvazi_db();
        $pdo->beginTransaction();
        $stmt = $pdo->prepare(
            "SELECT t.id, t.user_id FROM kvazi.auth_token t
              WHERE t.token_hash = :hash AND t.purpose = 'password_recovery'
                AND t.used_at IS NULL AND t.expires_at > now()
              FOR UPDATE"
        );
        $stmt->execute([':hash' => $hash]);
        $row = $stmt->fetch();
        if ($row === false) {
            $pdo->rollBack();
            return 'Odkaz pro obnovu hesla je neplatný nebo vypršel.';
        }
        $pdo->prepare('UPDATE kvazi.auth_token SET used_at = now() WHERE id = :id')
            ->execute([':id' => $row['id']]);
        $passwordHash = password_hash($newPassword, PASSWORD_BCRYPT, ['cost' => 12]);
        $pdo->prepare('UPDATE kvazi.user_account SET password_hash = :h WHERE id = :uid')
            ->execute([':h' => $passwordHash, ':uid' => $row['user_id']]);
        $pdo->commit();
        return true;
    } catch (Throwable) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        return 'Chyba databáze. Zkuste to znovu.';
    }
}

/**
 * Atomically check resend throttle and generate a verification token.
 *
 * Uses SELECT ... FOR UPDATE on the user row to serialize concurrent
 * resend requests for the same account, then counts recent tokens
 * inside the same transaction before inserting. This prevents two
 * parallel requests from both passing the throttle check.
 *
 * Returns the raw hex token on success, or null if throttled.
 */
function auth_try_resend_verification_token(int $userId): ?string {
    auth_cleanup_expired_tokens();
    $pdo = kvazi_db();
    $pdo->beginTransaction();
    try {
        // Lock the user row to serialize concurrent resend requests.
        $pdo->prepare('SELECT id FROM kvazi.user_account WHERE id = :uid FOR UPDATE')
            ->execute([':uid' => $userId]);

        // Count recent tokens while holding the lock.
        $stmt = $pdo->prepare(
            "SELECT count(*) FROM kvazi.auth_token
              WHERE user_id = :uid AND purpose = 'email_verification'
                AND created_at > now() - interval '1 hour'"
        );
        $stmt->execute([':uid' => $userId]);
        if ((int)$stmt->fetchColumn() >= 3) {
            $pdo->rollBack();
            return null;
        }

        // Invalidate prior unused tokens and insert the new one, still under lock.
        $raw  = bin2hex(random_bytes(32));
        $hash = hash('sha256', $raw);
        $pdo->prepare(
            "UPDATE kvazi.auth_token SET used_at = now()
              WHERE user_id = :uid AND purpose = 'email_verification' AND used_at IS NULL"
        )->execute([':uid' => $userId]);
        $pdo->prepare(
            "INSERT INTO kvazi.auth_token (user_id, purpose, token_hash, expires_at)
             VALUES (:uid, 'email_verification', :hash, now() + interval '24 hours')"
        )->execute([':uid' => $userId, ':hash' => $hash]);

        $pdo->commit();
        return $raw;
    } catch (Throwable) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        return null;
    }
}
