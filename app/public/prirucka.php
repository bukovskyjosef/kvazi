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
    .spec-section { margin-bottom: 48px; }
    .spec-section h2 {
      font-size: 18px; font-weight: 800; letter-spacing: -.02em;
      color: var(--text); margin-bottom: 18px; padding-bottom: 10px;
      border-bottom: 1px solid var(--border); display:flex; align-items:center; gap:10px;
    }
    .spec-num {
      display:inline-flex; align-items:center; justify-content:center; min-width:28px; height:28px;
      border-radius:7px; background:rgba(255,179,92,.1); border:1px solid rgba(255,179,92,.22);
      color:var(--accent); font-size:12px; font-weight:800; padding:0 6px; flex-shrink:0;
    }
    .spec-block {
      background:var(--glass); border:1px solid var(--border); border-radius:10px;
      padding:16px 20px; margin-bottom:10px; font-size:13px; line-height:1.7; color:var(--text-muted);
    }
    .spec-block strong { color:var(--text); }
    .spec-block code { font-family:'Courier New',monospace; background:rgba(255,179,92,.1); color:var(--accent-3); padding:.1em .35em; border-radius:4px; font-size:.9em; }
    .spec-block ul,.spec-block ol { padding-left:20px; }
    .spec-block li { margin-bottom:5px; }
    .spec-block a,.authority-note a { color:var(--accent); }
    .authority-note {
      background:rgba(255,179,92,.07); border:1px solid rgba(255,179,92,.25); border-radius:12px;
      padding:16px 20px; margin:0 0 32px; font-size:13px; line-height:1.65; color:var(--text-muted);
    }
    .authority-note strong { color:var(--text); }
    .spec-toc { background:var(--glass); border:1px solid var(--border); border-radius:12px; padding:20px 24px; margin-bottom:40px; }
    .spec-toc h2 { font-size:13px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:var(--text-dim); margin:0 0 14px; }
    .spec-toc ol { columns:2; column-gap:28px; padding-left:22px; margin:0; font-size:12px; line-height:1.8; color:var(--text-muted); }
    .spec-toc li { break-inside:avoid; }
    .spec-toc a { color:var(--accent); text-decoration:none; }
    @media (max-width:600px) { .spec-toc ol { columns:1; } }
    .model-table { width:100%; border-collapse:collapse; margin-top:10px; font-size:12px; }
    .model-table th,.model-table td { border:1px solid var(--border); padding:6px 8px; text-align:left; }
    .model-table th { color:var(--text); background:rgba(255,255,255,.02); }
  </style>
</head>
<body>
<?php include __DIR__ . '/includes/nav.php'; ?>

