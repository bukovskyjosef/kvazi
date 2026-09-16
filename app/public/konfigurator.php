<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/validator.php';
auth_session_start();
$activePage = 'konfigurator';
$csrf = auth_csrf_token();

// Resubmit pre-load: ?sentenceId=N restores the latest revision draft for editing.
// Only available when the sentence belongs to the logged-in user and was returned.
$resubmitJson = 'null';
$incomingSentenceId = isset($_GET['sentenceId']) ? (int)$_GET['sentenceId'] : null;
if ($incomingSentenceId && ($user = auth_user()) !== null) {
    try {
        $db = kvazi_db();
        // Load latest revision draft_json if the sentence was returned to this user
        $rs = $db->prepare(
            'SELECT sr.draft_json
               FROM kvazi.sentence s
               JOIN kvazi.sentence_revision sr
                 ON sr.sentence_id = s.id
                AND sr.revision_no = (
                        SELECT MAX(r2.revision_no)
                          FROM kvazi.sentence_revision r2
                         WHERE r2.sentence_id = s.id
                    )
              WHERE s.id = :sid AND s.user_id = :uid'
        );
        $rs->execute([':sid' => $incomingSentenceId, ':uid' => $user['id']]);
        $row = $rs->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            // Verify the latest admin decision for the latest revision is 'return'.
            // Scoped to revision_id so a return(rev1) cannot authorise rev3 once rev2 exists.
            $ad = $db->prepare(
                'SELECT action FROM kvazi.administrative_decision
                  WHERE revision_id = (
                      SELECT id FROM kvazi.sentence_revision
                       WHERE sentence_id = :sid
                       ORDER BY revision_no DESC LIMIT 1
                  )
                  ORDER BY decided_at DESC LIMIT 1'
            );
            $ad->execute([':sid' => $incomingSentenceId]);
            if ($ad->fetchColumn() === 'return') {
                $resubmitJson = json_encode([
                    'sentenceId' => $incomingSentenceId,
                    'draft'      => json_decode($row['draft_json'], true),
                ], JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT);
            }
        }
    } catch (Throwable) {
        // Fall through — fresh editor
    }
}
// Normative data inlined for browser JS — loaded from active rules release.
$normativeJson = '{}';
$appRoot = dirname(__DIR__);
try {
    $validator = kvazi_load_validator($appRoot);
    $normativeJson = json_encode($validator->getNormativeData(),
        JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT);
} catch (Throwable) {}
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
  <p class="notice">⚠︎ Pracovní verze konfigurátoru. Tlačítko „Odeslat přihlášku” odešle aktuální přihlášku na server a uloží její záznam k přihlášenému účtu; náhled JSON nic neodesílá. Automatická kontrola ověřuje jen deterministické části deklarace, jazykové posouzení probíhá až v review.</p>
  <section class="card" aria-labelledby="sentenceHeading">
    <div id="sentencePreview" class="sentence-preview"></div>
    <h2 id="sentenceHeading" class="card-header">Zadání věty</h2>
    <div class="card-body">
      <div id="sentenceFields"></div>
      <form id="insertForm">
        <div class="sentence-entry">
          <div id="tokens" aria-label="Slova věty"></div>
          <input id="newSurface" class="word-input" type="text" autocomplete="off"
                 spellcheck="false" aria-label="Nové slovo (bez mezer)"
                 aria-describedby="inputStatus" placeholder="Kvazivětu zadejte zde…">
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
    <p>Uznání či zamítnutí závisí na review rozhodčího; tato stránka provádí pouze mechanické kontroly.</p>
    <div class="actions" style="gap:10px;flex-wrap:wrap">
      <button id="submitButton" type="button" class="btn btn-accent" disabled>Odeslat přihlášku</button>
      <button id="previewButton" type="button" class="btn btn-ghost" style="font-size:12px;opacity:.7">Zobrazit náhled JSON (neodesílá)</button>
    </div>
    <div id="submitResult" style="margin-top:14px"></div>
    <div id="payload"></div>
  </div></section>
</main>

<script>window.__normative = <?= $normativeJson ?>;</script>
<script>window.__resubmit = <?= $resubmitJson ?>;</script>
<script type="module" src="/js/konfigurator/editor.mjs"></script>
<?php include __DIR__ . '/includes/footer.php'; ?>
</body>
</html>
