<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/mail.php';
auth_session_start();

$message = '';
$showForm = true;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!auth_csrf_check()) {
        $message = 'Neplatný bezpečnostní token. Obnovte stránku a zkuste znovu.';
    } elseif (!is_string($_POST['email'] ?? '')) {
        http_response_code(400);
        $message = 'Neplatný formát e-mailu.';
    } else {
        $email = strtolower(trim($_POST['email'] ?? ''));
        // Always show neutral message regardless of outcome (anti-enumeration).
        $message = 'Pokud je tento e-mail registrován a dosud neověřen, odeslali jsme nový ověřovací odkaz.';
        $showForm = false;

        if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
            try {
                $pdo  = kvazi_db();
                $stmt = $pdo->prepare(
                    'SELECT id FROM kvazi.user_account
                      WHERE lower(email) = lower(:e) AND email_verified_at IS NULL
                        AND deleted_at IS NULL
                      LIMIT 1'
                );
                $stmt->execute([':e' => $email]);
                $row = $stmt->fetch();
                if ($row !== false) {
                    $userId = (int)$row['id'];
                    $token  = auth_try_resend_verification_token($userId);
                    if ($token !== null) {
                        $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
                        $host   = $_SERVER['HTTP_HOST'] ?? 'localhost';
                        $url    = $scheme . '://' . $host . '/verify-email.php?token=' . $token;

                        try {
                            kvazi_mail_send(
                                $email,
                                'Ověření e-mailu — Nejdelší kvazivěta',
                                "Dobrý den,\n\npro dokončení registrace ověřte svůj e-mail kliknutím na následující odkaz:\n\n$url\n\nOdkaz je platný 24 hodin.\n\nPokud jste se neregistrovali, tento e-mail ignorujte.\n\nNejdelší kvazivěta"
                            );
                        } catch (Throwable) {
                            // Silent — neutral message already set.
                        }
                    }
                }
            } catch (Throwable) {
                // Silent — neutral message already set.
            }
        }
    }
}

$activePage = 'login';
$csrf = auth_csrf_token();
?>
<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Opětovné zaslání ověřovacího e-mailu — Nejdelší kvazivěta</title>
  <link rel="stylesheet" href="/css/site.css">
</head>
<body>

<?php include __DIR__ . '/includes/nav.php'; ?>

<main class="container-sm page-body" style="padding-top:72px">
  <div class="form-card">
    <h1 class="form-title">Ověřovací e-mail</h1>

    <?php if ($message): ?>
      <div class="alert alert-success" style="margin-bottom:20px"><?= htmlspecialchars($message) ?></div>
    <?php endif; ?>

    <?php if ($showForm): ?>
      <p class="form-sub">Zadejte svůj e-mail a my vám zašleme nový ověřovací odkaz.</p>

      <form method="post" novalidate>
        <input type="hidden" name="csrf" value="<?= htmlspecialchars($csrf) ?>">

        <div class="fld-f">
          <label for="email">E-mail</label>
          <input type="email" id="email" name="email"
                 autocomplete="email"
                 placeholder="vas@email.cz">
        </div>

        <div style="margin-top:28px">
          <button type="submit" class="btn btn-accent"
                  style="width:100%;justify-content:center;border-radius:10px;font-size:15px">
            Zaslat ověřovací e-mail
          </button>
        </div>
      </form>
    <?php endif; ?>

    <p class="form-footer" style="margin-top:24px">
      <a href="/login.php">Přihlásit se</a> · <a href="/register.php">Zaregistrovat se</a>
    </p>
  </div>
</main>

<?php include __DIR__ . '/includes/footer.php'; ?>
</body>
</html>
