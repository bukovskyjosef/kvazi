# Validace

> **Status:** cílové hranice deterministické validace MVP. Tento dokument je technický, nikoli normativní; soutěžní platnost určuje normativní balík podle `docs/README.md`.

## Základní princip

Validátor ověřuje konkrétní hráčův návrh. Nemá hledat kandidáty, navrhovat lepší model ani filtrovat hráči normativně povolené možnosti podle reachability.

Současně se validační pipeline nemá zbytečně prokousávat specializovanými větvemi, pokud už obecnější pravidlo definitivně rozhodlo neplatnost.

Proto jsou oddělené dvě věci:

1. **úplná nabídka modelů a hlavních voleb v konfigurátoru**, která odpovídá normativním pravidlům a reachability ji nefiltruje,
2. **aktivní validační hloubka**, která může skončit po časném deterministickém failure, pokud další deep-validace už nemůže změnit verdikt.

Například model `kuře` zůstává hráči normálně dostupný. Jestliže konkrétní použitý surface selže už na povolených znacích, délce nebo motivu, není pro tento request nutné dále vyhodnocovat celé specializované paradigma `kuře`, aby bylo zřejmé, že submit není platný.

## Vstup

Věta je tvořena seřazeným seznamem výskytů slov. Každé slovo je samostatný řetězec bez mezer. Frontend normalizuje text do Unicode NFC ještě před živou kontrolou; backend stejnou normalizaci autoritativně zopakuje. Mezery mezi slovy generuje aplikace.

Uživatel explicitně deklaruje typ věty. Z něj plyne závěrečná interpunkce:
- oznamovací → `.`,
- tázací → `?`,
- rozkazovací → `!`.

## Validační fáze

### Fáze 1 — obecná surface a sekvenční brána

Nejdříve se kontroluje vše, co lze rozhodnout pouze z konkrétního zapsaného povrchu a pořadí tokenů:

- Unicode NFC,
- povolené soutěžní znaky,
- délka běžného slova,
- jednopísmenné výjimky,
- zvláštní povrchové pravidlo prefixu `kvazi-`,
- globální motivová/tokenová sekvence,
- jednoznačná inference normativního prefixu a POS tam, kde ji pravidla stanoví,
- závěrečná interpunkce odvozená z typu věty,
- základní skórové odvozeniny založené na skutečně platném povrchu.

Hráč nezadává rozklad na motivy. Interní implementace může použít konečný automat, parser nebo jiný ekvivalentní deterministický postup.

### Fáze 2 — levná integrita deklarace

Pro surface-validního kandidáta se ověřuje obecná integrita strukturovaného payloadu:

- povolené closed enum hodnoty,
- platný slovní druh a model,
- systémově odvozený prefix/POS versus klientská deklarace,
- úplnost polí vyžadovaných zvolenou normativní možností,
- platnost referencí mezi tokeny,
- základní strukturální invarianty.

Tato vrstva je důležitá i proti direct HTTP klientovi. To, že nějakou hodnotu UI běžně nenabídne nebo že je určitá normativní větev dnes globálně povrchově nedosažitelná, neznamená, že backend smí klientské hodnotě slepě věřit.

### Fáze 3 — deep deterministická validace

Pokud surface kandidát projde předchozími vrstvami, validátor provede relevantní detailní kontroly schopné změnit jeho verdikt, zejména:

- vztah deklarované morfologické identity + konkrétních morfologických hodnot k použitému `surfaceForm`,
- morfosyntaktickou shodu v deterministicky odvoditelných kategoriích,
- syntaktické vazby, rekci a globální strukturální invarianty,
- prefixovou validaci základu a skórovou výjimku,
- další deterministické kontroly definované aktuální rules verzí.

### Short-circuit po surface failure

Pokud konkrétní token nebo věta už ve fázi 1 deterministicky selže, konečný submit verdict je neplatný. Aktivní runtime proto **nemusí spouštět specializovanou deep-validaci, která tento verdikt nemůže změnit**.

