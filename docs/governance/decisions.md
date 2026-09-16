# Rozhodnutí projektu

Tento dokument shrnuje stabilní rozhodnutí, která už byla explicitně přijata decision ownerem. Detailní diskuse, auditní nálezy a implementační práce zůstávají v GitHub Issues.

> **Stav po auditu 2026-09-14:** původní sada produktových rozhodnutí byla uzavřena; následný produktový audit může otevírat další skutečné pravidlové nebo koncepční volby. Otevřené rozhodovací body se vedou v GitHub Issues a po rozhodnutí se jejich stabilní výsledek promítá sem a do normativních artefaktů.

## Autorita a governance

- Finální produktová a pravidlová rozhodnutí provádí Josef Bukovský.
- Normativní pravidla mají vyšší autoritu než architektura, databáze nebo UI.
- Technická implementace nesmí sama vytvářet nové soutěžní pravidlo.
- TODO není implicitní rozhodnutí.
- Uživatelská deklarace analýzy není sama morfologickou pravdou.
- Projekt upřednostňuje srozumitelnou a praktickou správu recesní hry před maximální formální přesností tam, kde by přesnost nepřinášela odpovídající herní hodnotu.
- Férové hraní stojí na vzájemné důvěře; projekt záměrně nevytváří dohledový nebo disciplinární systém pro způsob vzniku řešení.

## Soutěžní abeceda a motiv

### Q je samostatné soutěžní písmeno — rozhodnutí #65

- `Q` je samostatné soutěžní písmeno, nikoli zkratka, ligatura ani alternativní zápis dvojice `KV`.
- `Q` se shodou pravidla vyslovuje `/kv/`, ale tato akustická shoda nemá morfologický ani lexikální účinek.
- Při určování lemmatu, základního tvaru, morfologie, soutěžní identity, skutečnosti slova ani při práci s jazykovými zdroji se `Q` nikdy automaticky nerozvíjí nebo nenormalizuje na `KV`.
- `QAZ` a `KVAZ` jsou dvě různě zapsaná slova a nelze jim pouze kvůli stejné výslovnosti přiřadit tutéž morfologickou identitu.
- Tvorba motivu proto používá alternativu `KV | Q`; nejde o pravidlo jazykové ekvivalence.

## Soutěžní identita a morfologické modely

### Uzavřený a deterministický morfologický model — rozhodnutí v #1

- Soutěžní vzor je uzavřený herní model inspirovaný češtinou, nikoli otevřený odkaz na všechny české dublety, alternace a lexikální výjimky.
- Soutěžní kmen a případné další kmenové podoby se vždy odvozují mechanicky ze základního tvaru a zvoleného modelu; hráč je nevolí ani neobhajuje vlastní analogií.
- U běžných substantivních modelů se kmen tvoří mechanicky z lemmatu: u souhláskových modelů je kmen celé lemma; u modelů na `-a`, `-e`, `-o` a `-í` se příslušná nominativní koncovka odtrhne. Nominativ singuláru je přímo lemma.
- Pokud konkrétní model potřebuje další kmenovou podobu, musí ji sám výslovně a deterministicky definovat včetně buněk, kde se použije.
- Model `kuře` je první explicitně zmrazená vícekmenová výjimka: pro lemma `S+e` používá základ `S`, singulárový rozšířený kmen `S+et` a plurálový rozšířený kmen `S+at`; přesné použití určuje jeho normativní tabulka.
- Po vydání je normativní autoritou konkrétní zmrazená tabulka Kvazi, nikoli živý stav externí jazykové příručky ani pořadí variant v ní.
- Obecné české hláskové alternace se automaticky nepřenášejí; změna kmene nebo hlásky existuje jen tehdy, pokud ji konkrétní model výslovně a deterministicky definuje.
- **V první zmrazené rules verzi má každá morfologická buňka právě jednu kanonickou realizaci. Morfologické dublety se nepovolují.**
- Další realizaci lze zavést pouze explicitní změnou budoucí verze pravidel.
- Existence jiné spisovné varianty mimo normativní tabulku sama o sobě nezakládá soutěžní přípustnost.
- Reachability není kritériem existence modelu ani varianty; normativně povolené slepé cesty zůstávají součástí pravidel a hráčské nabídky.
- Cílová vlastnost každého produktivního modelu je mechanicky rozhodnutelný vztah `lemma + model + morfologické hodnoty → právě jeden povolený tvar`.

### Vid — rozhodnutí 3/19

Povolené hodnoty jsou:
- `nedokonavý`,
- `dokonavý`,
- `obouvidový`.

