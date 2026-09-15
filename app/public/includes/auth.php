<?php
declare(strict_types=1);

/**
 * Auth helpers for Nejdelší kvazivěta.
 * Include at the top of every page that needs auth state.
 * Call auth_session_start() before any output.
 */

function auth_session_start(): void {
    if (session_status() !== PHP_SESSION_NONE) return;
    ini_set('session.cookie_httponly', '1');
    ini_set('session.cookie_samesite', 'Lax');
    ini_set('session.use_strict_mode', '1');
    session_start();
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
    return (auth_user()['role'] ?? '') === 'ADMIN';
}

/** Redirect to login if not authenticated. */
function auth_require(string $returnTo = ''): void {
    if (auth_user() === null) {
        $qs = $returnTo ? '?return=' . urlencode($returnTo) : '';
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
    return $token !== '' && hash_equals(auth_csrf_token(), $token);
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

    if ($row === false || !password_verify($password, $row['password_hash'])) {
        return 'Nesprávný e-mail/uživatelské jméno nebo heslo.';
    }

    auth_session_start();
    session_regenerate_id(true);
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
        setcookie(session_name(), '', time() - 42000,
            $p['path'], $p['domain'], $p['secure'], $p['httponly']);
    }
    session_destroy();
}

/**
 * Register a new USER account.
 * Returns true on success, Czech error string on failure.
 */
function auth_register(string $username, string $email, string $password, string $password2): true|string {
    $username = trim($username);
    $email    = trim($email);

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
