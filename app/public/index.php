<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/auth.php';
auth_session_start();

function db_status(): array {
    try {
        $dsn = sprintf(
            'pgsql:host=%s;port=%s;dbname=%s',
            getenv('DB_HOST') ?: 'db',
            getenv('DB_PORT') ?: '5432',
            getenv('DB_NAME') ?: 'kvazi'
        );
        $pdo = new PDO($dsn, getenv('DB_USER') ?: 'kvazi', getenv('DB_PASS') ?: 'kvazi', [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 3,
        ]);
        $row = $pdo->query(
            "SELECT COUNT(*) AS cnt FROM information_schema.tables WHERE table_schema = 'kvazi'"
        )->fetch(PDO::FETCH_ASSOC);
        return ['ok' => true, 'tables' => (int)$row['cnt']];
    } catch (Throwable $e) {
        return ['ok' => false];
    }
}

$db = db_status();
$activePage = 'home';
?>
<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Nejdelší kvazivěta</title>
  <link rel="stylesheet" href="/css/site.css">
</head>
<body>

<?php include __DIR__ . '/includes/nav.php'; ?>

<!-- ── Hero ──────────────────────────────────────────────────── -->
<section class="hero">
  <div class="container hero-inner">
    <div class="hero-eyebrow">česká kvazilingvistická soutěž</div>
    <h1>Sestav nejdelší<br>českou větu<em>.</em></h1>
    <p class="hero-sub">
      Ale jen ze soutěžních znaků&nbsp;<strong>K, V, Q, A, Á, Z, I, Í, Y, Ý</strong>
      uspořádaných podle motivu KVAZI. Jde to? A jak dlouho?
    </p>
    <div class="hero-cta">
      <a class="btn btn-accent btn-lg" href="/konfigurator.php">Konfigurátor &rarr;</a>
      <a class="btn btn-ghost btn-lg" href="#jak-hrat">Jak hrát</a>
    </div>
    <div class="hero-stats">
      <div class="hero-stat">
        <div class="hero-stat-num">10</div>
        <div class="hero-stat-label">soutěžních znaků</div>
      </div>
      <div class="hero-stat">
        <div class="hero-stat-num">KVAZI</div>
        <div class="hero-stat-label">základní motiv</div>
      </div>
      <div class="hero-stat">
        <div class="hero-stat-num">∞</div>
        <div class="hero-stat-label">možných vět</div>
      </div>
    </div>
  </div>
</section>

<!-- ── Motif strip ───────────────────────────────────────────── -->
<div class="motif-strip" aria-hidden="true">
  <?php
  $motifs   = [];
  $variants = ['KVAZI','KVÁZÍ','QAZI','QAZÍ','KVÁZY','QÁZY','KVAZY','QÁZI'];
  for ($i = 0; $i < 24; $i++) {
      $motifs[] = '<b class="L">' . $variants[$i % count($variants)] . '</b>';
  }
  $strip = implode('<span>·</span>', $motifs);
  echo '<div class="motif-strip-inner">' . $strip . '<span>·</span>' . $strip . '</div>';
  ?>
</div>

<!-- ── Jak hrát ──────────────────────────────────────────────── -->
<section class="section" id="jak-hrat">
  <div class="container">
    <span class="section-tag">Pravidla</span>
    <h2 class="section-title">Jak to funguje</h2>
    <div class="steps">

      <div class="step-card">
        <div class="step-num">1</div>
        <h3>Motiv KVAZI</h3>
        <p>
          Základ je opakující se sekvence <code>KVAZI</code>. Na začátku motivu lze použít
          <code>KV</code> nebo <code>Q</code> — <code>Q</code> se vyslovuje <code>/kv/</code>,
          ale je to <strong>samostatné soutěžní písmeno</strong>, nikoli zkratka za dvojici <code>KV</code>.
          Samohlásky připouštějí délku: <code>A/Á</code>, <code>I/Í/Y/Ý</code>.
          Vznikají varianty: <code>QAZÍ</code>, <code>KVÁZÝ</code>, <code>QÁZY</code>…
        </p>
      </div>

      <div class="step-card">
        <div class="step-num">2</div>
        <h3>Slova z motivu</h3>
        <p>
          Běžné slovo má <strong>3–5 soutěžních znaků</strong> a musí celé ležet
          uvnitř jednoho opakování motivu. Hranici dvou motivů nesmí překročit.
          Pět jednopísmenných výjimek: <code>k</code>&thinsp;<code>v</code>&thinsp;<code>z</code>&thinsp;<code>a</code>&thinsp;<code>i</code> — každé nejvýše jednou.
          Podstatné jméno může navíc nést doslovný prefix <code>kvazi-</code>; jeho pět znaků tvoří zvláštní výjimku a <strong>nezapočítává se do sekundárního skóre</strong>.
        </p>
      </div>

      <div class="step-card">
        <div class="step-num">3</div>
        <h3>Skutečná nebo kvazi</h3>
        <p>
          Smíš použít skutečné české slovo (potvrzené <strong>spravovaným katalogem</strong> soutěže)
          nebo v produktivních kategoriích vymyšlené <strong>kvazislovo</strong>.
          Deklarace musí odpovídat příslušnému soutěžnímu modelu a konkrétnímu použití ve větě.
        </p>
      </div>

      <div class="step-card">
        <div class="step-num">4</div>
        <h3>Česká věta</h3>
        <p>
          Ze slov sestavíš jednu větu s <strong>jedním přísudkem</strong> a právě
          <strong>jedním plnovýznamovým slovesným tokenem</strong>. Podmět je právě jeden;
          pouze u dovoleného imperativu může být pravidelně nevyjádřený.
          Vyhrává <strong>více slov</strong>; při shodě rozhoduje
          <strong>více soutěžních znaků</strong> bez mezer
          (<code>Q&nbsp;=&nbsp;1</code>, <code>KV&nbsp;=&nbsp;2</code>).
        </p>
      </div>

    </div>
    <div style="margin-top:28px;text-align:center">
      <a class="btn btn-ghost" href="/tahak.php">Otevřít Kvazitahák &rarr;</a>
    </div>
  </div>
