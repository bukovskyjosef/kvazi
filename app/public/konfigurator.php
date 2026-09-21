<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/validator.php';
require_once __DIR__ . '/includes/workflow.php';
auth_session_start();
$activePage = 'konfigurator';
$csrf = auth_csrf_token();

// Resubmit pre-load: ?sentenceId=N restores the latest revision draft for editing.
// Only available when the sentence belongs to the logged-in user and was returned.
$resubmitJson = 'null';
$incomingSentenceId = isset($_GET['sentenceId']) ? (int)$_GET['sentenceId'] : null;
if (isset($_GET['sentenceId'])) {
    auth_require('/konfigurator.php?' . http_build_query($_GET));
    $user = auth_user();
    try {
        $db = kvazi_db();
        // Load latest revision draft_json if the sentence was returned to this user
        $rs = $db->prepare(
            'SELECT sr.draft_json, ad.action
               FROM kvazi.sentence s
               JOIN kvazi.sentence_revision sr
                 ON sr.sentence_id = s.id
                AND sr.revision_no = (
                        SELECT MAX(r2.revision_no)
                          FROM kvazi.sentence_revision r2
                         WHERE r2.sentence_id = s.id
                    )
               LEFT JOIN kvazi.administrative_decision ad ON ad.revision_id = sr.id
              WHERE s.id = :sid AND s.user_id = :uid'
        );
        $rs->execute([':sid' => $incomingSentenceId, ':uid' => $user['id']]);
        $row = $rs->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            // Draft and return authorization belong to the same exact revision
            // in one statement snapshot, even during concurrent resubmission.
            if ($row['action'] === 'return') {
                $resubmitJson = json_encode([
                    'sentenceId' => $incomingSentenceId,
                    'draft'      => json_decode($row['draft_json'], false, 512, JSON_THROW_ON_ERROR),
                ], JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT);
            } else { throw new KvaziReviewConflict('Preload vyžaduje latest returned revizi.'); }
        } else { throw new KvaziReviewNotFound('Věta nebyla nalezena.'); }
    } catch (Throwable $e) { kvazi_page_failure($e); }
}
// Normative data inlined for browser JS — loaded from active rules release.
$appRoot = dirname(__DIR__);
try {
    $validator = kvazi_load_validator($appRoot);
    $normativeJson = json_encode($validator->getNormativeData(),
        JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT | JSON_THROW_ON_ERROR);
} catch (Throwable) {
    http_response_code(503);
    header('Content-Type: text/html; charset=UTF-8');
    echo '<!DOCTYPE html><html lang="cs"><meta charset="UTF-8"><title>Pravidla nejsou dostupná</title>';
    echo '<p>Pravidla soutěže se nyní nepodařilo načíst.</p></html>';
    exit;
}
?>
<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Konfigurátor kvazivěty</title>
  <meta name="csrf" content="<?= htmlspecialchars($csrf) ?>">
  <link rel="stylesheet" href="/css/site.css">
  <link rel="stylesheet" href="/css/konfigurator-reward.css">
  <script>(function(){var t=localStorage.getItem('kvazi-theme')||'2';document.documentElement.dataset.theme=t;document.write('<link id="themeLink" rel="stylesheet" href="/css/konfigurator-theme'+t+'.css">')})()</script>
</head>
<body>

<?php include __DIR__ . '/includes/nav.php'; ?>

<p id="liveStatus" role="status" aria-live="polite" aria-atomic="true"
   style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap"></p>

<main class="container" style="padding-top:20px;padding-bottom:60px">
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
        <p id="inputStatus" role="status"></p>
      </form>
      <p id="surfaceReward" class="status-ok surface-reward" role="status" aria-live="polite" aria-atomic="true" hidden></p>
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
      <button id="submitButton" type="button" class="btn btn-accent" disabled>Odeslat kvazivětu</button>
    </div>
    <p style="margin-top:10px;font-size:13px"><a href="/soukromi.php">Informace o zpracování osobních údajů</a></p>
    <aside class="notice" aria-label="Alternativní cesta podání" style="margin-top:16px"><strong>Nevejde se váš případ do formuláře?</strong>
      Pokud se domníváte, že vaše věta pravidla splňuje, ale konfigurátor ji neumí správně zachytit, napište nám na
      <a href="mailto:veta@kvazi.cz">veta@kvazi.cz</a>. Omezení formuláře samo o sobě neznamená, že je řešení podle pravidel zakázané.</aside>
    <div id="submitResult" style="margin-top:14px"></div>
  </div></section>
</main>

<script>window.__normative = <?= $normativeJson ?>;</script>
<script>window.__resubmit = <?= $resubmitJson ?>;</script>
<script type="module" src="/js/konfigurator/editor.mjs"></script>
<?php include __DIR__ . '/includes/footer.php'; ?>
</body>
</html>
