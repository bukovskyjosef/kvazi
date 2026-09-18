<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/mail.php';
auth_session_start();

if (auth_user() !== null) {
    header('Location: /');
    exit;
}

$error   = '';
$success = false;
$values  = ['username' => '', 'email' => ''];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!auth_csrf_check()) {
        $error = 'Neplatný bezpečnostní token. Obnovte stránku a zkuste znovu.';
    } elseif (count(array_filter(['username', 'email', 'password', 'password2'], fn($field) => !is_string($_POST[$field] ?? ''))) > 0) {
        http_response_code(400);
        $error = 'Neplatný formát registračních údajů.';
    } else {
        $values['username'] = trim($_POST['username'] ?? '');
        $values['email']    = trim($_POST['email'] ?? '');

        $result = auth_register(
            $values['username'],
            $values['email'],
            $_POST['password']  ?? '',
            $_POST['password2'] ?? ''
        );

        if ($result === true) {
            // Fetch user ID for verification token
            $stmt = kvazi_db()->prepare('SELECT id FROM kvazi.user_account WHERE lower(email) = lower(:e)');
            $stmt->execute([':e' => strtolower(trim($values['email']))]);
            $userId = (int)$stmt->fetchColumn();
            $token  = auth_generate_verification_token($userId);
            $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
            $host   = $_SERVER['HTTP_HOST'] ?? 'localhost';
            $url    = $scheme . '://' . $host . '/verify-email.php?token=' . $token;

            try {
                kvazi_mail_send(
                    strtolower(trim($values['email'])),
                    'Ověření e-mailu — Nejdelší kvazivěta',
                    "Dobrý den,\n\npro dokončení registrace ověřte svůj e-mail kliknutím na následující odkaz:\n\n$url\n\nOdkaz je platný 24 hodin.\n\nPokud jste se neregistrovali, tento e-mail ignorujte.\n\nNejdelší kvazivěta"
                );
                $success = true;
            } catch (Throwable) {
                $error = 'Účet byl vytvořen, ale odeslání ověřovacího e-mailu selhalo. Použijte opětovné zaslání.';
            }
        } else {
            $error = $result;
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
  <title>Registrace — Nejdelší kvazivěta</title>
  <link rel="stylesheet" href="/css/site.css">
</head>
<body>

<?php include __DIR__ . '/includes/nav.php'; ?>

<main class="container-sm page-body" style="padding-top:72px">
  <div class="form-card">
    <h1 class="form-title">Registrace</h1>

    <?php if ($success): ?>
      <div class="alert alert-success" style="margin-bottom:20px">Registrace proběhla úspěšně. Na váš e-mail jsme odeslali ověřovací odkaz. Zkontrolujte svou e-mailovou schránku.</div>
      <p class="form-footer" style="margin-top:24px">
        <a href="/login.php">Přihlásit se</a> · <a href="/resend-verification.php">Znovu zaslat ověřovací e-mail</a>
      </p>
    <?php else: ?>
      <p class="form-sub">Vytvořte si soutěžní účet. Po registraci vám zašleme ověřovací e-mail.</p>

      <?php if ($error): ?>
        <div class="alert alert-warning" style="margin-bottom:20px"><?= htmlspecialchars($error) ?></div>
        <?php if (str_contains($error, 'opětovné zaslání')): ?>
          <p style="margin-bottom:20px"><a href="/resend-verification.php">Znovu zaslat ověřovací e-mail</a></p>
        <?php endif; ?>
      <?php endif; ?>

      <form method="post" novalidate>
        <input type="hidden" name="csrf" value="<?= htmlspecialchars($csrf) ?>">

        <div class="fld-f">
          <label for="username">Uživatelské jméno</label>
          <input type="text" id="username" name="username"
                 autocomplete="username"
                 pattern="[A-Za-z0-9_\-]{3,30}"
                 value="<?= htmlspecialchars($values['username']) ?>"
                 placeholder="pouze A–Z, a–z, 0–9, _, - (3–30 znaků)">
        </div>
        <div class="fld-f">
          <label for="email">E-mail</label>
          <input type="email" id="email" name="email"
                 autocomplete="email"
                 value="<?= htmlspecialchars($values['email']) ?>"
                 placeholder="vas@email.cz">
        </div>
        <div class="fld-f">
          <label for="password">Heslo</label>
          <input type="password" id="password" name="password"
                 autocomplete="new-password" placeholder="alespoň 8 znaků">
        </div>
        <div class="fld-f">
          <label for="password2">Heslo znovu</label>
          <input type="password" id="password2" name="password2"
                 autocomplete="new-password" placeholder="••••••••">
        </div>

        <div style="margin-top:28px">
          <button type="submit" class="btn btn-accent"
                  style="width:100%;justify-content:center;border-radius:10px;font-size:15px">
            Vytvořit účet
          </button>
        </div>
      </form>

      <p class="form-footer" style="margin-top:24px">
        Už máte účet? <a href="/login.php">Přihlásit se</a>
      </p>
    <?php endif; ?>
  </div>
</main>

<?php include __DIR__ . '/includes/footer.php'; ?>
</body>
</html>
