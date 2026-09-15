<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/auth.php';
auth_session_start();
$activePage = 'manifest';
?>
<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Manifest — Nejdelší kvazivěta</title>
  <link rel="stylesheet" href="/css/site.css">
</head>
<body>

<?php include __DIR__ . '/includes/nav.php'; ?>

<main class="container page-body">

  <div class="page-header">
    <span class="section-tag">Manifest</span>
    <h1>Manifest</h1>
  </div>

  <div class="manifest-body">
    <p>Dnes za nás spoustu i docela jednoduchých mentálních úkolů řeší počítače, mobily a čím dál víc také umělá inteligence. Když se s kamarádem na něčem nemůžeme shodnout, často místo přemýšlení prostě vytáhneme telefon, něco vygooglíme a máme hotovo.</p>
    <p>A mně přijde, že je to trochu škoda.</p>
    <p>Měli bychom občas víc zapojit vlastní hlavu, víc si hrát, vymýšlet, diskutovat a zkoušet něco vyřešit jenom tím, co sami umíme a víme. Ne všechno přece musí být dohledatelné, změřitelné a okamžitě ověřitelné na internetu.</p>
    <p>Právě proto vznikla tahle kvazisoutěž.</p>
    <p>Nabízí problém, který by měl být v zásadě řešitelný skoro pro každého, kdo mluví česky a prošel základní školou. Možná si občas budete potřebovat ověřit nějaké pravidlo nebo holý fakt, ale samotná práce na kvazivětě by měla být hlavně na vás.</p>
    <p>Můžete ji řešit sami, ale ještě lepší je dát se dohromady s dalšími lidmi, diskutovat, hledat zajímavé tvary, zkoušet různé možnosti a ideálně se u toho i trochu zasmát.</p>
    <p>Zároveň doufám, že mi prominete různá zjednodušení, omezení a občasné ohýbání bohaté české morfologie. Vyladit hru tak, aby z češtiny nabídla co nejvíc, ale zároveň se z ní nestala soutěž jen pro odbornou veřejnost, nebylo vůbec jednoduché. Zvlášť s ohledem na to, že nejsem lingvista ani odborník na češtinu. O to zajímavější cvičení pro mě ale bylo celou hru vymýšlet a hledat hranici mezi přesností, hratelností a zábavou.</p>
    <p>A to je vlastně hlavní smysl celé věci: na chvíli se zastavit, odložit techniku a něco společně vymýšlet. Klidně s knihou po ruce, ale hlavně s vlastní hlavou.</p>
    <p><em>Protože ono je to překvapivě velikánská zábava.</em></p>
  </div>

  <!-- Existující kapitola z úvodní stránky -->
  <div class="manifest-body" style="margin-top:48px">
    <h2 style="font-size:22px;font-weight:800;letter-spacing:-.02em;margin-bottom:20px">Proč tahle hra existuje</h2>
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
    <p style="margin-top:20px">
      Kontakt: <a href="mailto:veta@kvazi.cz">veta@kvazi.cz</a>
    </p>

  </div>

</main>

<?php include __DIR__ . '/includes/footer.php'; ?>
</body>
</html>
