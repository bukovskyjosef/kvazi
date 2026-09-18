<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/auth.php';
auth_session_start();

// Already logged in → admin area
if (auth_user() !== null) {
    header('Location: /moje.php');
    exit;
}

$error  = '';
$return = auth_safe_internal_return_path($_GET['return'] ?? '');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!auth_csrf_check()) {
        $error = 'Neplatný bezpečnostní token. Obnovte stránku a zkuste znovu.';
    } elseif (!is_string($_POST['identifier'] ?? '') || !is_string($_POST['password'] ?? '')) {
        http_response_code(400);
        $error = 'Neplatný formát přihlašovacích údajů.';
    } else {
        $result = auth_login($_POST['identifier'] ?? '', $_POST['password'] ?? '');
        if (is_array($result)) {
            header('Location: ' . ($return ?: '/moje.php'));
            exit;
        }
        $error = $result;
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
  <title>Přihlášení — Nejdelší kvazivěta</title>
  <link rel="stylesheet" href="/css/site.css">
</head>
<body>

<?php include __DIR__ . '/includes/nav.php'; ?>

<main class="container-sm page-body" style="padding-top:72px">
  <div class="form-card">
    <h1 class="form-title">Přihlásit se</h1>
    <p class="form-sub">Přihlaste se ke svému soutěžnímu účtu.</p>

    <?php if ($error): ?>
      <div class="alert alert-warning" style="margin-bottom:20px"><?= htmlspecialchars($error) ?></div>
      <?php if (str_contains($error, 'ověřen')): ?>
        <p style="margin-bottom:20px"><a href="/resend-verification.php">Znovu zaslat ověřovací e-mail</a></p>
      <?php endif; ?>
    <?php endif; ?>

    <form method="post" novalidate>
      <input type="hidden" name="csrf" value="<?= htmlspecialchars($csrf) ?>">
      <?php if ($return): ?>
        <input type="hidden" name="return" value="<?= htmlspecialchars($return) ?>">
      <?php endif; ?>

      <div class="fld-f">
        <label for="identifier">E-mail nebo uživatelské jméno</label>
        <input type="text" id="identifier" name="identifier"
               autocomplete="username"
               value="<?= htmlspecialchars(is_string($_POST['identifier'] ?? '') ? ($_POST['identifier'] ?? '') : '') ?>"
               placeholder="vas@email.cz nebo uzivatelske-jmeno">
      </div>
      <div class="fld-f">
        <label for="password">Heslo</label>
        <input type="password" id="password" name="password"
               autocomplete="current-password" placeholder="••••••••">
      </div>

      <div style="margin-top:28px">
        <button type="submit" class="btn btn-accent"
                style="width:100%;justify-content:center;border-radius:10px;font-size:15px">
          Přihlásit se
        </button>
      </div>
    </form>

    <p class="form-footer" style="margin-top:24px">
      Nemáte účet? <a href="/register.php">Zaregistrovat se</a>
    </p>
  </div>
</main>

<?php include __DIR__ . '/includes/footer.php'; ?>
</body>
</html>
