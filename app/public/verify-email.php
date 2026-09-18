<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/auth.php';
auth_session_start();

$success = false;
$error   = '';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    header('Allow: GET');
    exit;
}

$token = $_GET['token'] ?? '';
if (!is_string($token) || $token === '') {
    $error = 'Chybí ověřovací token.';
} else {
    $result = auth_verify_email_token($token);
    if ($result === true) {
        $success = true;
    } else {
        $error = $result;
    }
}

$activePage = 'login';
?>
<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Ověření e-mailu — Nejdelší kvazivěta</title>
  <link rel="stylesheet" href="/css/site.css">
</head>
<body>

<?php include __DIR__ . '/includes/nav.php'; ?>

<main class="container-sm page-body" style="padding-top:72px">
  <div class="form-card">
    <h1 class="form-title">Ověření e-mailu</h1>

    <?php if ($success): ?>
      <div class="alert alert-success" style="margin-bottom:20px">E-mail byl úspěšně ověřen. Nyní se můžete přihlásit.</div>
      <p class="form-footer" style="margin-top:24px">
        <a href="/login.php">Přihlásit se</a>
      </p>
    <?php else: ?>
      <div class="alert alert-warning" style="margin-bottom:20px"><?= htmlspecialchars($error) ?></div>
      <p class="form-footer" style="margin-top:24px">
        <a href="/resend-verification.php">Znovu zaslat ověřovací e-mail</a>
      </p>
    <?php endif; ?>
  </div>
</main>

<?php include __DIR__ . '/includes/footer.php'; ?>
</body>
</html>
