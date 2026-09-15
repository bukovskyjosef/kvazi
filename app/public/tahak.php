<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/auth.php';
auth_session_start();
$activePage = 'tahak';
?>
<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Kvazitahák — Nejdelší kvazivěta</title>
  <link rel="stylesheet" href="/css/site.css">
  <style>
    .tahak-section { margin-bottom: 44px; }
    .tahak-section h2 {
      font-size: 18px; font-weight: 800; letter-spacing: -.02em;
      color: var(--text); margin-bottom: 16px;
      padding-bottom: 10px;
      border-bottom: 1px solid rgba(255,255,255,.08);
    }
    .tahak-rule {
      background: var(--glass);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 14px 18px;
      margin-bottom: 8px;
      font-size: 13px;
      color: var(--text-muted);
      line-height: 1.6;
    }
    .tahak-rule strong { color: var(--text); }
    .tahak-rule code {
      font-family: 'Courier New', monospace;
      background: rgba(255,179,92,.1);
      color: var(--accent-3);
      padding: .1em .35em;
      border-radius: 4px;
      font-size: .9em;
    }
    .motif-table {
      font-family: 'Courier New', monospace;
      font-size: 13px;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
      gap: 6px;
      margin: 12px 0;
    }
    .motif-cell {
      background: rgba(255,179,92,.08);
      border: 1px solid rgba(255,179,92,.18);
      border-radius: 6px;
      padding: 6px 10px;
      color: var(--accent-3);
      font-weight: 700;
      letter-spacing: .1em;
      text-align: center;
    }
    .status-badge {
      display: inline-block;
      font-size: 10px; font-weight: 700;
      letter-spacing: .08em; text-transform: uppercase;
      padding: 2px 8px; border-radius: 4px; margin-left: 8px;
      vertical-align: middle;
    }
    .badge-normative { background: rgba(74,222,128,.12); border: 1px solid rgba(74,222,128,.25); color: #4ade80; }
    .badge-guide     { background: rgba(255,179,92,.1);  border: 1px solid rgba(255,179,92,.22); color: var(--accent); }
    .badge-open      { background: rgba(248,113,113,.1); border: 1px solid rgba(248,113,113,.22); color: #fca5a5; }
  </style>
</head>
<body>

<?php include __DIR__ . '/includes/nav.php'; ?>

<main class="container page-body">

  <div class="page-header">
    <span class="section-tag">Hráčský průvodce</span>
    <h1>Kvazi<em>tahák</em></h1>
    <p>Praktický přehled pravidel a omezení pro sestavení soutěžní věty. Normativní části jsou výslovně označeny.</p>
  </div>

  <!-- Abeceda -->
  <div class="tahak-section">
    <h2>Soutěžní abeceda <span class="status-badge badge-normative">normativní</span></h2>
    <div class="tahak-rule">
      Povolené znaky: <code>K V Q A Á Z I Í Y Ý</code><br>
      Velká a malá písmena jsou totožná. Diakritika se rozlišuje: <code>A ≠ Á</code>, <code>I ≠ Í</code>, <code>Y ≠ Ý</code>.
    </div>
    <div class="tahak-rule">
      <strong>Skórování:</strong> <code>Q = 1 písmeno</code>, <code>KV = 2 písmena</code>. Každý zapsaný znak má hodnotu právě jednoho písmene.
    </div>
    <div class="tahak-rule">
      <code>Q</code> se vyslovuje <code>/kv/</code>, ale je samostatným písmenem. Zápisy <code>QAZ</code> a <code>KVAZ</code> jsou dvě odlišná slova — nelze jim přiřadit tutéž morfologickou identitu.
    </div>
  </div>

  <!-- Motivy -->
  <div class="tahak-section">
    <h2>Motiv KVAZI <span class="status-badge badge-normative">normativní</span></h2>
    <div class="tahak-rule">
      Základní motiv je <code>KVAZI</code>. V každém výskytu lze nezávisle použít: <code>KV | Q</code>, <code>A | Á</code>, <code>Z</code>, <code>I | Í | Y | Ý</code>.
    </div>
    <div class="motif-table" aria-label="Všechny motivové varianty">
      <?php foreach (['KVAZI','KVAZÍ','KVAZY','KVAZÝ','KVÁZI','KVÁZÍ','KVÁZY','KVÁZÝ','QAZI','QAZÍ','QAZY','QAZÝ','QÁZI','QÁZÍ','QÁZY','QÁZÝ'] as $m): ?>
        <div class="motif-cell"><?= $m ?></div>
      <?php endforeach; ?>
    </div>
    <div class="tahak-rule">
      Celá věta musí být <strong>souvislým úsekem nepřetržité posloupnosti</strong> motivů. Začátek a konec smějí ležet uvnitř motivu.
    </div>
  </div>

  <!-- Délka slov -->
  <div class="tahak-section">
    <h2>Délka a pozice slov <span class="status-badge badge-normative">normativní</span></h2>
    <div class="tahak-rule">
      Každé slovo má <strong>3–5 znaků</strong> a musí celé ležet uvnitř jednoho opakování motivu. Hranici dvou motivů nesmí překročit.
    </div>
    <div class="tahak-rule">
      <strong>Pět jednopísmenných výjimek:</strong> <code>k</code> <code>v</code> <code>z</code> <code>a</code> <code>i</code> — každé lze použít nejvýše jednou v celé větě.
    </div>
  </div>

  <!-- Druhy slov -->
  <div class="tahak-section">
    <h2>Skutečná a kvazislova <span class="status-badge badge-normative">normativní</span></h2>
    <div class="tahak-rule">
      <strong>Skutečné slovo:</strong> doloženo v IJP (<em>Internetová jazyková příručka</em>) nebo ASSČ (<em>Akademický slovník současné češtiny</em>). Jiné zdroje existenci soutěžního slova samy o sobě nedokazují.
    </div>
    <div class="tahak-rule">
      <strong>Kvazislovo:</strong> vymyšlené slovo hráče — ale musí být morfologicky obhájeno a zařazeno do soutěžního modelu.
    </div>
    <div class="tahak-rule">
      Ke každému slovu je nutné vyplnit: <strong>slovní druh, vzor, pád, číslo a větnou funkci.</strong> Formulář konfigurátor provede technickou kontrolu.
    </div>
  </div>

  <!-- Věta -->
  <div class="tahak-section">
    <h2>Česká věta <span class="status-badge badge-normative">normativní</span></h2>
    <div class="tahak-rule">
      Věta musí mít <strong>podmět a přísudek</strong>. Vyhrává <strong>více slov</strong>; při shodě rozhoduje <strong>více písmen</strong> bez mezer.
    </div>
    <div class="tahak-rule">
      Větu tvoříte v konfigurátoru, kde se automaticky kontrolují znaková pravidla a strukturní požadavky.
    </div>
  </div>

  <!-- Otevřené body -->
  <div class="tahak-section">
    <h2>Otevřené body <span class="status-badge badge-open">rozpracováno</span></h2>
    <div class="tahak-rule">
      <strong>Časovací typy sloves (#2):</strong> Konkrétní paradigmata a reachability analýza jsou stále otevřeny na GitHubu. Výsledek ovlivní, která slovesná slova jsou v soutěži dosažitelná.
    </div>
  </div>

  <div style="margin-top:40px;padding-top:24px;border-top:1px solid rgba(255,255,255,.07)">
    <p style="font-size:13px;color:var(--text-dim)">
      Tento tahák je živý dokument. Normativní části jsou závazné v aktuální platné verzi pravidel.
      Kompletní specifikaci najdete v <a href="/prirucka.php" style="color:var(--accent);text-decoration:none">rozhodcovské příručce</a>.
    </p>
  </div>

</main>

<?php include __DIR__ . '/includes/footer.php'; ?>
</body>
</html>