To neznamená `morphologyOk=true`. Doporučený technický stav je explicitní `notEvaluated` / `skippedBecauseSurfaceInvalid` nebo ekvivalent, aby UI ani API nepředstíraly, že neprovedená kontrola uspěla.

`submitReady` zůstává `false`.

## Úplná UI nabídka versus reachability

Reachability se nesmí stát filtrem konfigurátoru.

- všechny normativně povolené modely a hlavní volby zůstávají v roletkách a relevantních formulářových větvích,
- UI nesmí hráči říkat, která normativní možnost je podle současné abecedy nebo motivu slepá,
- konfigurátor nesmí podle konkrétního hráčova surface kandidáta zužovat modely na ty, které by mohly vyjít,
- reachability analýza je interní informace pro architekturu a testovací strategii, nikoli herní nápověda.

## Dormant deep-validace

Pokud už existuje funkční deep-validace normativní větve, která je při aktuálních surface pravidlech globálně nedosažitelná, **nemá se pouze kvůli této nedosažitelnosti mazat nebo hromadně zakomentovávat**.

Preferovaný stav:

- implementace zůstane normálně zkompilovatelná/parsovatelná v codebase,
- může mít levné unit/regression testy, které brání jejímu tichému rozpadu,
- z aktivního validačního flow se nevolá tam, kde surface gate už rozhodl neplatnost,
- nepovažuje se za důvod udržovat samostatnou browser/HTTP/DB/cross-engine E2E matici,
- při budoucí rules verzi se změněnou abecedou nebo motivem lze implementaci znovu zapojit a teprve tehdy rozšířit aktivní integrační pokrytí.

Dormant implementace je zachovaný kód, nikoli komentovaný archiv. Git komentář má vysvětlovat důvod neaktivního zapojení, ne deaktivovat celé funkční bloky syntaktickým komentářem.

## Bezpečnostní hranice short-circuitu

Short-circuit je povolen pouze tehdy, když dřívější kontrola sama stačí k definitivnímu zamítnutí daného konkrétního requestu.

Nesmí vzniknout situace:

- surface projde,
- klient podstrčí jiný model / branch / enum / POS,
- backend přeskočí kontrolu jen proto, že tato branch bývá v aktuálním rules release globálně nedosažitelná,
- request se omylem přijme.

Pro surface-valid payload musí backend buď použít existující deep-validator, nebo levnější obecný rejection/integrity mechanismus, který bezpečně prokáže neplatnost deklarace. Optimalizace nesmí rozšířit množinu přijatých řešení.

## Automatická inference normativního `kvazi-`

Pokud je po NFC a kanonické normalizaci velikosti písmen povrchový token delší než normativní délka prefixu a začíná přesnou sekvencí `kvazi`, konfigurátor i backend deterministicky odvodí:

- POS = substantivum,
- interní `kvaziPrefix = kvazi`.

Hráč prefix ručně nevolí. Pro takový surface nelze ručně zvolit jiný POS. Po změně surface se odvozené hodnoty znovu přepočítají.

Inference sama neznamená platnost: konkrétní token musí projít povrchovými pravidly a, pokud se k nim validace dostane, také normativní kontrolou základního substantiva a ostatními podmínkami `07-prefix-kvazi.md`.

## Strukturální a syntaktická validace

Pro kandidáta, který není už definitivně neplatný na dřívější vrstvě, strukturální kontrola ověřuje zejména:

- právě jeden plnovýznamový slovesný token,
- právě jeden přísudek,
- právě jeden podmět, není-li normativně povolen nevyjádřený podmět imperativu,
- u běžného závislého členu požadované řídící slovo,
- u přísudku žádné řídící slovo,
- u doplňku vazbu k přísudku a k podmětu/předmětu,
- u koordinace dvě různé spojované části,
- u `k/v/z` technickou prepoziční roli, vazbu na jmenný člen a deterministickou rekci,
- zákaz cyklů a neplatných referencí,
- deterministicky odvoditelnou shodu podmětu a přísudku.

Valence samotná zůstává slovní obhajobou a její jazyková přesvědčivost není automatický closed-set validator.