<main class="container page-body">
  <div class="page-header">
    <span class="section-tag">Odvozená veřejná příručka</span>
    <h1>Rozhodcovská <em>příručka</em></h1>
    <p>Veřejná projekce aktuálních pravidel pro orientaci hráčů a rozhodování. Tato stránka sama není normativním source of truth.</p>
  </div>

  <div class="authority-note">
    <strong>Autorita pravidel:</strong> veřejná příručka slouží jako přehled. Přesné závazné podmínky se řídí aktuální soutěžní dokumentací a závěry rozhodčích. Pokud se tato projekce s platným pravidlem rozchází, platné pravidlo má přednost.
  </div>

  <nav class="spec-toc" aria-label="Obsah příručky">
    <h2>Obsah</h2>
    <ol>
      <li><a href="#s1">Autorita a výklad</a></li>
      <li><a href="#s2">Abeceda, motiv a slovo</a></li>
      <li><a href="#s3">Věta a syntax</a></li>
      <li><a href="#s4">Slovní druhy a morfologie</a></li>
      <li><a href="#s5">Skutečné slovo a katalogy</a></li>
      <li><a href="#s6">Soutěžní identita</a></li>
      <li><a href="#s7">Co hráč odevzdává</a></li>
      <li><a href="#s8">Valence a fiktivní význam</a></li>
      <li><a href="#s9">Interpunkce a skóre</a></li>
      <li><a href="#s10">Zdroje a rozhodování</a></li>
      <li><a href="#s11">AI, nástroje a fair play</a></li>
      <li><a href="#s12">Autorství a spolupráce</a></li>
      <li><a href="#s13">Verzování a revalidace</a></li>
      <li><a href="#s14">Reachability a slepé cesty</a></li>
    </ol>
  </nav>

  <section class="spec-section" id="s1">
    <h2><span class="spec-num">1</span>Autorita a výklad</h2>
    <div class="spec-block"><strong>Konečným decision ownerem je kvaziautorita / Josef Bukovský.</strong> Normativní dokumentace je kanonický záznam přijatých rozhodnutí. Žádná veřejná PHP stránka, UI, databáze ani validační kód nesmějí vytvářet nové soutěžní pravidlo.</div>
    <div class="spec-block">Neexistuje jeden soubor „úplných pravidel“. Jednotlivé části normativního balíku mají vlastní oblast odpovědnosti podle <a href="<?= htmlspecialchars($repo . 'docs/README.md') ?>">centrální mapy autority</a>. Současná spisovná čeština se použije tam, kde soutěžní systém danou věc výslovně neupravuje.</div>
    <div class="spec-block">Pokud si dva normativní zdroje skutečně odporují, jde o governance defect. Rozpor se nesmí řešit kreativním výkladem odvozené dokumentace; musí jej rozhodnout kvaziautorita a kanonické artefakty se následně sjednotí.</div>
  </section>

  <section class="spec-section" id="s2">
    <h2><span class="spec-num">2</span>Abeceda, motiv a slovo</h2>
    <div class="spec-block"><strong>Soutěžní znaky:</strong> <code>K V Q A Á Z I Í Y Ý</code>. Velikost písmen se při kontrole řetězce a identity nerozlišuje; diakritika ano. <code>Q</code> je samostatný soutěžní znak, nikoli alternativní zápis <code>KV</code>.</div>
    <div class="spec-block">Motiv vychází z <code>KVAZI</code>: začátek <code>KV | Q</code>, dále <code>A | Á</code>, potom <code>Z</code> a nakonec <code>I | Í | Y | Ý</code>. Věta po spojení slov musí tvořit souvislý úsek nepřetržité posloupnosti povolených motivů; začátek i konec mohou ležet uvnitř motivu.</div>
    <div class="spec-block">Běžné slovo má 3–5 soutěžních znaků a leží celé uvnitř jednoho motivu. Jednopísmenné výjimky jsou pouze <code>k</code>, <code>v</code>, <code>z</code>, <code>a</code>, <code>i</code>, každé nejvýše jednou. Předložky zůstávají nevokalizované: <code>k</code> + dativ, <code>v</code> + lokál/akuzativ, <code>z</code> + genitiv.</div>
    <div class="spec-block"><strong>Prefix <code>kvazi-</code></strong> je zvláštní mechanismus pouze pro substantiva. Připojuje se právě jako doslovné <code>kvazi</code>, nejvýše jednou; základ musí zůstat sám plně platný i na témže místě věty po odstranění prefixu. Prefix nemění rod, životnost, model ani syntaktické chování základu. Prefixované substantivum je jedna nová soutěžní identita a jedno slovo; pět prefixových znaků je při sekundárním skóre neutrálních. Přesné podmínky spravuje kanonický modul <a href="<?= htmlspecialchars($repo . 'docs/kvazitahak/07-prefix-kvazi.md') ?>">07-prefix-kvazi.md</a>.</div>
  </section>

  <section class="spec-section" id="s3">
    <h2><span class="spec-num">3</span>Věta a syntax</h2>
    <div class="spec-block">Kvazivěta je jedna jednoduchá věta s jedinou hlavní predikační osou. Má právě jeden přísudek a právě jeden plnovýznamový slovesný token. Podmět je právě jeden; pouze u dovoleného imperativu může být pravidelně nevyjádřený. Několikanásobný podmět ani několikanásobný přísudek nejsou dovoleny.</div>
    <div class="spec-block">Povolené hlavní syntaktické vztahy jsou pouze: podmět, přísudek, předmět, přívlastek shodný, přívlastek neshodný, příslovečné určení, doplněk a koordinace pomocí <code>a</code> nebo <code>i</code>. Celá analýza musí být propojená a bez kruhových závislostí; každý vztah musí splnit svůj rozhodovací test z kanonického <a href="<?= htmlspecialchars($repo . 'docs/kvazitahak/01-syntax.md') ?>">modulu syntaxe</a>.</div>
    <div class="spec-block">Doplněk nevytváří druhou predikační osu. Koordinace smí spojit dvě výslovně přítomné souřadné části stejné hlavní funkce, ale nesmí vytvořit více podmětových hlav ani více přísudků. Přístavek a elipsa obligatorního členu nejsou dovoleny.</div>
    <div class="spec-block">Povolené pomocné tvary <code>být</code> tvoří s plnovýznamovým slovesem jediný přísudek. Každý skutečně zapsaný pomocný token je ale samostatné soutěžní slovo, prochází povrchovou validací a standardně se skóruje; všechny povolené pomocné tvary sdílejí jednu soutěžní identitu <code>být</code> a nepodléhají katalogu skutečných slov. Přesná sada je v <a href="<?= htmlspecialchars($repo . 'docs/kvazitahak/04-slovesa.md') ?>">04-slovesa.md</a>.</div>
  </section>

  <section class="spec-section" id="s4">
    <h2><span class="spec-num">4</span>Slovní druhy a morfologie</h2>
    <div class="spec-block">Povolena jsou substantiva, adjektiva, slovesa, skutečná česká zájmena a funkční slova <code>k/v/z/a/i</code>. Číslovky, příslovce, částice, citoslovce a ostatní neuvedené slovní druhy se nepoužívají. Zájmena jsou pouze <em>real-word-only</em>; nová kvazizájmena se nevytvářejí.</div>
    <div class="spec-block">Produktivní morfologie používá uzavřené herní modely. Názvy vzorů nejsou otevřeným odkazem na všechny dublety či výjimky běžné češtiny. Jedna normativní buňka má jednu kanonickou realizaci; přesné kmeny, paradigmata a mechanismy spravují NORMATIVNÍ části modulů kvazitaháku.</div>
    <table class="model-table">
      <thead><tr><th>Kategorie</th><th>Aktuální uzavřené modely</th><th>Kanonický detail</th></tr></thead>
      <tbody>
        <tr><td>Substantiva</td><td><code>pán</code>, <code>muž</code>, <code>předseda</code>, <code>soudce</code>, <code>hrad</code>, <code>stroj</code>, <code>žena</code>, <code>růže</code>, <code>píseň</code>, <code>kost</code>, <code>město</code>, <code>moře</code>, <code>kuře</code>, <code>stavení</code></td><td><a href="<?= htmlspecialchars($repo . 'docs/kvazitahak/02-substantiva.md') ?>">02-substantiva</a></td></tr>
        <tr><td>Adjektiva</td><td><code>mladý</code>, <code>jarní</code>, <code>otcův</code>, <code>matčin</code></td><td><a href="<?= htmlspecialchars($repo . 'docs/kvazitahak/03-adjektiva.md') ?>">03-adjektiva</a></td></tr>
        <tr><td>Slovesa</td><td><code>V-AT</code>, <code>V-IT</code>, <code>V-NOUT</code>, <code>V-ÝT</code>, <code>V-OVAT</code></td><td><a href="<?= htmlspecialchars($repo . 'docs/kvazitahak/04-slovesa.md') ?>">04-slovesa</a></td></tr>
      </tbody>
    </table>
    <div class="spec-block" style="margin-top:10px">Vid slovesa je <code>nedokonavý</code>, <code>dokonavý</code> nebo <code>obouvidový</code>; není součástí soutěžní identity slovesa. U modelů <code>mladý</code> a <code>jarní</code> je dovoleno normativně definované stupňování, přivlastňovací modely se nestupňují. Přesné podmínky vždy určuje příslušný kanonický modul, nikoli tato projekce.</div>
  </section>

  <section class="spec-section" id="s5">
    <h2><span class="spec-num">5</span>Skutečné slovo a katalogy</h2>
    <div class="spec-block"><strong>Spravovaný katalog skutečných slov</strong> je zvláštní lexikální autorita pro status skutečné slovo / kvazislovo. Hráč k němu smí pouze exact-match kontrolu vlastního kompletního návrhu: úplné soutěžní identity a konkrétního použitého tvaru. Katalog není veřejný browse, autocomplete ani nástroj pro hledání kandidátů. Chybějící exact match sám o sobě není zamítnutí; kandidát může jít k ručnímu posouzení.</div>
    <div class="spec-block"><strong>Interní morfologická review cache</strong> je jiná vrstva: neveřejná provozní paměť předchozích morfologických posouzení, scoped na konkrétní <code>rules_version</code>. Hráč k ní nemá membership lookup. Tyto dvě katalogové vrstvy se nesmějí významově slévat.</div>
    <div class="spec-block">IJP, ASSČ, mluvnice a další odborné zdroje mohou být podkladem při správě katalogu nebo jazykovém sporu, nejsou samy přímým soutěžním whitelistem. Jednopísmenná funkční slova a uzavřená pomocná sada <code>být</code> jsou povoleny normativně a katalogu skutečných slov nepodléhají. U prefixovaného substantiva případný katalogový status řeší základ.</div>
  </section>

  <section class="spec-section" id="s6">
    <h2><span class="spec-num">6</span>Soutěžní identita</h2>
    <div class="spec-block">Stejnou soutěžní identitu nelze v jedné větě použít dvakrát, ani když se změní konkrétní tvar, význam nebo syntaktická funkce.</div>
    <div class="spec-block"><ul>
      <li><strong>substantivum:</strong> lemma + rod + relevantní životnost + soutěžní model; normativní <code>kvazi-</code> vytváří od základu odlišnou identitu,</li>
      <li><strong>adjektivum:</strong> základní lemma/odvození + soutěžní model; rod, číslo, pád a stupeň samy novou identitu nevytvářejí,</li>
      <li><strong>sloveso:</strong> infinitiv + soutěžní časovací typ; vid ani valence identitu nemění,</li>
      <li><strong>pomocné být:</strong> všechny povolené pomocné tvary sdílejí identitu <code>být</code>,</li>
      <li><strong>zájmeno:</strong> lexém/lemma,</li>
      <li><strong>k/v/z/a/i:</strong> každé je vlastní identita a lze je použít nejvýše jednou.</li>
    </ul></div>
  </section>

  <section class="spec-section" id="s7">
    <h2><span class="spec-num">7</span>Co hráč odevzdává</h2>
    <div class="spec-block">Stačí jedna úplná a interně konzistentní analýza; hráč nemusí dokazovat, že neexistuje jiná možná analýza. U produktivního slova podání obsahuje údaje, které jednoznačně určují <strong>soutěžní identitu, morfologické vlastnosti konkrétního použitého tvaru a samotný použitý <code>surfaceForm</code></strong>, plus syntaktickou analýzu a potřebné obhajoby nebo zdroje.</div>
    <div class="spec-block"><strong>Hráč ručně nevyplňuje celé paradigma ani nepoužité tvary.</strong> Normativní paradigma zůstává pravidlem pro deterministickou kontrolu konkrétní deklarace: z identity a vlastností konkrétního použití systém odvodí právě jeden očekávaný tvar a porovná jej s hráčem zadaným tvarem. U slovesa je navíc povinný vid a slovní valenční obhajoba.</div>
    <div class="spec-block">Veřejný detail schválené věty standardně ukazuje větu, skóre a veřejnou identitu (<code>username</code>) jednoho registrovaného účtu, který podání vlastní a odevzdal. U slov lze zveřejnit použitý tvar, status skutečné/kvazi, POS, lemma, model, základní vlastnosti konkrétního použití a syntaktickou roli. Celé paradigma, interní review, kompletní důkazní spis a interní katalogové stavy se standardně nezveřejňují.</div>
  </section>

  <section class="spec-section" id="s8">
    <h2><span class="spec-num">8</span>Valence a fiktivní význam</h2>
    <div class="spec-block">Valence není kód ani uzavřený strukturovaný rámec a není součástí soutěžní identity slovesa. Hráč ji obhajuje volným textem: jaká obligatorní doplnění zvolené použití vyžaduje, která výslovně přítomná slova je realizují a o jaké současné české sloveso a použití se analogie opírá. Všechna obligatorní doplnění musí být realizována, s jedinou normativní výjimkou dovoleného nevyjádřeného podmětu imperativu.</div>
    <div class="spec-block">Kvazislovo může mít fiktivní význam, ale ten nesmí vytvářet novou identitu, měnit morfologii, zakládat nepovolenou rekci, nahrazovat valenční obhajobu ani obcházet jiná omezení. Pokud je fiktivní význam podstatný pro syntaktickou funkci, musí použití odpovídat současné spisovné české analogii stejného hlavního vztahu.</div>
  </section>

  <section class="spec-section" id="s9">
    <h2><span class="spec-num">9</span>Interpunkce a skóre</h2>
    <div class="spec-block">Uvnitř soutěžního zápisu se nepoužívají čárky, středníky, dvojtečky, pomlčky, spojovníky, závorky, uvozovky, lomítka, apostrofy ani jiná pomocná znaménka. Typ věty určuje závěr: oznamovací <code>.</code>, tázací <code>?</code>, rozkazovací <code>!</code>. Závěrečné znaménko není soutěžním znakem.</div>
    <div class="spec-block"><strong>Primární skóre:</strong> počet skutečně zapsaných slov. <strong>Sekundární skóre:</strong> počet soutěžních znaků bez mezer, standardně <code>Q = 1</code>, <code>KV = 2</code>. Jedinou zvláštní výjimkou je pět znaků normativně použitého prefixu <code>kvazi-</code>, které mají sekundární hodnotu 0. Shoda obou hodnot znamená společný rekord; pořadí podání nerozhoduje.</div>
  </section>

  <section class="spec-section" id="s10">
    <h2><span class="spec-num">10</span>Zdroje a rozhodování</h2>
    <div class="spec-block">Důkazní břemeno v jazykovém sporu nese řešitel. U kvazislova se dokládá zvolený soutěžní model; u valence jazyková analogie konkrétního použití; status skutečného slova se řídí spravovaným katalogem. Náhodný internetový výskyt sám o sobě nestačí.</div>
    <div class="spec-block">Kvaziautorita rozhoduje sporné jazykové a pravidlové případy. Jazykově platné a řádně podané řešení se nesmí odmítnout jen proto, že využívá neočekávanou vlastnost aktuálních pravidel; nežádoucí exploit lze uzavřít až novou verzí. Nepravdivé údaje v samotném podání mohou vést k zamítnutí.</div>
  </section>

  <section class="spec-section" id="s11">
    <h2><span class="spec-num">11</span>AI, nástroje a fair play</h2>
    <div class="spec-block">Toto je pouze veřejné shrnutí. Kanonickou politiku pro AI a nástroje spravuje výhradně <a href="<?= htmlspecialchars($repo . 'docs/rules/03-ai-policy.md') ?>">docs/rules/03-ai-policy.md</a>.</div>
    <div class="spec-block"><strong>Základní hranice:</strong> AI smí vysvětlit hru nebo obecný jazykový pojem, ale nesmí ji za hráče hrát. Nástroj může pomoci s učením, poznámkami nebo mechanickou kontrolou konkrétního lidského nápadu; nesmí automaticky hledat, generovat, filtrovat, skládat, opravovat ani optimalizovat soutěžní kandidáty nebo dávkově testovat možnosti s cílem najít řešení.</div>
    <div class="spec-block">Soutěž stojí na důvěře. Projekt nebude vyžadovat logy, screenshoty nebo historii promptů ani forenzně vyšetřovat způsob vzniku řešení. Omezení se vztahují na soutěžní řešení; AI a automatizace lze používat při vývoji, auditu, testování a správě projektu.</div>
  </section>

  <section class="spec-section" id="s12">
    <h2><span class="spec-num">12</span>Autorství a spolupráce</h2>
    <div class="spec-block">Na řešení může fakticky spolupracovat libovolný počet lidí a zveřejněná schválená řešení jsou legitimní společnou znalostí hry. Lze na ně navazovat, upravovat je a přebírat jednotlivá slova, konstrukce nebo jiné zveřejněné herní nápady.</div>
    <div class="spec-block"><strong>Systém ale neeviduje samostatné spoluautory.</strong> Každé soutěžní podání vlastní a odevzdává právě jeden registrovaný účet. Účet může reprezentovat jednotlivce i libovolný kolektiv a registrační e-mail může patřit jednotlivci nebo skupině. Systém nesleduje identity osob stojících za účtem, jejich podíly ani personální složení týmu. Veřejná atribuce používá pouze <code>username</code> tohoto účtu.</div>
    <div class="spec-block">Přesně shodné řešení může podat více účtů. Pokud má více řešení stejné primární i sekundární skóre, jde o společný rekord a pořadí podání nerozhoduje.</div>
  </section>

  <section class="spec-section" id="s13">
    <h2><span class="spec-num">13</span>Verzování a revalidace</h2>
    <div class="spec-block">Toto je pouze veřejné shrnutí. Kanonický lifecycle spravuje výhradně <a href="<?= htmlspecialchars($repo . 'docs/rules/04-verzovani-a-sprava.md') ?>">docs/rules/04-verzovani-a-sprava.md</a>.</div>
    <div class="spec-block">Každá zveřejněná <code>rules_version</code> má neměnný runtime dataset a manifest s jeho hashem a identifikací validátoru. Čistě redakční změna bez dopadu na soutěžní význam novou verzi nevyžaduje; změna pravidla nebo autoritativního výkladu, která může změnit verdict, ano. Spravovaný katalog skutečných slov je provozní lexikální autorita mimo immutable manifest rules verze a jeho běžná oprava sama novou rules verzi nevyžaduje.</div>
    <div class="spec-block">Každé odeslání vytváří neměnnou revizi podání. Novější rules verze může stejnou revizi znovu posoudit a vytvořit nový validační výsledek, ale nepřepisuje historický verdikt ani historické skóre. Vydání release nespouští automatickou revalidaci a dodržování AI/fair-play pravidel se neeviduje. Aktuální žebříček používá aktuální rules verzi, historické výsledky zůstávají zachovány.</div>
    <div class="spec-block">Interní morfologická review cache je scoped na rules verzi; nová verze automaticky nepřebírá starší schválení. Spravovaný katalog skutečných slov se naopak novou rules verzí nevynuluje. Historický výsledek uchovává rules/validator version a stabilní reference na interní review rozhodnutí, která při něm byla použita.</div>
  </section>

  <section class="spec-section" id="s14">
    <h2><span class="spec-num">14</span>Reachability a slepé cesty</h2>
    <div class="spec-block"><strong>Reachability není normativní filtr.</strong> Model, morfologická větev nebo jiný mechanismus se neodstraňuje, neskrývá ani nezakazuje jen proto, že podle analýzy zřejmě nebo prokazatelně nevede k použitelnému povrchovému tvaru.</div>
    <div class="spec-block">Slepé cesty jsou záměrnou součástí objevování hry. Interní reachability analýza může pomáhat při auditu a testování, ale nesmí sama rozhodovat o tom, které jinak normativně povolené možnosti hráč dostane k dispozici. Konkrétní použitý tvar samozřejmě musí splnit všechna aktuální pravidla.</div>
  </section>
</main>

<?php include __DIR__ . '/includes/footer.php'; ?>
</body>
</html>
