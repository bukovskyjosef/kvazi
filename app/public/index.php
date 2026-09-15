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
      Ale jen ze slov sestavených ze znaků&nbsp;<strong>K, V, A, Z, I</strong>.
      Jde to? A jak dlouho?
    </p>
    <div class="hero-cta">
      <a class="btn btn-accent btn-lg" href="/konfigurator.php">Konfigurátor &rarr;</a>
      <a class="btn btn-ghost btn-lg" href="#jak-hrat">Jak hrát</a>
    </div>
    <div class="hero-stats">
      <div class="hero-stat">
        <div class="hero-stat-num">5</div>
        <div class="hero-stat-label">základních znaků</div>
      </div>
      <div class="hero-stat">
        <div class="hero-stat-num">K, V, A, Z, I</div>
        <div class="hero-stat-label">kvazimotiv</div>
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
          Základ je opakující se sekvence <code>KVAZI</code>. Písmeno
          <code>Q</code> nahrazuje <code>KV</code> jako jeden znak.
          Samohlásky připouštějí délku: <code>A/Á</code>, <code>I/Í/Y/Ý</code>.
          Vznikají tak varianty: <code>QAZÍ</code>, <code>KVÁZÝ</code>, <code>QÁZY</code>…
        </p>
      </div>

      <div class="step-card">
        <div class="step-num">2</div>
        <h3>Slova z motivu</h3>
        <p>
          Každé slovo má <strong>3–5 znaků</strong> a musí celé ležet
          uvnitř jednoho opakování motivu. Hranici dvou motivů nesmí překročit.
          Pět jednopísmenných výjimek: <code>k</code>&thinsp;<code>v</code>&thinsp;<code>z</code>&thinsp;<code>a</code>&thinsp;<code>i</code> — každé nejvýše jednou.
        </p>
      </div>

      <div class="step-card">
        <div class="step-num">3</div>
        <h3>Skutečná nebo kvazi</h3>
        <p>
          Smíš použít skutečné české slovo (doložené v <strong>IJP</strong> nebo
          <strong>ASSČ</strong>) nebo vymyšlené <strong>kvazislovo</strong> —
          ale každé musíš morfologicky obhájit a zařadit do soutěžního modelu.
        </p>
      </div>

      <div class="step-card">
        <div class="step-num">4</div>
        <h3>Česká věta</h3>
        <p>
          Ze slov sestavíš jednu větu s podmětem a přísudkem.
          Vyhrává <strong>více slov</strong>; při shodě rozhoduje
          <strong>více písmen</strong> bez mezer.
          <code>Q</code> se počítá jako jedno písmeno.
        </p>
      </div>

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
          <p>Řešení musíš vytvořit sám. Skripty, solvery ani AI nesmí generovat, hledat ani filtrovat kandidátní slova.</p>
        </div>
      </div>

      <div class="rule-card">
        <div class="rule-icon">&#128270;</div>
        <div>
          <h4>Ověření slov</h4>
          <p>Skutečná slova ověřuješ ručně v IJP nebo ASSČ. Jiné zdroje samy o sobě existenci soutěžního slova nedokazují.</p>
        </div>
      </div>

      <div class="rule-card">
        <div class="rule-icon">&#9997;&#65039;</div>
        <div>
          <h4>Morfologická obhajoba</h4>
          <p>Při odevzdání ke každému slovu vyplníš slovní druh, vzor, pád, číslo a větnou funkci. Formulář provede technickou kontrolu.</p>
        </div>
      </div>

      <div class="rule-card">
        <div class="rule-icon">&#128336;</div>
        <div>
          <h4>Živá pravidla</h4>
          <p>Pokud najdeš díru v pravidlech a řešení je podle aktuální verze platné, musí být uznáno. Díru zavřeme až v další verzi.</p>
        </div>
      </div>

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
  </div>
</section>

<?php include __DIR__ . '/includes/footer.php'; ?>

</body>
</html>