## Morfologická deklarace podle #86

Hráč ručně nevyplňuje celé paradigma. Deklaruje:

1. údaje potřebné k určení soutěžní identity,
2. morfologické vlastnosti konkrétního použitého tvaru,
3. skutečně použitý surface.

Normativní tabulky zůstávají úplné. Deep-validátor může z těchto dat určit právě jeden očekávaný tvar tam, kde je tato kontrola součástí aktivní validační cesty.

## Dva oddělené katalogové mechanismy

Validace musí důsledně rozlišovat:

### Katalog skutečných slov
- samostatná lexikální autorita pro status skutečné slovo / kvazislovo,
- není obecně scoped na jednu `rules_version`,
- hráč smí po zadání kompletního vlastního návrhu použít pouze exact-match kontrolu úplné soutěžní identity + konkrétního použitého tvaru,
- výsledek pouze potvrzuje nebo nepotvrzuje existující schválený exact match,
- žádný browse, prefix search, autocomplete, podobné položky nebo nabídka alternativ.

### Interní morfologická review cache
- neveřejná provozní paměť předchozích morfologických posouzení,
- je scoped na konkrétní `rules_version`,
- používá `APPROVED / REJECTED / UNKNOWN`,
- membership této cache se hráči před submittem ani po exact-match dotazu katalogu skutečných slov neprozrazuje.

Tyto mechanismy se nesmějí slít do jednoho významově nejasného lookupu.

## Konečný submit

Submit musí vždy autoritativně serverově zopakovat všechny kontroly potřebné k rozhodnutí requestu. FE stav tlačítka ani dřívější klientská validace nejsou autoritou.

Serverová pipeline smí stejně jako frontend short-circuitovat po definitivním surface failure, ale musí bezpečně odmítnout request a nesmí vytvořit `sentence_revision`.

Úspěšný submit vytvoří immutable `sentence_revision` a autoritativní validační výsledek.

Backend nesmí přijmout klientský score, rules version, prefix flag ani jinou odvozeninu jako autoritativní hodnotu.

## Revalidace

Jedna immutable revize může mít samostatný validační výsledek pro více `rules_version`. Starý verdikt zůstává zachován; revalidace nevytváří novou `sentence_revision`.

Každý rozhodující validační výsledek musí mít potřebnou provenance: revizi věty, rules verzi, validator version, relevantní katalog/review provenance, automatický nebo ruční původ, čas a případného rozhodujícího admina.

Změna rules verze může změnit surface reachability. V takovém případě se nesmí automaticky předpokládat, že dříve dormant validační větev zůstává dormant; vývojář musí znovu provést reachability audit a případně zachovanou deep implementaci vrátit do aktivního flow.

## Testovací strategie

Testy rozlišují:

### Obecný surface gate
Musí mít kvalitní regresní pokrytí pro NFC, charset, délku, motiv/token boundary, prefix surface a jednopísmenné výjimky.

### Aktivní deep mechanismy
Mechanismy, které mohou změnit verdikt surface-validního kandidáta, mají odpovídající unit/parity/integration pokrytí podle rizika.

### Dormant deep mechanismy
Hotový dormant validator může mít levné unit testy proti zahnívání. Není však povinnost vytvářet explicitní browser/HTTP/DB/cross-engine scénář každé větve jen proto, že je uvedena v normativním paradigmatu.

Browser a povinná integration suite mají dokazovat skutečný aktivní submit flow, server authority a reprezentativní hráčské cesty, nikoli exhaustive kartézský součin normativních tabulek.

## Bez generování řešení

Validátor ani exact-match rozhraní nesmějí navrhovat jiné slovo, jiné lemma, jiný tvar, jiné rozdělení slov, jinou analýzu ani jiné syntaktické vazby. Smějí pouze vyhodnotit konkrétní zadaný návrh v rozsahu potřebném pro bezpečný verdikt.

Systematické iterativní zkoušení variant za účelem nalezení řešení není povoleným ověřením konkrétního lidského nápadu.
