<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/auth.php';
auth_session_start();
$activePage = 'prirucka';
?>
<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Rozhodcovská příručka — Nejdelší kvazivěta</title>
  <link rel="stylesheet" href="/css/site.css">
  <style>
    .spec-section { margin-bottom: 52px; }
    .spec-section h2 {
      font-size: 19px; font-weight: 800; letter-spacing: -.02em;
      color: var(--text); margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid rgba(255,255,255,.08);
      display: flex; align-items: center; gap: 10px;
    }
    .spec-num {
      display: inline-flex; align-items: center; justify-content: center;
      width: 28px; height: 28px; flex-shrink: 0;
      border-radius: 7px;
      background: rgba(255,179,92,.1);
      border: 1px solid rgba(255,179,92,.22);
      color: var(--accent);
      font-size: 13px; font-weight: 800;
    }
    .spec-block {
      background: var(--glass);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 16px 20px;
      margin-bottom: 10px;
      font-size: 13px; line-height: 1.7;
      color: var(--text-muted);
    }
    .spec-block strong { color: var(--text); }
    .spec-block code {
      font-family: 'Courier New', monospace;
      background: rgba(255,179,92,.1);
      color: var(--accent-3);
      padding: .1em .35em;
      border-radius: 4px;
      font-size: .9em;
    }
    .spec-block ol, .spec-block ul { padding-left: 20px; }
    .spec-block li { margin-bottom: 5px; }
    .hier-item {
      display: flex; gap: 12px; align-items: flex-start;
      padding: 10px 14px;
      background: var(--glass);
      border: 1px solid var(--border);
      border-radius: 8px;
      margin-bottom: 6px;
    }
    .hier-num {
      flex-shrink: 0;
      width: 22px; height: 22px;
      border-radius: 50%;
      background: rgba(255,179,92,.12);
      border: 1px solid rgba(255,179,92,.25);
      color: var(--accent);
      font-size: 11px; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
      margin-top: 1px;
    }
    .hier-text { font-size: 13px; color: var(--text-muted); line-height: 1.5; }
    .hier-text strong { color: var(--text); }
  </style>
</head>
<body>

<?php include __DIR__ . '/includes/nav.php'; ?>

