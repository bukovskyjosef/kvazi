<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/auth.php';
auth_session_start();
$activePage = 'konfigurator';
$csrf = auth_csrf_token();
?>
<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Konfigurátor kvazivěty</title>
  <meta name="csrf" content="<?= htmlspecialchars($csrf) ?>">
  <link rel="stylesheet" href="/css/site.css">
  <script>(function(){var t=localStorage.getItem('kvazi-theme')||'2';document.documentElement.dataset.theme=t;document.write('<link id="themeLink" rel="stylesheet" href="/css/konfigurator-theme'+t+'.css">')})()</script>
</head>
<body>

<?php include __DIR__ . '/includes/nav.php'; ?>

<p id="liveStatus" role="status" aria-live="polite" aria-atomic="true"
   style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap"></p>

<main class="container" style="padding-top:20px;padding-bottom:60px">
  <p class="notice">⚠︎ Pracovní verze konfigurátoru. Tlačítko „Odeslat přihlášku“ odešle aktuální přihlášku na server a uloží její záznam k přihlášenému účtu; náhled JSON nic neodesílá. Automatická kontrola ověřuje jen deterministické části deklarace, jazykové posouzení probíhá až v review.</p>
  <section class="card" aria-labelledby="sentenceHeading">
    <div id="sentencePreview" class="sentence-preview"></div>
    <h2 id="sentenceHeading" class="card-header">Zadání věty</h2>
    <div class="card-body">
      <div id="sentenceFields"></div>
      <form id="insertForm">
        <div class="sentence-entry">
          <div id="tokens" aria-label="Slova věty"></div>
          <input id="newSurface" class="word-input" type="text" autocomplete="off"
                 spellcheck="false" aria-describedby="inputStatus" placeholder="Pište slova…">
        </div>
        <select id="insertPlace" hidden></select>
        <p id="inputStatus" role="status"></p>
      </form>
    </div>
  </section>
  <section id="editor" class="card" aria-label="Deklarace vybraného slova"></section>
  <section class="card" aria-labelledby="validationHeading">
    <h2 id="validationHeading" class="card-header">Kontrola deklarace</h2>
    <div id="validation" class="card-body"></div>
  </section>
  <section class="card"><div class="card-body">
    <p>Jazykové posouzení proběhne až po odeslání přihlášky; uznání či zamítnutí závisí na review rozhodčího.</p>
    <div class="actions" style="gap:10px;flex-wrap:wrap">
      <button id="submitButton" type="button" class="btn btn-accent" disabled>Odeslat přihlášku</button>
      <button id="previewButton" type="button" class="btn btn-ghost" style="font-size:12px;opacity:.7">Zobrazit náhled JSON (neodesílá)</button>
    </div>
    <div id="submitResult" style="margin-top:14px"></div>
    <div id="payload"></div>
  </div></section>
</main>

<script type="module" src="/js/konfigurator/editor.mjs"></script>
<?php include __DIR__ . '/includes/footer.php'; ?>
</body>
</html>
