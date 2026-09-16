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
    $pdo = new PDO($dsn, getenv('DB_USER') ?: 'kvazi', getenv('DB_PASS') ?: 'kvazi', [
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
        // the ten-attempt / fifteen-minute window. Never trust forwarded IP headers.
        $remote = $_SERVER['REMOTE_ADDR'] ?? 'local';
        $pdo->exec("DELETE FROM kvazi.login_throttle WHERE window_started_at < now() - interval '1 day'");
        $limit = $pdo->prepare("INSERT INTO kvazi.login_throttle (remote_address, failures)
            VALUES (:remote, 1) ON CONFLICT (remote_address) DO UPDATE SET
            failures = CASE WHEN login_throttle.window_started_at <= now() - interval '15 minutes' THEN 1 ELSE least(login_throttle.failures + 1, 11) END,
            window_started_at = CASE WHEN login_throttle.window_started_at <= now() - interval '15 minutes' THEN now() ELSE login_throttle.window_started_at END
            RETURNING failures");
        $limit->execute([':remote' => $remote]);
        if ((int)$limit->fetchColumn() > 10) return 'Příliš mnoho pokusů. Zkuste přihlášení později.';
        $stmt = $pdo->prepare(
            'SELECT id, username, email, password_hash, role
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
