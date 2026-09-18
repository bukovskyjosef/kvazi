<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/mail.php';
require_once __DIR__ . '/includes/validator.php';
auth_session_start();

if (auth_user() !== null) {
    header('Location: /moje.php');
    exit;
}

$message        = '';
$challengeError = '';
$showForm       = true;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!auth_csrf_check()) {
        $message = 'Neplatný bezpečnostní token. Obnovte stránku a zkuste znovu.';
    } elseif (!is_string($_POST['email'] ?? '') || !is_string($_POST['challenge'] ?? '')) {
        http_response_code(400);
        $message = 'Neplatný formát požadavku.';
    } else {
        $challenge = $_POST['challenge'] ?? '';
        $challengeResult = auth_validate_recovery_challenge($challenge);

        if ($challengeResult !== true) {
            $challengeError = $challengeResult;
        } else {
            // Challenge passed — always show neutral message (anti-enumeration).
            $message  = 'Pokud váš email známe, odešleme vám odkaz pro obnovu hesla.';
            $showForm = false;

            $email = strtolower(trim($_POST['email'] ?? ''));
            if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
                try {
                    $pdo  = kvazi_db();
                    $stmt = $pdo->prepare(
                        'SELECT id FROM kvazi.user_account
                          WHERE lower(email) = lower(:e)
                          LIMIT 1'
                    );
                    $stmt->execute([':e' => $email]);
                    $row = $stmt->fetch();
                    if ($row !== false) {
                        $userId = (int)$row['id'];
                        $token  = auth_try_recovery_request($userId);
                        if ($token !== null) {
                            $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
                            $host   = $_SERVER['HTTP_HOST'] ?? 'localhost';
                            $url    = $scheme . '://' . $host . '/reset-password.php?token=' . $token;

                            try {
                                kvazi_mail_send(
                                    $email,
                                    'Obnova hesla — Nejdelší kvazivěta',
                                    "Dobrý den,\n\npro nastavení nového hesla klikněte na následující odkaz:\n\n$url\n\nOdkaz je platný 24 hodin. Pokud jste o obnovu hesla nežádali, tento e-mail ignorujte.\n\nNejdelší kvazivěta"
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
}

$activePage = 'login';
$csrf = auth_csrf_token();
?>
<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Zapomenuté heslo — Nejdelší kvazivěta</title>
  <link rel="stylesheet" href="/css/site.css">
</head>
<body>

<?php include __DIR__ . '/includes/nav.php'; ?>

<main class="container-sm page-body" style="padding-top:72px">
  <div class="form-card">
    <h1 class="form-title">Obnova hesla</h1>

    <?php if ($message): ?>
      <div class="alert alert-success" style="margin-bottom:20px"><?= htmlspecialchars($message) ?></div>
    <?php endif; ?>

    <?php if ($showForm): ?>
      <p class="form-sub">Zadejte svůj e-mail a dvouslovnou kvazivětu jako ověřovací výzvu.</p>

      <?php if ($challengeError): ?>
        <div class="alert alert-warning" style="margin-bottom:20px"><?= htmlspecialchars($challengeError) ?></div>
      <?php endif; ?>

      <form method="post" novalidate>
        <input type="hidden" name="csrf" value="<?= htmlspecialchars($csrf) ?>">

        <div class="fld-f">
          <label for="email">E-mail</label>
          <input type="email" id="email" name="email"
                 autocomplete="email"
                 value="<?= htmlspecialchars(is_string($_POST['email'] ?? '') ? ($_POST['email'] ?? '') : '') ?>"
                 placeholder="vas@email.cz">
        </div>
        <div class="fld-f">
          <label for="challenge">Dvouslovná kvazivěta</label>
          <input type="text" id="challenge" name="challenge"
                 autocomplete="off"
                 value="<?= htmlspecialchars(is_string($_POST['challenge'] ?? '') ? ($_POST['challenge'] ?? '') : '') ?>"
                 placeholder="kvazi kvazi.">
        </div>

        <div style="margin-top:28px">
          <button type="submit" class="btn btn-accent"
                  style="width:100%;justify-content:center;border-radius:10px;font-size:15px">
            Odeslat odkaz pro obnovu hesla
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