<main class="container page-body">

  <div class="page-header">
    <span class="section-tag">Normativní dokument</span>
    <h1>Rozhodcovská <em>příručka</em></h1>
    <p>Hlavní normativní dokument pro posuzování soutěžních přihlášek. Platí souběžně s normativními částmi kvazitaháku.</p>
  </div>

  <!-- Hierarchie -->
  <div class="spec-section">
    <h2><span class="spec-num">1</span>Hierarchie pravidel</h2>
    <div class="hier-item"><div class="hier-num">1</div><div class="hier-text"><strong>Výslovná pravidla kvaziproblému</strong></div></div>
    <div class="hier-item"><div class="hier-num">2</div><div class="hier-text"><strong>Normativní tabulky a seznamy kvazitaháku</strong> v rozsahu, v němž na ně pravidla odkazují</div></div>
    <div class="hier-item"><div class="hier-num">3</div><div class="hier-text"><strong>Současná spisovná čeština</strong> ve věcech, které soutěžní systém výslovně neupravuje</div></div>
    <div class="hier-item"><div class="hier-num">4</div><div class="hier-text"><strong>Konečný výklad kvaziautority</strong> v nejasném nebo sporném případě</div></div>
    <div class="spec-block" style="margin-top:10px">
      Technická implementace ani formulář nejsou vyšší autoritou než pravidla. Spravovaný katalog skutečných slov má pouze zvláštní autoritativní roli vymezenou v oddílu 9.
    </div>
  </div>

  <!-- Abeceda -->
  <div class="spec-section">
    <h2><span class="spec-num">2</span>Soutěžní abeceda</h2>
    <div class="spec-block">
      <strong>Povolené znaky:</strong> <code>K V Q A Á Z I Í Y Ý</code><br><br>
      Velká a malá písmena jsou při kontrole řetězce i identity totožná.
      Diakritika se rozlišuje: <code>A ≠ Á</code>, <code>I ≠ Í</code>, <code>Y ≠ Ý</code>.
    </div>
    <div class="spec-block">
      <strong>Skórování:</strong> každý skutečně zapsaný soutěžní znak má hodnotu jednoho písmene.<br>
      <code>Q = 1</code>, <code>KV = 2</code>.
    </div>
    <div class="spec-block">
      <code>Q</code> se vyslovuje <code>/kv/</code>, ale je <strong>samostatným soutěžním písmenem</strong>.
      Není zkratkou, ligaturou ani alternativním pravopisným zápisem dvojice <code>KV</code>.<br><br>
      Při určování lemmatu, morfologie, soutěžní identity a při práci s jazykovými zdroji se <code>Q</code> nikdy automaticky nerozvíjí na <code>KV</code>.
      Zápisy <code>QAZ</code> a <code>KVAZ</code> jsou dvě odlišná slova.
    </div>
  </div>

  <!-- Motiv -->
  <div class="spec-section">
    <h2><span class="spec-num">3</span>Motiv</h2>
    <div class="spec-block">
      Základní motiv je <code>KVAZI</code>. V každém výskytu lze nezávisle použít:
      <code>KV | Q</code>, <code>A | Á</code>, <code>Z</code>, <code>I | Í | Y | Ý</code>.<br><br>
      Celá věta po spojení slov musí být <strong>souvislým úsekem nepřetržité posloupnosti</strong> těchto motivů.
      Začátek a konec smějí ležet uvnitř motivu.
    </div>
  </div>

  <!-- Délka slov -->
  <div class="spec-section">
    <h2><span class="spec-num">4</span>Délka a hranice slov</h2>
    <div class="spec-block">
      Každé slovo má <strong>3–5 znaků</strong> a musí celé ležet uvnitř jednoho opakování motivu.
      Hranici dvou motivů nesmí překročit.
    </div>
    <div class="spec-block">
      <strong>Jednopísmenné výjimky:</strong> písmena <code>k</code>, <code>v</code>, <code>z</code>, <code>a</code>, <code>i</code>
      mohou být samostatnými slovy — každé nejvýše jednou v celé větě.
    </div>
  </div>

  <!-- Skórování -->
  <div class="spec-section">
    <h2><span class="spec-num">5</span>Skórování a určení vítěze</h2>
    <div class="spec-block">
      Vyhrává přihláška s <strong>největším počtem slov</strong> ve větě.
    </div>
    <div class="spec-block">
      Při shodném počtu slov rozhoduje <strong>větší počet písmen</strong> bez mezer (každý soutěžní znak = 1 písmeno, <code>Q = 1</code>).
    </div>
    <div class="spec-block">
      Věta musí mít <strong>podmět a přísudek</strong>. Obě musí splňovat všechna soutěžní pravidla.
    </div>
  </div>

  <!-- AI policy -->
  <div class="spec-section">
    <h2><span class="spec-num">6</span>Zákaz AI a automatizovaných nástrojů</h2>
    <div class="spec-block">
      Řešení musí být vytvořeno <strong>vlastní hlavou hráče</strong>. Skripty, solvery ani AI nesmějí generovat, hledat ani filtrovat kandidátní slova.
    </div>
    <div class="spec-block">
      AI lze použít jako lingvistickou referenci (dotaz na existenci slova, jeho skloňování apod.), <strong>ne</strong> pro algoritmické prohledávání prostoru řešení.
    </div>
  </div>

  <!-- Živá pravidla -->
  <div class="spec-section">
    <h2><span class="spec-num">7</span>Živá pravidla a verzování</h2>
    <div class="spec-block">
      Pokud hráč najde díru v pravidlech a jeho řešení je podle <strong>aktuální platné verze</strong> pravidel platné, musí být uznáno.
      Díru zavřeme až v další verzi pravidel.
    </div>
    <div class="spec-block">
      Každé posouzení se váže na konkrétní verzi pravidel platnou v okamžiku podání.
      Nová verze pravidel neretroaktivně zneplatňuje předchozí uznané přihlášky.
    </div>
  </div>

  <!-- Placeholder pro zbytek -->
  <div class="card-site" style="margin-top:40px">
    <div class="card-site-header">Oddíly 8–10 — připravuje se</div>
    <div class="card-site-body" style="color:var(--text-muted);font-size:13px;line-height:1.7">
      <p>Kompletní specifikace zahrnuje dalšíoddíly:</p>
      <ul style="margin:10px 0 0 20px;display:flex;flex-direction:column;gap:5px">
        <li>Oddíl 8 — Morfologická obhajoba: požadované pole pro každý slovní druh</li>
        <li>Oddíl 9 — Katalog skutečných slov: role a autorita spravovaného katalogu</li>
        <li>Oddíl 10 — Procesní postup posouzení a verdikty</li>
      </ul>
      <p style="margin-top:14px">Tyto oddíly jsou propojeny s otevřenými normativními rozhodnutími (GitHub Issues) a budou zveřejněny po jejich uzavření.</p>
    </div>
  </div>

</main>

<?php include __DIR__ . '/includes/footer.php'; ?>
</body>
</html>