Vid sám o sobě nevytváří soutěžní identitu. Obouvidovost je jedna gramatická hodnota, nikoli dvě identity. Stejná sada platí i pro kvazislovesa.

### Valence — rozhodnutí 4/19, 5/19 a #66

- Valence není součástí morfologické ani soutěžní identity slovesa.
- Morfologickou soutěžní identitu slovesa tvoří `infinitiv + soutěžní časovací typ`.
- Vid ani valence samy o sobě novou identitu slovesa nevytvářejí.
- Valence není uzavřený whitelist rámců a nepřevádí se na povinný kanonický kód nebo strukturovaný seznam slotů.
- Hráč ji obhajuje volným textem pro konkrétní použití slovesa ve větě.
- Obhajoba musí srozumitelně uvést, jaká doplnění zvolené použití vyžaduje, která slova ve větě je realizují a o jaké konkrétní současné české sloveso a jeho použití se opírá.
- Všechna obligatorní doplnění vyplývající z obhájeného použití musí být ve větě výslovně realizována.
- Valence se automaticky jazykově nevaliduje ani neporovnává jako katalogová identita. Při jazykovém review ale může vést k zamítnutí věty, pokud analogie nebo realizace obligatorních doplnění neobstojí.
- Modelové sloveso pro valenci nemusí být stejné jako případný jazykový podklad pro časování.

## Syntaxe a formulář

### Globální syntax jedné věty — rozhodnutí #67

- Kvazivěta má jediný přísudek jako jediný kořen hlavní predikační osy.
- Všechny ostatní větné členy musí být zapojeny do jedné propojené syntaktické analýzy této věty.
- Syntaktické závislosti nesmějí tvořit kruh.
- Podmět a přísudek musí být v relevantních kategoriích v běžné morfosyntaktické shodě současné spisovné češtiny.
- Koordinované části musí mít stejnou hlavní syntaktickou funkci a jejich skupina jako celek zastává jednu syntaktickou roli vůči nadřazené konstrukci.
- Soutěžní výjimka pro `k/v/z` se týká pouze nevokalizované podoby. Jinak jde o běžné české předložky s běžnou rekcí: `k` + dativ, `v` + lokál nebo akuzativ podle významu, `z` + genitiv.
- Není-li další mezislovní podmínka soutěžně výslovně upravena, musí konstrukce obstát jako současná spisovná čeština.

### Token vs. slovo a předložky — rozhodnutí 6/19

- `token` je technický identifikátor konkrétního výskytu slova v podání.
- Jazykové vlastnosti včetně hlavní větné funkce náležejí slovu v daném výskytu, nikoli tokenu jako technickému objektu.
- `k/v/z` jsou funkční předložky bez hlavní větné funkce.
- Jejich technická reprezentace má právě jednu vazbu na řízené jmenné slovo; hlavní větnou funkci nese jmenný člen/konstrukce.

### Fallback při omezení UI — rozhodnutí 7/19

Pokud pravidla dovolují případ, který veřejný formulář neumí reprezentovat:
- aplikace na tuto možnost viditelně upozorní,
- hráč kontaktuje rozhodčího/admina e-mailem,
- nejde o obcházení pravidel,
- pro MVP se nezavádí zvláštní fallback workflow ani nový stav podání.

Technické/resource limity formuláře jsou nenormativní a nesmějí vytvořit skrytý maximální počet slov.

### Zjednodušená morfologická deklarace — rozhodnutí #86

- Morfologická soutěžní identita se nemění.
- Hráč už nevyplňuje celé paradigma ani tvary, které ve své větě nepoužil.
- Povinně deklaruje pouze údaje potřebné k určení soutěžní identity, morfologické vlastnosti konkrétního použitého tvaru a skutečně použitý povrchový tvar.
- Systém z normativních tabulek deterministicky ověřuje vztah `morfologická identita + vlastnosti konkrétního použití → právě jeden očekávaný tvar`.
- Normativní paradigmata zůstávají úplná a beze změny; slouží jako autoritativní pravidlo pro odvození a validaci, ne jako formulář k ručnímu vyplnění.
- Ruší se starší požadavek na celé editovatelné paradigma, jeho předvyplňování a snapshotové potvrzení `morfoConfirmed`.
- Deterministická kontrola smí ověřit konkrétní hráčův návrh, ale nesmí hledat nebo navrhovat alternativní kandidáty.
- Implementaci konfigurátoru řeší #87.

### Automatická inference prefixu `kvazi-` v konfigurátoru — rozhodnutí 2026-09-15

