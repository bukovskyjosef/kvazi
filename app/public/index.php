<?php
declare(strict_types=1);

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
?>
<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Nejdelší kvazivěta</title>
  <link rel="stylesheet" href="/css/app.css">
  <style>
    /* ── Hero ─────────────────────────────────────────────── */
    .hero {
      background: var(--navy);
      color: #f8fafc;
      padding: 5rem 0 4rem;
      text-align: center;
    }

    .hero h1 {
      font-size: clamp(2.2rem, 6vw, 3.5rem);
      font-weight: 800;
      letter-spacing: -.04em;
      line-height: 1.1;
      margin-bottom: 1rem;
    }

    .hero h1 em {
      font-style: normal;
      color: #93c5fd;
    }

    .hero-sub {
      font-size: 1.1rem;
      color: #94a3b8;
      margin-bottom: 2.25rem;
      max-width: 500px;
      margin-left: auto;
      margin-right: auto;
    }

    .hero-cta {
      display: flex;
      gap: .75rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    /* ── Motif strip ──────────────────────────────────────── */
    .motif-strip {
      background: #172033;
      border-top: 1px solid rgba(255,255,255,.06);
      border-bottom: 1px solid rgba(255,255,255,.06);
      padding: .9rem 0;
      overflow: hidden;
      white-space: nowrap;
    }

    .motif-strip-inner {
      display: inline-flex;
      gap: 0;
      animation: scroll-left 18s linear infinite;
      font-family: 'Courier New', monospace;
      font-size: 1rem;
      font-weight: 700;
      letter-spacing: .18em;
    }

    .motif-strip-inner span { color: #334155; margin: 0 1.5rem; }
    .motif-strip-inner .L  { color: #60a5fa; }
    .motif-strip-inner .X  { color: #94a3b8; }

    @keyframes scroll-left {
      from { transform: translateX(0); }
      to   { transform: translateX(-50%); }
    }

    /* ── How it works ─────────────────────────────────────── */
    .how {
      padding: 4rem 0;
    }

    .section-label {
      font-size: .75rem;
      font-weight: 700;
      letter-spacing: .12em;
      text-transform: uppercase;
      color: var(--blue);
      margin-bottom: .5rem;
    }

    .section-title {
      font-size: 1.75rem;
      font-weight: 800;
      letter-spacing: -.03em;
      color: var(--navy);
      margin-bottom: 2.5rem;
    }

    .steps {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.25rem;
    }

    .step {
      background: var(--white);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.75rem;
      box-shadow: var(--shadow);
    }

    .step-num {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: #eff6ff;
      color: var(--blue);
      font-weight: 800;
      font-size: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
    }

    .step h3 {
      font-size: 1rem;
      font-weight: 700;
      margin-bottom: .5rem;
      color: var(--navy);
    }

    .step p {
      font-size: .9rem;
      color: var(--slate);
      line-height: 1.65;
    }

    .step code {
      font-family: 'Courier New', monospace;
      background: #f1f5f9;
      padding: .1em .35em;
      border-radius: 4px;
      font-size: .85em;
      color: var(--blue2);
    }

    /* ── Manifest ─────────────────────────────────────────── */
    .manifest {
      background: var(--navy2);
      color: #e2e8f0;
      padding: 4rem 0;
    }

    .manifest .section-label { color: #60a5fa; }
    .manifest .section-title { color: #f1f5f9; margin-bottom: 1.5rem; }

    .manifest blockquote {
      border-left: 3px solid #2563eb;
      padding-left: 1.5rem;
      margin: 0 0 1.5rem;
      font-size: 1.15rem;
      font-style: italic;
      color: #cbd5e1;
      line-height: 1.7;
    }

    .manifest p {
      color: #94a3b8;
      font-size: .95rem;
      line-height: 1.7;
      max-width: 700px;
      margin-bottom: .75rem;
    }

    /* ── Rules teaser ─────────────────────────────────────── */
    .rules-teaser {
      padding: 4rem 0;
    }

    .rules-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;
    }

    .rule-card {
      background: var(--white);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.25rem 1.5rem;
      box-shadow: var(--shadow);
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }

    .rule-icon {
      font-size: 1.3rem;
      flex-shrink: 0;
      margin-top: .1rem;
    }

    .rule-card h4 {
      font-size: .9rem;
      font-weight: 700;
      color: var(--navy);
      margin-bottom: .25rem;
    }

    .rule-card p {
      font-size: .83rem;
      color: var(--slate);
      line-height: 1.55;
    }
  </style>
</head>
<body>

<nav class="site-nav">
  <div class="container">
    <a class="nav-brand" href="/">Nejdelší kvazivěta</a>
    <div class="nav-links">
      <a class="btn btn-ghost" href="#jak-hrat">Jak hrát</a>
      <a class="btn btn-primary" href="/konfigurator.html">Konfigurátor</a>
    </div>
  </div>
</nav>

<!-- ── Hero ─────────────────────────────────────────────────── -->
<section class="hero">
  <div class="container">
    <h1>Sestav nejdelší<br>českou větu<em>.</em></h1>
    <p class="hero-sub">
      Ale jen ze znaků&nbsp;<strong>K, V, A, Z, I</strong>.
      Jde to? A jak dlouho?
    </p>
    <div class="hero-cta">
      <a class="btn btn-primary btn-lg" href="/konfigurator.html">Konfigurátor →</a>
      <a class="btn btn-ghost btn-lg" href="#jak-hrat">Jak hrát</a>
    </div>
  </div>
</section>

<!-- ── Motif strip ───────────────────────────────────────────── -->
<div class="motif-strip" aria-hidden="true">
  <?php
  // Build one long strip and duplicate for seamless loop
  $motifs = [];
  $variants = ['KVAZI','KVÁZÍ','QAZI','QAZÍ','KVÁZY','QÁZY','KVAZY','QÁZI'];
  for ($i = 0; $i < 24; $i++) {
      $v = $variants[$i % count($variants)];
      $motifs[] = $v;
  }
  $strip = implode('<span>·</span>', array_map(fn($m) => '<b class="L">' . $m . '</b>', $motifs));
  echo '<div class="motif-strip-inner">' . $strip . '<span>·</span>' . $strip . '</div>';
  ?>
</div>

<!-- ── Jak hrát ──────────────────────────────────────────────── -->
<section class="how" id="jak-hrat">
  <div class="container">
    <div class="section-label">Pravidla</div>
    <h2 class="section-title">Jak to funguje</h2>
    <div class="steps">

      <div class="step">
        <div class="step-num">1</div>
        <h3>Motiv KVAZI</h3>
        <p>
          Základ je opakující se sekvence <code>KVAZI</code>. Písmeno
          <code>Q</code> nahrazuje <code>KV</code> jako jeden znak.
          Samohlásky připouštějí délku: <code>A/Á</code>, <code>I/Í/Y/Ý</code>.<br><br>
          Vznikají tak varianty: <code>QAZÍ</code>, <code>KVÁZÝ</code>, <code>QÁZY</code>…
        </p>
      </div>

      <div class="step">
        <div class="step-num">2</div>
        <h3>Slova z motivu</h3>
        <p>
          Každé slovo má <strong>3–5 znaků</strong> a musí celé ležet
          uvnitř jednoho opakování motivu. Hranici dvou motivů nesmí překročit.<br><br>
          Pět jednopísmenných výjimek: <code>k</code>&thinsp;<code>v</code>&thinsp;<code>z</code>&thinsp;<code>a</code>&thinsp;<code>i</code> – každé nejvýše jednou.
        </p>
      </div>

      <div class="step">
        <div class="step-num">3</div>
        <h3>Skutečná nebo kvazi</h3>
        <p>
          Smíš použít skutečné česky slovo (doložené v <strong>IJP</strong> nebo
          <strong>ASSČ</strong>) nebo vymyšlené <strong>kvazislovo</strong> –
          ale každé musíš morfologicky obhájit a zařadit do soutěžního modelu.
        </p>
      </div>

      <div class="step">
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
<section class="rules-teaser">
  <div class="container">
    <div class="section-label">Soutěžní podmínky</div>
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
<section class="manifest">
  <div class="container">
    <div class="section-label">Manifest</div>
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
      Kvazislova – slova, která hráč vymyslí – nejsou únik, ale výzva:
      musíš je zařadit do gramatického modelu, obhájit jejich tvar a dokázat,
      že v české větě dávají smysl.
    </p>
    <p style="margin-top:1.5rem">
      Autorem kvaziproblému a pravidel je <strong style="color:#e2e8f0">Josef Bukovský</strong>.
    </p>
  </div>
</section>

<!-- ── Footer ────────────────────────────────────────────────── -->
<footer class="site-footer">
  <div class="container">
    <span>Nejdelší kvazivěta &mdash; lokální prostředí</span>
    <span>
      <span class="db-dot <?= $db['ok'] ? 'ok' : 'err' ?>"></span>
      <?php if ($db['ok']): ?>
        PostgreSQL &middot; schéma kvazi &middot; <?= $db['tables'] ?> tabulek
      <?php else: ?>
        PostgreSQL &middot; nepřipojeno
      <?php endif; ?>
    </span>
  </div>
</footer>

</body>
</html>