</section>

<!-- ── Pravidla teaser ───────────────────────────────────────── -->
<section class="section" style="padding-top:0">
  <div class="container">
    <span class="section-tag">Soutěžní podmínky</span>
    <h2 class="section-title">Co potřebuješ vědět</h2>
    <div class="rules-grid">

      <div class="rule-card">
        <div class="rule-icon">&#128211;</div>
        <div>
          <h4>Vlastní hlava</h4>
          <p>Řešení má vzniknout lidskou prací. Lidé mohou spolupracovat, ale skripty, solvery ani AI nesmí generovat, hledat ani filtrovat soutěžní kandidáty.</p>
        </div>
      </div>

      <div class="rule-card">
        <div class="rule-icon">&#128270;</div>
        <div>
          <h4>Ověření slov</h4>
          <p>Skutečná slova ověřuje spravovaný katalog soutěže. IJP, ASSČ a jiné odborné zdroje slouží jako podklady, ale nejsou přímým soutěžním whitelistem.</p>
        </div>
      </div>

      <div class="rule-card">
        <div class="rule-icon">&#9997;&#65039;</div>
        <div>
          <h4>Morfologická deklarace</h4>
          <p>U produktivního slova deklaruješ soutěžní identitu, vlastnosti konkrétního použití a skutečně použitý tvar. Celé paradigma ani nepoužité tvary ručně nevyplňuješ; formulář může konkrétní deklaraci deterministicky zkontrolovat.</p>
        </div>
      </div>

      <div class="rule-card">
        <div class="rule-icon">&#128336;</div>
        <div>
          <h4>Živá pravidla</h4>
          <p>Pokud najdeš díru v pravidlech a řešení je podle aktuální verze platné, musí být uznáno. Díru lze zavřít až v další verzi pravidel.</p>
        </div>
      </div>

    </div>
    <div style="margin-top:28px;text-align:center">
      <p style="color:var(--text-dim);font-size:12px;margin-bottom:12px">Tato stránka je stručný veřejný úvod. Přesná pravidla a jejich autoritu určuje kanonický normativní balík projektu.</p>
      <a class="btn btn-ghost" href="/prirucka.php">Veřejná rozhodcovská příručka &rarr;</a>
    </div>
  </div>
</section>

<!-- ── Manifest ──────────────────────────────────────────────── -->
<section class="manifest-section section">
  <div class="container">
    <span class="section-tag">Manifest</span>
    <h2 class="section-title">Proč tahle hra existuje</h2>
    <blockquote>
      Hra je schválně zbytečný problém pro lidskou hlavu.
      Cílem je přemýšlet, kombinovat a hledat řešení vlastními silami.
    </blockquote>
    <p>
      Nejdelší kvazivěta stojí na průniku jazyka, logiky a vynalézavosti.
      Omezená zásoba znaků nutí hráče přemýšlet o morfologii češtiny způsobem,
      který slovníky ani učebnice nenabídnou.
    </p>
    <p>
      Kvazislova — slova, která hráč vymyslí — nejsou únik, ale výzva:
      musíš je zařadit do gramatického modelu, obhájit jejich tvar a dokázat,
      že v české větě dávají smysl.
    </p>
    <p style="margin-top:20px">
      Autorem kvaziproblému a pravidel je <strong style="color:var(--text)">Josef Bukovský</strong>.
    </p>
    <div style="margin-top:20px">
      <a class="btn btn-ghost" href="/manifest.php">Přečíst celý manifest &rarr;</a>
    </div>
  </div>
</section>

<?php include __DIR__ . '/includes/footer.php'; ?>

</body>
</html>
