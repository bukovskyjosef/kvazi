<?php
// Source: docs/rules/02-rozhodcovska-specifikace.md + 03-ai-policy.md + 04-verzovani-a-sprava.md
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
      font-size: 18px; font-weight: 800; letter-spacing: -.02em;
      color: var(--text); margin-bottom: 18px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--border);
      display: flex; align-items: center; gap: 10px;
    }
    .spec-num {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 28px; height: 28px; flex-shrink: 0;
      border-radius: 7px;
      background: rgba(255,179,92,.1);
      border: 1px solid rgba(255,179,92,.22);
      color: var(--accent);
      font-size: 12px; font-weight: 800;
      padding: 0 6px;
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
    .spec-block a { color: var(--accent); }
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
    /* TOC */
    .spec-toc {
      background: var(--glass); border: 1px solid var(--border);
      border-radius: 12px; padding: 20px 24px;
      margin-bottom: 40px;
    }
    .spec-toc h2 {
      font-size: 13px; font-weight: 700; letter-spacing: .06em;
      text-transform: uppercase; color: var(--text-dim);
      margin: 0 0 14px;
    }
    .spec-toc ol {
      columns: 2; column-gap: 28px;
      padding-left: 22px; margin: 0;
      font-size: 12px; line-height: 1.8; color: var(--text-muted);
    }
    @media (max-width: 600px) { .spec-toc ol { columns: 1; } }
    .spec-toc li { break-inside: avoid; }
    .spec-toc a { color: var(--accent); text-decoration: none; }
    .spec-toc a:hover { text-decoration: underline; }
    .spec-toc .toc-divider {
      grid-column: 1/-1; font-size: 10px; font-weight: 700;
      letter-spacing: .1em; text-transform: uppercase; color: var(--text-dim);
      margin: 10px 0 4px; list-style: none;
    }
    /* Appendix heading */
    .spec-appendix-label {
      font-size: 10px; font-weight: 700; letter-spacing: .1em;
      text-transform: uppercase; color: var(--text-dim);
      margin-bottom: 8px; display: block;
    }
    /* Motif block */
    .spec-motif-grid {
      font-family: 'Courier New', monospace;
      display: grid; grid-template-columns: repeat(auto-fill, minmax(78px, 1fr));
      gap: 5px; margin: 10px 0;
    }
    .spec-motif-cell {
      background: rgba(255,179,92,.07); border: 1px solid rgba(255,179,92,.16);
      border-radius: 5px; padding: 4px 8px; color: var(--accent-3);
      font-weight: 700; letter-spacing: .08em; text-align: center; font-size: 12px;
    }
  </style>
</head>
<body>

<?php include __DIR__ . '/includes/nav.php'; ?>

<main class="container page-body">

  <div class="page-header">
    <span class="section-tag">Normativní dokument</span>
    <h1>Rozhodcovská <em>příručka</em></h1>
    <p>Hlavní normativní dokument pro posuzování soutěžních přihlášek. Platí souběžně s normativními částmi <a href="/tahak.php">kvazitaháku</a>.</p>
  </div>

  <nav class="spec-toc" aria-label="Obsah příručky">
    <h2>Obsah</h2>
    <ol>
      <li><a href="#s1">Autorita a hierarchie</a></li>
      <li><a href="#s2">Soutěžní abeceda</a></li>
      <li><a href="#s3">Motiv</a></li>
      <li><a href="#s4">Slovo</a></li>
      <li><a href="#s5">Věta</a></li>
      <li><a href="#s6">Povolená syntax</a></li>
      <li><a href="#s7">Slovní druhy</a></li>
      <li><a href="#s8">Kvazislovo</a></li>
      <li><a href="#s9">Skutečné české slovo a katalog</a></li>
      <li><a href="#s10">Morfologické modely</a></li>
      <li><a href="#s11">Substantiva</a></li>
      <li><a href="#s12">Adjektiva</a></li>
      <li><a href="#s13">Slovesa a valence</a></li>
      <li><a href="#s14">Fiktivní význam</a></li>
      <li><a href="#s15">Soutěžní identita</a></li>
      <li><a href="#s16">Interpunkce</a></li>
      <li><a href="#s17">Analýza a veřejný detail</a></li>
      <li><a href="#s18">Zdroje a důkazní břemeno</a></li>
      <li><a href="#s19">Nástroje, fair play a důvěra</a></li>
      <li><a href="#s20">Platnost, uznání a kvaziautorita</a></li>
      <li><a href="#s21">Skóre</a></li>
      <li><a href="#s22">Reachability a slepé cesty</a></li>
      <li><a href="#s23">Autorství, spolupráce a navazování</a></li>
      <li><a href="#ai">Příloha A — Politika nástrojů a AI</a></li>
      <li><a href="#verze">Příloha B — Verzování a správa</a></li>
    </ol>
  </nav>

  <!-- ── §1 Autorita a hierarchie ── -->
  <div class="spec-section" id="s1">
    <h2><span class="spec-num">1</span>Autorita a hierarchie</h2>
    <div class="spec-block">
      <strong>Konečnou autoritou hry je kvaziautorita / Josef Bukovský.</strong> Normativní dokumenty jsou kanonickým záznamem přijatých rozhodnutí a musí být navzájem konzistentní.
    </div>
    <div class="spec-block">
      Pro obecná pravidla platnosti je kanonickým zdrojem tato rozhodcovská specifikace. Pro přesnou morfologii, paradigmata, tvorbu kmenů a mechaniku uzavřených modelů jsou kanonickým zdrojem výslovně NORMATIVNÍ části příslušných modulů v <a href="/tahak.php">Kvazitaháku</a>. <code>03-ai-policy.md</code> a <code>04-verzovani-a-sprava.md</code> jsou kanonické pro své normativní oblasti.
    </div>
    <div class="spec-block">
      Současná spisovná čeština se použije ve věcech, které soutěžní systém výslovně neupravuje. Pokud si dva normativní dokumenty odporují, jde o dokumentační/governance vadu, nikoli o prostor pro volnou interpretaci; do opravy rozhoduje výklad kvaziautority.
    </div>
    <div class="hier-item"><div class="hier-num">1</div><div class="hier-text"><strong>Výslovná pravidla kvaziproblému</strong></div></div>
    <div class="hier-item"><div class="hier-num">2</div><div class="hier-text"><strong>Normativní tabulky a seznamy kvazitaháku</strong> v rozsahu, v němž na ně pravidla odkazují</div></div>
    <div class="hier-item"><div class="hier-num">3</div><div class="hier-text"><strong>Současná spisovná čeština</strong> ve věcech, které soutěžní systém výslovně neupravuje</div></div>
    <div class="hier-item"><div class="hier-num">4</div><div class="hier-text"><strong>Konečný výklad kvaziautority</strong> v nejasném nebo sporném případě</div></div>
    <div class="spec-block" style="margin-top:10px">
      Technická implementace, databáze ani formulář nejsou vyšší autoritou než pravidla. Spravovaný katalog skutečných slov má pouze zvláštní autoritativní roli vymezenou v oddílu 9.
    </div>
  </div>

  <!-- ── §2 Soutěžní abeceda ── -->
  <div class="spec-section" id="s2">
    <h2><span class="spec-num">2</span>Soutěžní abeceda</h2>
    <div class="spec-block">
      <strong>Povolené znaky:</strong> <code>K V Q A Á Z I Í Y Ý</code><br><br>
      Velká a malá písmena jsou při kontrole řetězce i identity totožná. Diakritika se rozlišuje: <code>A ≠ Á</code>, <code>I ≠ Í</code>, <code>Y ≠ Ý</code>.
    </div>
    <div class="spec-block">
      <strong>Skórování:</strong> standardně má každý skutečně zapsaný soutěžní znak při sekundárním skórování hodnotu jednoho písmene. <code>Q = 1</code>, <code>KV = 2</code>. Jedinou zvláštní výjimkou je pět znaků normativního substantivního prefixu <code>kvazi-</code>, které mají skórovou hodnotu 0 (viz oddíl 4 a <a href="/tahak.php?sekce=kvazi">07-prefix-kvazi</a>).
    </div>
    <div class="spec-block">
      <code>Q</code> se vyslovuje <code>/kv/</code>, ale je <strong>samostatným soutěžním písmenem</strong>. Není zkratkou, ligaturou ani alternativním pravopisným zápisem dvojice <code>KV</code>. Při určování lemmatu, morfologie, soutěžní identity a při práci s jazykovými zdroji se <code>Q</code> nikdy automaticky nerozvíjí na <code>KV</code>. Shodná výslovnost sama o sobě nezakládá žádnou morfologickou, lexikální ani identitní shodu.
    </div>
  </div>

  <!-- ── §3 Motiv ── -->
  <div class="spec-section" id="s3">
    <h2><span class="spec-num">3</span>Motiv</h2>
    <div class="spec-block">
      Základní motiv je <code>KVAZI</code>. V každém výskytu lze nezávisle použít: na začátku <code>KV | Q</code>, dále <code>A | Á</code>, potom <code>Z</code>, nakonec <code>I | Í | Y | Ý</code>.
    </div>
    <div class="spec-motif-grid" aria-label="Úplné motivy">
      <?php foreach (['KVAZI','KVAZÍ','KVAZY','KVAZÝ','KVÁZI','KVÁZÍ','KVÁZY','KVÁZÝ','QAZI','QAZÍ','QAZY','QAZÝ','QÁZI','QÁZÍ','QÁZY','QÁZÝ'] as $m): ?>
        <div class="spec-motif-cell"><?= $m ?></div>
      <?php endforeach; ?>
    </div>
    <div class="spec-block">
      Celá věta po spojení slov musí být <strong>souvislým úsekem nepřetržité posloupnosti</strong> těchto motivů. Začátek a konec smějí ležet uvnitř motivu. Volba <code>Q</code> místo úvodního <code>KV</code> je pouze pravidlem tvorby motivu a nevytváří jazykovou ekvivalenci mezi <code>Q</code> a <code>KV</code>. Pravidla nevyžadují ani normativně neurčují konkrétní interní algoritmus rozkladu na motivy.
    </div>
  </div>

  <!-- ── §4 Slovo ── -->
  <div class="spec-section" id="s4">
    <h2><span class="spec-num">4</span>Slovo</h2>
    <div class="spec-block">
      Běžné slovo má 3–5 soutěžních znaků, je souvislou částí jediného motivu a nepřekračuje hranici dvou motivů.
    </div>
    <div class="spec-block">
      <strong>Jednopísmenné výjimky</strong> jsou předložky <code>k</code>, <code>v</code>, <code>z</code> a spojky <code>a</code>, <code>i</code>. Každé z těchto pěti slov lze použít nejvýše jednou. Předložky <code>k</code>, <code>v</code>, <code>z</code> se z herních důvodů používají vždy v nevokalizované podobě; <code>ke</code>, <code>ve</code>, <code>ze</code> se nepoužívají. Jinak zůstávají běžnými českými předložkami s rekcí: <code>k</code> + dativ, <code>v</code> + lokál nebo akuzativ podle významu, <code>z</code> + genitiv.
    </div>
    <div class="spec-block">
      Zvláštní substantivní prefix <code>kvazi-</code> je jedinou samostatně definovanou výjimkou z běžné délky a hranice slova. Jeho úplné normativní podmínky jsou pouze v <a href="/tahak.php?sekce=kvazi">07-prefix-kvazi</a>. Prefix je fyzicky součástí slova a při motivové validaci představuje právě jeden celý motiv <code>KVAZI</code>, ale jeho pět znaků se nezapočítává do limitu 3–5 znaků základu ani do sekundárního skóre.
    </div>
  </div>

  <!-- ── §5 Věta ── -->
  <div class="spec-section" id="s5">
    <h2><span class="spec-num">5</span>Věta</h2>
    <div class="spec-block">
      Kvazivěta je jedna jednoduchá věta s jedinou hlavní predikační osou. Musí obsahovat právě jeden podmět (s výjimkou pravidelně nevyjádřeného podmětu u dovoleného imperativu), <strong>právě jeden přísudek a právě jeden token plnovýznamového slovesa</strong>.
    </div>
    <div class="spec-block">
      Několikanásobný podmět a několikanásobný přísudek nejsou dovoleny. U oznamovací a tázací věty je podmět výslovně vyjádřen a má jednu řídící hlavu. Doplněk se nepovažuje za další hlavní predikační osu ani přísudek. Přístavek není dovolen. Elipsa obligatorního členu není dovolena.
    </div>
    <div class="spec-block">
      Všechna obligatorní doplnění vyplývající z obhájeného valenčního použití slovesa musí být ve větě výslovně realizována; jedinou zvláštní výjimkou je povolený nevyjádřený podmět imperativu. Celá syntaktická analýza musí být jedna propojená struktura kolem jediného přísudku. Syntaktické závislosti nesmějí tvořit kruh. Podmět a přísudek musí být v kategoriích, v nichž to čeština vyžaduje, v běžné morfosyntaktické shodě.
    </div>
    <div class="spec-block">
      <strong>Složené slovesné tvary a pomocné <code>být</code>:</strong> Povolené složené slovesné mechanismy a přesná uzavřená sada pomocných tvarů <code>být</code> jsou kanonicky definovány v <a href="/tahak.php?sekce=slovesa">04-slovesa</a>. Pomocné <code>být</code> není šestý produktivní kvazislovesný model ani druhé plnovýznamové sloveso. Každý skutečně zapsaný pomocný token je však samostatné soutěžní slovo: musí sám projít aktuálními povrchovými pravidly, počítá se jako jedno slovo do primárního skóre a jeho znaky standardně do sekundárního skóre. Všechny povolené pomocné tvary sdílejí jedinou soutěžní identitu <code>být</code>. Uzavřená pomocná sada <code>být</code> je normativní výjimka a nepodléhá katalogu skutečných slov.
    </div>
  </div>

  <!-- ── §6 Povolená syntax ── -->
  <div class="spec-section" id="s6">
    <h2><span class="spec-num">6</span>Povolená syntax</h2>
    <div class="spec-block">
      Povoleny jsou pouze hlavní syntaktické vztahy a konstrukce uvedené v normativním <a href="/tahak.php?sekce=syntax">01-syntax</a>: podmět, přísudek, předmět, přívlastek shodný, přívlastek neshodný, příslovečné určení, doplněk a koordinace pomocí <code>a</code> nebo <code>i</code>, pokud nevznikne několikanásobný podmět ani přísudek.
    </div>
    <div class="spec-block">
      Spojky <code>a</code>, <code>i</code> musí spojovat dvě výslovně přítomné souřadné části téže věty se stejnou hlavní syntaktickou funkcí. Lexikální rekce podstatných a přídavných jmen se v soutěži nepoužívá. Každý deklarovaný vztah musí splnit rozhodovací test své hlavní funkce. Není-li mezislovní podmínka výslovně soutěžně upravena, musí konstrukce obstát jako současná spisovná čeština.
    </div>
  </div>

  <!-- ── §7 Slovní druhy ── -->
  <div class="spec-section" id="s7">
    <h2><span class="spec-num">7</span>Slovní druhy</h2>
    <div class="spec-block">
      Povoleny jsou substantiva, adjektiva, slovesa, skutečná česká zájmena a <code>k</code>, <code>v</code>, <code>z</code>, <code>a</code>, <code>i</code>. <strong>Zakázány jsou</strong> číslovky, příslovce, částice, citoslovce a ostatní neuvedené slovní druhy. Nová kvazizájmena nelze vytvářet.
    </div>
    <div class="spec-block">
      <strong>Skutečná zájmena</strong> jsou zvláštní <em>real-word-only</em> kategorie. Nemají produktivní soutěžní morfologický model. Hráč deklaruje konkrétní použitý tvar, zájmenný lexém/lemma, slovní druh a relevantní morfologické vlastnosti. Platnost deklarace ověřuje katalog skutečných slov podle oddílu 9.
    </div>
  </div>

  <!-- ── §8 Kvazislovo ── -->
  <div class="spec-section" id="s8">
    <h2><span class="spec-num">8</span>Kvazislovo</h2>
    <div class="spec-block">
      Kvazislovo nemusí existovat v češtině ani mít konkrétní věcný význam. U každého kvazislova musí být v závazné analýze určeny údaje vyžadované příslušným kanonickým modelem: slovní druh, lemma/základní tvar, soutěžní morfologický model, konkrétní použitý tvar a další modelové vlastnosti.
    </div>
    <div class="spec-block">
      Znaková pravidla musí splňovat pouze konkrétní tvar použitý ve větě. Lemma a jiné tvary paradigmatu mohou obsahovat jiné znaky. Shoda zápisu se skutečným českým slovem sama o sobě neurčuje, zda jde o skutečné slovo nebo kvazislovo; rozhoduje celá soutěžní identita a stav katalogu. Výjimkou jsou zájmena, u nichž se nová kvazizájmena nevytvářejí.
    </div>
  </div>

  <!-- ── §9 Skutečné české slovo a katalog ── -->
  <div class="spec-section" id="s9">
    <h2><span class="spec-num">9</span>Skutečné české slovo a katalog</h2>
    <div class="spec-block">
      Pro soutěžní status skutečného slova je autoritou <strong>spravovaný katalog skutečných slov a tvarů</strong>. U kategorií řízených soutěžním morfologickým modelem lze skutečné slovo použít pouze tehdy, když jeho základní tvar, slovní druh a vlastnosti tvořící soutěžní identitu odpovídají schválené položce katalogu, konkrétní použitý tvar je pro tuto identitu schválený a současně odpovídá povolenému soutěžnímu morfologickému modelu.
    </div>
    <div class="spec-block">
      U zájmena katalog ověřuje konkrétní skutečný zájmenný lexém/lemma, jeho použitý tvar a deklarované morfologické vlastnosti.
    </div>
    <div class="spec-block">
      Není-li kandidátní skutečné slovo v katalogu schválené, řešitel může požádat kvaziautoritu o přezkoumání. Při správě katalogu může kvaziautorita vycházet zejména z IJP, ASSČ, dalších jazykových příruček, mluvnic a relevantních odborných zdrojů. Tyto zdroje samy nejsou přímým soutěžním whitelistem hráče. Katalog je průběžně spravovatelný; jeho jednotlivé opravy nevyžadují novou <code>rules_version</code>. Katalog není veřejně procházetelný. Hráč může nechat ověřit pouze hotový vlastní návrh: úplnou morfologickou identitu a konkrétní použitý tvar. Nepotvrzený exact match neznamená zamítnutí.
    </div>
    <div class="spec-block">
      Uzavřená pomocná sada <code>být</code> a jednopísmenná funkční slova <code>k/v/z/a/i</code> jsou explicitně normativně povolené a jejich povolení nezávisí na katalogu. U normativního prefixu <code>kvazi-</code> katalog případně potvrzuje pouze skutečný základ; prefixovaná odvozenina sama katalogové potvrzení nepotřebuje.
    </div>
  </div>

  <!-- ── §10 Morfologické modely ── -->
  <div class="spec-section" id="s10">
    <h2><span class="spec-num">10</span>Morfologické modely</h2>
    <div class="spec-block">
      Kvazislova i soutěžně použitelná skutečná slova v produktivních kategoriích se řídí <strong>uzavřenými</strong> soutěžními modely. Přesný aktuální výčet modelů, podmínky lemmatu, tvorba kmene, paradigmata a všechny povolené varianty jsou kanonicky definovány pouze v příslušných NORMATIVNÍCH modulech Kvazitaháku.
    </div>
    <div class="spec-block">
      Název modelu je herní označení inspirované češtinou, nikoli otevřený odkaz na všechny české dublety, alternace nebo lexikální výjimky. <strong>Reachability není součást definice modelu.</strong> Normativně povolený model nebo větev zůstává v pravidlech i tehdy, pokud žádná jeho realizace nemůže projít aktuálním znakovým/motivovým systémem. Úplná paradigmata a mechanika odvozování jsou výhradně v Kvazitaháku:
      <ul>
        <li>Substantiva → <a href="/tahak.php?sekce=substantiva">02-substantiva</a></li>
        <li>Adjektiva → <a href="/tahak.php?sekce=adjektiva">03-adjektiva</a></li>
        <li>Slovesa → <a href="/tahak.php?sekce=slovesa">04-slovesa</a></li>
      </ul>
    </div>
  </div>

  <!-- ── §11 Substantiva ── -->
  <div class="spec-section" id="s11">
    <h2><span class="spec-num">11</span>Substantiva</h2>
    <div class="spec-block">
      Substantiva používají právě uzavřené produktivní modely definované v NORMATIVNÍ části <a href="/tahak.php?sekce=substantiva">02-substantiva</a>. Tento modul je jediným kanonickým místem pro jejich aktuální výčet, pravidla kmene a úplná paradigmata. Všechny normativně definované modely zůstávají dostupné bez ohledu na reachability. Zvláštní prefix <code>kvazi-</code> se řídí <a href="/tahak.php?sekce=kvazi">07-prefix-kvazi</a>.
    </div>
  </div>

  <!-- ── §12 Adjektiva ── -->
  <div class="spec-section" id="s12">
    <h2><span class="spec-num">12</span>Adjektiva</h2>
    <div class="spec-block">
      Adjektiva používají právě uzavřené produktivní modely definované v NORMATIVNÍ části <a href="/tahak.php?sekce=adjektiva">03-adjektiva</a>; tento modul je jediným kanonickým místem pro jejich aktuální výčet, odvozování, paradigmata a přesnou mechaniku stupňování. Ve v1 je stupňování dovoleno pouze u modelů, které jej tento kanonický modul výslovně dovoluje. Přivlastňovací adjektiva se nestupňují. Krátké/jmenné tvary nejsou ve v1 povoleny.
    </div>
  </div>

  <!-- ── §13 Slovesa a valence ── -->
  <div class="spec-section" id="s13">
    <h2><span class="spec-num">13</span>Slovesa a valence</h2>
    <div class="spec-block">
      Kvazisloveso používá jeden z uzavřených soutěžních časovacích typů definovaných v NORMATIVNÍ části <a href="/tahak.php?sekce=slovesa">04-slovesa</a>, volí vid z hodnot <code>nedokonavý</code>, <code>dokonavý</code>, <code>obouvidový</code> a obsahuje slovní valenční obhajobu konkrétního použití ve větě. Morfologickou soutěžní identitu slovesa tvoří <code>infinitiv + soutěžní časovací typ</code>; vid ani valence samy o sobě novou identitu nevytvářejí.
    </div>
    <div class="spec-block">
      Přesný výčet časovacích typů, jejich paradigmata, povolené slovesné mechanismy a uzavřená pomocná sada <code>být</code> jsou kanonicky definovány pouze v <a href="/tahak.php?sekce=slovesa">04-slovesa</a>.
    </div>
    <div class="spec-block">
      <strong>Valence</strong> není samostatný strukturovaný soutěžní model. Hráč ji obhajuje volným textem. Z obhajoby musí být srozumitelné, jaká doplnění zvolené použití slovesa vyžaduje, která slova nebo části kvazivěty je realizují a o jaké konkrétní současné české sloveso a jeho použití se obhajoba opírá. Všechna obligatorní doplnění musí být ve větě výslovně realizována. Podrobnosti: <a href="/tahak.php?sekce=valence">05-valence</a>.
    </div>
  </div>

  <!-- ── §14 Fiktivní význam ── -->
  <div class="spec-section" id="s14">
    <h2><span class="spec-num">14</span>Fiktivní význam</h2>
    <div class="spec-block">
      Kvazislovo může mít fiktivní význam. Ten může pomoci obhájit syntaktickou roli, ale nesmí vytvářet novou identitu, měnit morfologii, zakládat nepovolenou rekci, nahrazovat valenční obhajobu ani obcházet soutěžní omezení.
    </div>
    <div class="spec-block">
      Fiktivní význam lze použít pouze v rámci výslovně povoleného syntaktického vztahu. Pokud je pro platnost konstrukce podstatný, musí použití odpovídat současné spisovné české analogii stejného hlavního vztahu.
    </div>
  </div>

  <!-- ── §15 Soutěžní identita ── -->
  <div class="spec-section" id="s15">
    <h2><span class="spec-num">15</span>Soutěžní identita</h2>
    <div class="spec-block">
      Jednou použitá soutěžní identita je v dané větě vyčerpaná.
      <ul>
        <li><strong>Substantivum:</strong> <code>lemma + rod + životnost (je-li relevantní) + soutěžní skloňovací model</code>; pád a číslo novou identitu nevytvářejí. Normativní <code>kvazi-</code> vytváří od základu odlišnou identitu, ale morfologické a syntaktické vlastnosti základu mechanicky dědí.</li>
        <li><strong>Adjektivum:</strong> <code>lemma / základní tvar + soutěžní skloňovací model</code>; rod, pád, číslo, stupeň a syntaktická funkce novou identitu nevytvářejí.</li>
        <li><strong>Sloveso:</strong> <code>infinitiv + soutěžní časovací typ</code>; vid ani valence novou identitu nevytvářejí.</li>
        <li><strong>Pomocné <code>být</code>:</strong> všechny povolené pomocné tvary sdílejí jedinou soutěžní identitu <code>být</code>.</li>
        <li><strong>Zájmeno:</strong> konkrétní zájmenný lexém/lemma; jeho morfologické tvary novou identitu nevytvářejí.</li>
        <li><strong>Funkční jednopísmenná slova:</strong> <code>k</code>, <code>v</code>, <code>z</code>, <code>a</code>, <code>i</code> jsou jednotlivé identity; každou lze použít nejvýše jednou.</li>
      </ul>
      Rozdíl mezi <code>Q</code> a <code>KV</code> není variantním zápisem téže identity. Rozdíl velkých/malých písmen identitu nemění.
    </div>
  </div>

  <!-- ── §16 Interpunkce ── -->
  <div class="spec-section" id="s16">
    <h2><span class="spec-num">16</span>Interpunkce</h2>
    <div class="spec-block">
      Uvnitř soutěžního zápisu nejsou čárky, středníky, dvojtečky, pomlčky, spojovníky, závorky, uvozovky, lomítka, apostrofy ani jiná pomocná znaménka. Nelze použít konstrukci, která by takové znaménko podle současné spisovné normy vyžadovala.
    </div>
    <div class="spec-block">
      Hráč deklaruje typ věty: oznamovací → <code>.</code>, tázací → <code>?</code>, rozkazovací → <code>!</code>. Závěrečné znaménko není soutěžním znakem a nepočítá se do délky.
    </div>
  </div>

  <!-- ── §17 Analýza řešení a veřejný detail ── -->
  <div class="spec-section" id="s17">
    <h2><span class="spec-num">17</span>Analýza řešení a veřejný detail</h2>
    <div class="spec-block">
      Stačí jedna úplná a interně konzistentní analýza. Řešitel nemusí dokazovat, že jiná možná analýza neexistuje. Odevzdání musí obsahovat úplná data vyžadovaná aktuálními modely a field schematem, včetně plné morfologické deklarace a případných obhajob. U slovesa je povinná slovní valenční obhajoba. Konkrétní UI ani datový model nesmějí měnit jazykovou platnost.
    </div>
    <div class="spec-block">
      <strong>Veřejné zveřejnění schválené věty:</strong> Úplný rozhodcovský spis není veřejným výstupem. V seznamu schválených vět se zveřejňuje zejména věta, počet slov, počet soutěžních znaků a autor/spoluautoři. V detailu lze u jednotlivých slov zveřejnit: použitý tvar, skutečné slovo/kvazislovo, slovní druh, lemma, soutěžní model, základní vlastnosti konkrétního tvaru a syntaktickou roli. Kompletní paradigma, úplná morfologická obhajoba, interní review, důkazní podklady a katalogové interní stavy zůstávají neveřejné.
    </div>
  </div>

  <!-- ── §18 Zdroje a důkazní břemeno ── -->
  <div class="spec-section" id="s18">
    <h2><span class="spec-num">18</span>Zdroje a důkazní břemeno</h2>
    <div class="spec-block">
      Důkazní břemeno v jazykovém sporu nese řešitel. Status skutečného soutěžního slova se neposuzuje přímým splněním jednoho povinného externího slovníku, ale podle katalogu z oddílu 9.
    </div>
    <div class="spec-block">
      Při námitce mohou být relevantní zejména IJP, ASSČ a další zdroje ÚJČ, akademické a vysokoškolské mluvnice, odborné slovníky a publikace a jiné relevantní odborné zdroje. Náhodný internetový výskyt sám o sobě nestačí. U kvazislova se nedokládá existence slova, ale pravidlo/model; u valence jazyková analogie konkrétního použití slovesa.
    </div>
  </div>

  <!-- ── §19 Nástroje, fair play a důvěra ── -->
  <div class="spec-section" id="s19">
    <h2><span class="spec-num">19</span>Nástroje, fair play a důvěra</h2>
    <div class="spec-block">
      Úplná normativní politika používání nástrojů je v <a href="#ai">Příloze A</a>. Základní duch je: <strong>AI smí vysvětlit hru, nesmí ji za hráče hrát.</strong> Automatický nástroj nesmí za hráče hledat, generovat, skládat nebo optimalizovat soutěžní kandidáty.
    </div>
    <div class="spec-block">
      Dodržování stojí na fair play a vzájemné důvěře. Projekt nevyžaduje pracovní logy, screenshoty, historii promptů ani jiný dohledový důkaz a nevytváří vyšetřovací režim používání nástrojů.
    </div>
  </div>

  <!-- ── §20 Platnost, uznání a kvaziautorita ── -->
  <div class="spec-section" id="s20">
    <h2><span class="spec-num">20</span>Platnost, uznání a kvaziautorita</h2>
    <div class="spec-block">
      Kvaziautorita je konečnou autoritou a rozhoduje, zda je řešení podle příslušné verze pravidel platné. Normativní dokumentace je závazným kanonickým záznamem jejích přijatých rozhodnutí; zjistí-li se rozpor v dokumentaci, musí být opraven.
    </div>
    <div class="spec-block">
      Jazykově platné a řádně podané řešení nelze odmítnout pouze proto, že využívá neočekávanou nebo nežádoucí vlastnost pravidel. Pravidlovou díru lze zavřít až v nové verzi pravidel. Oprava nebo doplnění katalogu skutečných slov je běžná provozní správa.
    </div>
    <div class="spec-block">
      Nepravdivé nebo zfalšované údaje v samotném podání mohou vést k jeho zamítnutí. Projekt neprovádí forenzní kontrolu toho, jak hráč řešení hledal.
    </div>
  </div>

  <!-- ── §21 Skóre ── -->
  <div class="spec-section" id="s21">
    <h2><span class="spec-num">21</span>Skóre</h2>
    <div class="spec-block">
      <strong>Primární:</strong> počet skutečně zapsaných slov. Každý samostatný pomocný token <code>být</code> se počítá jako samostatné slovo; normativní prefix <code>kvazi-</code> je součástí jediného substantiva a další slovo nevytváří.
    </div>
    <div class="spec-block">
      <strong>Sekundární:</strong> počet soutěžních znaků bez mezer. <code>Q</code> se počítá jako jeden skutečně zapsaný znak a <code>KV</code> jako dva. <strong>Jedinou zvláštní výjimkou je pět znaků normativního prefixu <code>kvazi-</code>, které se do sekundárního skóre nezapočítávají.</strong>
    </div>
    <div class="spec-block">
      Shoda obou hodnot = společný rekord. Pořadí podání nerozhoduje.
    </div>
  </div>

  <!-- ── §22 Reachability a slepé cesty ── -->
  <div class="spec-section" id="s22">
    <h2><span class="spec-num">22</span>Reachability a slepé cesty</h2>
    <div class="spec-block">
      <strong>Reachability je analytická vlastnost pravidel, nikoli normativní filtr.</strong> Normativně povolený model, morfologická větev nebo jiný mechanismus zůstává součástí pravidel i při prokázané nedosažitelnosti. Nedosažitelnost není důvodem volbu skrýt, zakázat, odstranit z UI ani přesunout do hraniční kapitoly.
    </div>
    <div class="spec-block">
      Hráčské materiály nemají známé slepé cesty označovat nebo prozrazovat jen proto, že je interní audit zjistil. Konkrétní hráčův použitý povrchový tvar musí vždy splnit aktuální znaková, motivová, morfologická a syntaktická pravidla.
    </div>
  </div>

  <!-- ── §23 Autorství, spolupráce a navazování ── -->
  <div class="spec-section" id="s23">
    <h2><span class="spec-num">23</span>Autorství, spolupráce a navazování</h2>
    <div class="spec-block">
      Kvazi je otevřený kumulativní problém. Zveřejněné schválené řešení, jednotlivé kvazislovo, konstrukci nebo jiný zveřejněný nápad smí kdokoli použít, upravit nebo rozvíjet. Na jednotlivé herní nápady se nezavádí výlučné vlastnictví.
    </div>
    <div class="spec-block">
      Lidé smějí řešení konzultovat a tvořit společně; jedno podání může mít více spoluautorů. Autorem konkrétního podání je osoba/skupina uvedená u tohoto podání a předchozí rekordy ani jejich autoři se zpětně nemažou. Přesná kopie existující věty sama nevytváří nový delší rekord. Veřejné zveřejnění podle oddílu 17 vytváří legitimní společnou znalost hry.
    </div>
  </div>

  <!-- ════════════════════ PŘÍLOHA A — AI policy ════════════════════ -->
  <div class="spec-section" id="ai">
    <span class="spec-appendix-label">Příloha A — Politika nástrojů a AI</span>
    <h2><span class="spec-num">A</span>Nástroje a AI — normativní politika</h2>

    <div class="spec-block">
      <strong>Kvazi je hra založená na důvěře.</strong> Soutěžní řešení má vzniknout lidskou hlavou. Pravidla práce s nástroji nejsou policejní režim — projekt nebude sledovat, jak hráč pracuje, nebude vyžadovat logy, screenshoty, historii promptů ani jiné důkazy a nebude zpětně vyšetřovat, zda někdo použil zakázaný nástroj. Odesláním řešení hráč říká: <em>hrál jsem fér a řešení jsem vytvořil v duchu těchto pravidel.</em>
    </div>

    <div class="spec-block">
      <strong>Co je v pořádku:</strong>
      <ul>
        <li>číst pravidla, slovníky, příručky, knihy a další jazykové zdroje,</li>
        <li>dělat si vlastní poznámky,</li>
        <li>počítat nebo mechanicky kontrolovat znaková a jiná jednoduchá pravidla,</li>
        <li>použít soutěžní aplikaci k tomu, k čemu je veřejně určená,</li>
        <li>požádat AI, aby vysvětlila pravidlo hry nebo obecný jazykový pojem.</li>
      </ul>
      AI tedy může pomoci <strong>pochopit hru</strong>. Může například vysvětlit, co je lemma, valence nebo doplněk.
    </div>

    <div class="spec-block">
      <strong>Co není fér</strong> — nechat AI, skript, solver, crawler, makro nebo jiný automatický postup:
      <ul>
        <li>hledat nebo generovat kandidátní slova či věty,</li>
        <li>navrhovat rozdělení slov, morfologickou nebo syntaktickou analýzu konkrétního soutěžního případu,</li>
        <li>opravovat nebo vylepšovat konkrétní hráčovo řešení,</li>
        <li>hromadně prohledávat nebo filtrovat kandidáty podle omezení Kvazi,</li>
        <li>skládat, porovnávat, skórovat nebo optimalizovat možné varianty,</li>
        <li>dávkově testovat velké množství možností s cílem najít platné nebo lepší řešení.</li>
      </ul>
      Jednoduchá hranice: <strong>AI ti smí vysvětlit hru. Nesmí ji za tebe hrát.</strong>
    </div>

    <div class="spec-block">
      <strong>Soutěžní aplikace</strong> může dělat deterministické kontroly jako součást své veřejné funkce. Nemá hráči navrhovat lepší slovo, jiný tvar, jinou syntaktickou vazbu ani lepší řešení. Interní katalogy a rozhodcovské nástroje mohou sloužit ke správě soutěže a posuzování odeslaných řešení; nejsou vyhledávačem kandidátů pro hráče.
    </div>

    <div class="spec-block">
      <strong>Vývoj a správa projektu:</strong> Tato omezení jsou pravidlem pro soutěžní řešení, ne zákazem používat moderní nástroje při vývoji projektu. AI, skripty a automatizace lze používat při návrhu a auditu pravidel, vývoji aplikace, testování, správě dat nebo přípravě interních podkladů. Takto vzniklý obsah se ale nesmí vydávat za lidské soutěžní řešení.
    </div>
  </div>

  <!-- ════════════════════ PŘÍLOHA B — Verzování ════════════════════ -->
  <div class="spec-section" id="verze">
    <span class="spec-appendix-label">Příloha B — Verzování a správa soutěže</span>
    <h2><span class="spec-num">B</span>Verzování a správa</h2>

    <div class="spec-block">
      <strong>Verze pravidel:</strong> Každé zveřejněné znění pravidel má jednoznačnou <code>rules_version</code>. Společně se verzují rozhodcovská specifikace, AI/tool policy, výslovně normativní části kvazitaháku a další pravidlové artefakty. Každá vydaná verze má neměnný manifest normativního balíku s identifikátorem/cestou každé normativní součásti a jejím kryptografickým hashem. Normativní číselníky, paradigmata a jiné strojově čitelné definice pravidel musí být součástí stejného verzovaného normativního balíku; nesmějí se pod stejnou <code>rules_version</code> tiše změnit pouze v DB nebo kódu.
    </div>

    <div class="spec-block">
      <strong>Výjimkou je spravovaný katalog skutečných slov</strong> — ten je záměrně provozní a průběžně opravitelnou autoritou, nikoli neměnnou součástí <code>rules_version</code>. Průběžná oprava nebo doplnění katalogu se za změnu pravidla nepovažuje a novou verzi sama o sobě nevyžaduje.
    </div>

    <div class="spec-block">
      <strong>Výklad vs. změna:</strong> Bez nové verze jsou v pravidlových artefaktech přípustné pouze čistě redakční nebo vysvětlující úpravy, které nemění soutěžní pravidlo. Změna soutěžního pravidla nebo autoritativního výkladu, který mění význam pravidel, vyžaduje novou <code>rules_version</code>. Je-li neočekávaný exploit podle aktuální verze platný, řešení se uzná; exploit lze uzavřít až novou verzí pravidel.
    </div>

    <div class="spec-block">
      <strong>Podání, revize a historie:</strong> Pracovní draft je editovatelný. Každé odeslání vytváří neměnnou <code>sentence_revision</code>, která zachycuje přesný obsah a strukturovanou deklaraci v okamžiku submitu. Administrativní rozhodnutí, validační výsledky, katalogová kontrola a skóre se vážou ke konkrétní immutable revizi, nikoli k později změněnému draftu. Řešení se historicky váže k verzi pravidel platné při jeho podání. Již schválené řešení je historický fakt; běžná průběžná správa katalogu skutečných slov není důvodem k jeho bezdůvodnému zpětnému rušení.
    </div>

    <div class="spec-block">
      <strong>Revalidace:</strong> Stejná immutable revize může být bez nového podání znovu posouzena podle novější verze pravidel. Nové posouzení vytváří nový validační výsledek; nepřepisuje starý verdikt. Aktuální žebříček používá pouze řešení platná a uznaná podle aktuální <code>rules_version</code>. Historické výsledky podle starších verzí zůstávají zachované.
    </div>

    <div class="spec-block">
      <strong>Katalog skutečných slov:</strong> Pro soutěžní status skutečného slova je autoritou ručně spravovaný katalog. Je-li odpovídající soutěžní identita a konkrétní použitý tvar v katalogu schválený, považuje se pro soutěž za skutečné slovo. Není-li v katalogu, může hráč požádat o přezkoumání nebo vznést námitku. Kvaziautorita může po jazykovém ověření katalog doplnit, opravit nebo zpřesnit. IJP, ASSČ a další zdroje mohou sloužit jako podklady, ale nejsou samy přímým soutěžním whitelistem. Katalog se nezveřejňuje jako procházetelný seznam; hráč může požádat pouze o kontrolu vlastního kompletního návrhu.
    </div>

    <div class="spec-block">
      <strong>Autorství, spolupráce a navazování:</strong> Kvazi je otevřený kumulativní problém. Zveřejněné schválené řešení se stává legitimní součástí společné znalosti hry. Na zveřejněné řešení lze navázat, upravit je nebo je prodloužit; lze převzít jednotlivé slovo, kvazislovo, morfologický nápad, syntaktickou konstrukci nebo jinou část. Jednotlivé herní nápady nejsou předmětem výhradního soutěžního vlastnictví. Na jednom podání může spolupracovat více lidí.
    </div>

    <div class="spec-block">
      <strong>Kvaziautorita</strong> rozhoduje jazykovou a pravidlovou platnost řešení, interpretační spory a námitky proti katalogu skutečných slov. Nevede disciplinární řízení o tom, jak hráč řešení vytvořil. Nemůže odmítnout řádné, platné řešení pouze proto, že se jí způsob využití pravidel nelíbí.
    </div>
  </div>

</main>

<?php include __DIR__ . '/includes/footer.php'; ?>
</body>
</html>