- Hráč v konfigurátoru prefix `kvazi-` ručně nevolí a žádná roletka/přepínač prefixu se nezobrazuje.
- Pokud je normalizovaný povrchový token delší než 5 soutěžních znaků a začíná přesnou sekvencí `kvazi` bez ohledu na velikost písmen, konfigurátor deterministicky nastaví slovní druh na substantivum a interní `kvaziPrefix = kvazi`.
- Inference neignoruje diakritiku ani jiné znakové varianty; `kvázi`, `qazi`, `quasi` apod. se takto nerozpoznají.
- Takto odvozený slovní druh ani prefix nelze pro daný povrchový tvar ručně přepsat; po změně povrchového tvaru se inference znovu přepočítá.
- Interní prefixová vlastnost zůstává součástí kanonického state/payloadu a cílového uloženého datového modelu pro identitu, validaci a skóre; odstraněna je pouze ruční volba z UI.
- Zbytek po `kvazi` musí dále samostatně splnit všechna pravidla základního substantiva. Automatická inference sama nezaručuje platnost slova.
- Jde o UX/implementační odvození jednoznačné normativní vlastnosti, nikoli o změnu pravidla prefixu v `07-prefix-kvazi.md`.

### Reachability — aktuální rozhodnutí #4

Reachability je analytická informace, nikoli normativní filtr. Normativně povolený model, morfologická větev nebo jiný mechanismus zůstává součástí pravidel i tehdy, pokud se ukáže prakticky nebo prokazatelně nedosažitelný. UI ani hráčský tahák jej nesmějí skrýt jen kvůli reachability a hráčské materiály nemají známé slepé cesty předem prozrazovat.

### Úplná nabídka modelů versus validační hloubka — rozhodnutí #88

- Všechny normativně povolené modely a hlavní varianty zůstávají nabízené v konfigurátoru bez ohledu na aktuální reachability; například `kuře` zůstává v substantivním model selectoru.
- Reachability nesmí model nebo větev skrýt, označit jako slepou ani podle konkrétního hráčského surface filtrovat nabídku na „nadějné“ analýzy.
- Obecná surface validace (NFC, charset, délka, motiv/tokenová sekvence a prefixová povrchová pravidla) je legitimní časný gate.
- Pokud konkrétní request už na této vrstvě deterministicky selže, deep branch-specific validace, která konečný INVALID verdikt nemůže změnit, nemusí být spuštěna ani mít samostatnou drahou browser/HTTP/DB/cross-engine testovací matici.
- Surface-valid request musí dál projít dostatečnou serverovou kontrolou deklarace; short-circuit nesmí umožnit podstrčení modelu, enumu, prefixu, POS, score ani jiné klientské odvozeniny.
- Funkční deep-validator, který už pro dnes nedosažitelnou normativní větev existuje, se pouze kvůli současnému motivu **nemaže ani hromadně nezakomentovává**. Preferuje se zachování jako dormant/reusable kódu odpojeného z aktivní cesty, kde předchozí gate už rozhodl neplatnost.
- Dormant implementace může mít levné unit/regression testy proti zahnívání. Její existence sama nevytváří povinnost exhaustive integračního pokrytí.
- Pokud budoucí rules release změní povrchová pravidla a dříve dormant větev se stane dosažitelnou, nejprve se prověří a znovu zapojí zachovaný validator a teprve pro nově aktivní cestu se doplní odpovídající integrační testy.

## Skutečná slova, katalog a zveřejnění

### Spravovaný katalog skutečných slov — rozhodnutí #68

- Pro status skutečného soutěžního slova je autoritou vlastní spravovaný katalog projektu.
- Externí slovníky a jazykové příručky slouží jako důkazní podklady pro správu katalogu, nikoli jako přímý soutěžní whitelist hráče.
- Katalog lze průběžně opravovat a rozšiřovat bez nové `rules_version`.
- Historicky schválené řešení se kvůli pozdější katalogové opravě bez dalšího zpětně neruší.

### Zveřejnění katalogu — rozhodnutí #72

- Katalog není veřejně procházetelný ani exportovatelný seznam kandidátů.
- Hráč může ověřit pouze hotový vlastní návrh: úplnou morfologickou identitu a konkrétní použitý tvar.
- Exact-match kontrola pouze potvrdí, že přesně tato kombinace už je schválena.
- Z částečných údajů se nenabízejí možné identity, autocomplete, podobná slova, alternativní analýzy ani jiné nápovědy.
- Nepotvrzený exact match neznamená zamítnutí; kandidát lze předložit k review.

### Oddělení katalogu skutečných slov a interní review cache — rozhodnutí #80

