<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/auth.php';
auth_session_start();

$success = false;
$error   = '';
$token   = $_GET['token'] ?? $_POST['token'] ?? '';

if (!is_string($token) || !preg_match('/^[a-f0-9]{64}$/', $token)) {
    $error = 'Neplatný odkaz pro obnovu hesla.';
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $error === '') {
    if (!auth_csrf_check()) {
        $error = 'Neplatný bezpečnostní token. Obnovte stránku a zkuste znovu.';
    } elseif (!is_string($_POST['password'] ?? '') || !is_string($_POST['password2'] ?? '')) {
        http_response_code(400);
        $error = 'Neplatný formát požadavku.';
    } else {
        $result = auth_reset_password_with_token(
            $token,
            $_POST['password'] ?? '',
            $_POST['password2'] ?? ''
        );
        if ($result === true) {
            $success = true;
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
  <title>Nastavení nového hesla — Nejdelší kvazivěta</title>
  <link rel="stylesheet" href="/css/site.css">
</head>
<body>

<?php include __DIR__ . '/includes/nav.php'; ?>

<main class="container-sm page-body" style="padding-top:72px">
  <div class="form-card">
    <h1 class="form-title">Nové heslo</h1>

    <?php if ($success): ?>
      <div class="alert alert-success" style="margin-bottom:20px">Heslo bylo úspěšně změněno. Nyní se můžete přihlásit.</div>
      <p class="form-footer" style="margin-top:24px">
        <a href="/login.php">Přihlásit se</a>
      </p>
    <?php elseif ($error && ($_SERVER['REQUEST_METHOD'] !== 'POST' || !preg_match('/^[a-f0-9]{64}$/', $token))): ?>
      <div class="alert alert-warning" style="margin-bottom:20px"><?= htmlspecialchars($error) ?></div>
      <p class="form-footer" style="margin-top:24px">
        <a href="/forgot-password.php">Požádat o nový odkaz</a> · <a href="/login.php">Přihlásit se</a>
      </p>
    <?php else: ?>
      <?php if ($error): ?>
        <div class="alert alert-warning" style="margin-bottom:20px"><?= htmlspecialchars($error) ?></div>
      <?php endif; ?>

      <p class="form-sub">Zadejte nové heslo pro svůj účet.</p>

      <form method="post" novalidate>
        <input type="hidden" name="csrf" value="<?= htmlspecialchars($csrf) ?>">
        <input type="hidden" name="token" value="<?= htmlspecialchars($token) ?>">

        <div class="fld-f">
          <label for="password">Nové heslo</label>
          <input type="password" id="password" name="password"
                 autocomplete="new-password" placeholder="alespoň 8 znaků">
        </div>
        <div class="fld-f">
          <label for="password2">Nové heslo znovu</label>
          <input type="password" id="password2" name="password2"
                 autocomplete="new-password" placeholder="••••••••">
        </div>

        <div style="margin-top:28px">
          <button type="submit" class="btn btn-accent"
                  style="width:100%;justify-content:center;border-radius:10px;font-size:15px">
            Nastavit nové heslo
          </button>
        </div>
      </form>

      <p class="form-footer" style="margin-top:24px">
        <a href="/login.php">Přihlásit se</a>
      </p>
    <?php endif; ?>
  </div>
</main>

<?php include __DIR__ . '/includes/footer.php'; ?>
</body>
</html>