- Projekt používá dva explicitně oddělené katalogové mechanismy.
- **Katalog skutečných slov** je lexikální autorita pro status skutečné slovo / kvazislovo. Není obecně vázán na `rules_version`, lze jej průběžně opravovat a hráči poskytuje jen exact-match kontrolu kompletního vlastního návrhu.
- **Interní morfologická review cache** je neveřejná provozní paměť předchozích morfologických posouzení. Je scoped na konkrétní `rules_version` a používá `APPROVED / REJECTED / UNKNOWN`.
- Hráč nesmí získat membership informaci z interní review cache.
- Obě vrstvy se nesmějí technicky ani významově slít do jediné autority.

### Skutečná zájmena — rozhodnutí #74

- Zájmena jsou zvláštní `real-word-only` kategorie; nová kvazizájmena se nevytvářejí a neexistuje pro ně produktivní soutěžní morfologický model.
- Soutěžní identitu tvoří konkrétní zájmenný lexém / lemma.
- Pád, číslo, rod, osoba a další relevantní morfologické vlastnosti konkrétního použitého tvaru samy novou identitu nevytvářejí.
- Katalog potvrzuje konkrétní skutečný lexém, použitý tvar a deklarované morfologické vlastnosti.
- Nepravidelnost nebo defektivnost skutečného zájmena sama nevadí, protože se z ní nevytváří produktivní model pro nová slova.
- Reachability není filtr zájmenné kategorie ani její viditelnosti v UI.

### Veřejný detail schváleného řešení — rozhodnutí #73 + #81

Veřejně se zobrazuje lehký, srozumitelný rozbor, nikoli úplný rozhodcovský spis.

U výsledku se zveřejňuje zejména věta, počet slov, počet soutěžních znaků a veřejná identita (`username`) jednoho registrovaného účtu, který podání vlastní a odevzdal. Samostatní spoluautoři ani identity osob za účtem se neevidují. Registrovaný účet může reprezentovat jednotlivce i kolektiv.

V detailu jednotlivého slova lze zveřejnit použitý tvar, skutečné slovo / kvazislovo, slovní druh, lemma, soutěžní model, základní vlastnosti použitého tvaru a hlavní syntaktickou roli / jednoduché vazby.

Kompletní paradigma, úplná morfologická obhajoba, detailní důkazní podklady, interní katalogové stavy, úplný admin/judge review a identita jednotlivých osob za účtem zůstávají neveřejné; systém posledně uvedenou identitu ani nemá požadovat.

## Nástroje, AI, férovost a autorství

### Fair-play režim nástrojů — rozhodnutí #71

- Základní hranice je: **AI smí vysvětlit hru; nesmí ji za hráče hrát.**
- AI může vysvětlovat pravidla Kvazi, obecné české pojmy a přeformulovat nejasný text pravidla.
- AI nesmí řešit konkrétní soutěžní případ, navrhovat kandidátní slova, konkrétní morfologii nebo syntaxi, generovat/opravovat konkrétní větu, vyhledávat kandidáty ani optimalizovat konkrétní řešení.
- Ne-AI deterministický nástroj smí mechanicky ověřit konkrétní lidský návrh, nesmí však za hráče kandidáty generovat, prohledávat nebo optimalizovat.
- Dodržování stojí na důvěře; projekt nevyžaduje logy, screenshoty, historii promptů, pracovní deníky ani jiný dohledový důkaz.
- Projekt nevede disciplinární nebo forenzní řízení o tom, jak hráč řešení hledal.

### Autorství a spolupráce — rozhodnutí #69, upravené #81

- Kvazi je otevřený kumulativní problém.
- Zveřejněné schválené řešení, jednotlivé kvazislovo, konstrukci nebo jiný zveřejněný nápad smí kdokoli použít, upravit nebo rozvíjet.
- Na jednotlivé herní nápady se nezavádí výlučné vlastnictví.
- Na řešení může fakticky spolupracovat libovolný počet lidí; soutěž jejich počet ani identity nesleduje.
- Každé podání vlastní a odevzdává právě jeden registrovaný účet.
- Registrovaný účet může reprezentovat jednotlivce i libovolný kolektiv a registrační e-mail může patřit jednotlivci nebo skupině.
- Systém neeviduje samostatné spoluautory, jejich identity ani podíly; veřejná atribuce používá pouze `username` registrovaného účtu.
- Přesné duplicitní řešení je dovoleno; při shodném primárním i sekundárním skóre jde o společný rekord a pořadí podání nerozhoduje.
- Pravidla nevyšetřují nezávislé znovuobjevení oproti převzetí zveřejněného nápadu ani personální složení lidí za účtem.
