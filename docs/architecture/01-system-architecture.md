# Systémová architektura aplikace

> **Status:** cílový návrh MVP. Technická implementace nesmí měnit jazykovou platnost pravidel.

## Technologie

### Frontend
- HTML5
- CSS
- vanilla JavaScript

### Backend
- PHP 8.x
- PostgreSQL
- PDO
- server-rendered HTML
- malé JSON endpointy pro dynamický formulář

Preferovaný princip: **Keep It Simple**.

## Logické vrstvy

1. **Veřejný obsah** – pravidla, kvazitahák, aktuální a historické schválené věty.
2. **Uživatelské účty** – registrace, přihlášení, reset hesla a role `USER` / `ADMIN`.
3. **Soutěžní podání** – editovatelný draft a immutable revize věty se strukturovanou morfologií, syntaxí, zdroji a obhajobou.
4. **Mechanický validátor** – živá deterministická kontrola veřejných znakových, strukturálních a odvoditelných morfologických pravidel nad konkrétním hráčovým návrhem.
5. **Katalog skutečných slov** – samostatná lexikální autorita pro status skutečné slovo / kvazislovo; hráči poskytuje pouze exact-match kontrolu kompletního vlastního návrhu.
6. **Interní morfologická review cache** – neveřejná `rules_version`-scoped paměť `APPROVED / REJECTED / UNKNOWN` pro opakované rozhodcovské posouzení.
7. **Administrace** – review podání, správa katalogu skutečných slov, rozhodování `UNKNOWN` položek review cache, revalidace a auditní stopa.

Katalog skutečných slov a interní review cache jsou dvě oddělené autority s odlišným lifecyclem a nesmějí být slity do jednoho katalogového stavu.

Komentáře nejsou součástí MVP.

## Veřejné stránky

### `/`
- stručná pravidla,
- aktuální rekord,
- poslední schválené věty,
- vstup k registraci/přihlášení a podání.

### `/pravidla`
- Jak hrát,
- úplná specifikace,
- aktuální verze pravidel a historie verzí.

### `/kvazitahak`
- normativní tabulky,
- vysvětlující příklady.

### `/vety`
- věty schválené podle aktuální verze,
- možnost zobrazit historická schválení podle starších verzí.

### `/veta/{slug}`
Veřejně je dostupný pouze detail revize, která má publikovatelné schválení podle příslušné verze pravidel.

Zobrazuje zejména:
- text věty,
- veřejnou identitu (`username`) jednoho registrovaného účtu, který podání vlastní,
- skóre pro zvolenou verzi pravidel,
- verzi pravidel a stav validace,
- datum,
- u každého slova použitý tvar, skutečné/kvazi zařazení, slovní druh, lemma/základ, soutěžní model, základní morfologické vlastnosti konkrétního použití a hlavní syntaktickou roli / jednoduché vazby.

Kompletní paradigma, úplná morfologická obhajoba, detailní důkazní podklady, interní stav review cache, úplný admin review ani identita jednotlivých lidí stojících za účtem nejsou veřejnou součástí detailu.

## Uživatelské účty

MVP používá klasickou lehkou registraci:
- globálně unikátní `username`,
- globálně unikátní neveřejný e-mail,
- heslo ukládané pouze jako bezpečný jednosměrný hash.

Registrovaný účet je jedinou systémově evidovanou autorskou identitou podání. Účet může reprezentovat jednotlivce i libovolný kolektiv lidí a registrační e-mail může patřit jednotlivci nebo skupině. Aplikace nemá zjišťovat, evidovat ani zveřejňovat identity jednotlivých osob stojících za účtem a nemá modelovat samostatné spoluautory.

Aplikace podporuje přihlášení a reset zapomenutého hesla jednorázovým časově omezeným tokenem zaslaným na registrovaný e-mail. Resetovací token není magic-link login.

Administrátor používá stejný účet a autentizační mechanismus jako běžný uživatel. Oprávnění je serverově vynuceno rolí `ADMIN`; pro MVP stačí role `USER` a `ADMIN`. Admin roli nelze získat veřejnou registrací ani měnit z klientského UI.

Konkrétní password hashing, session cookies, CSRF ochrana, session rotation, throttling/lockout a recovery patří do security baseline před produkčním nasazením.

## Formulář podání

Kvazivěta se **nezadává jako jeden volný text**. Formulář pracuje s jednotlivými výskyty slov se stabilními interními ID a pevným pořadím.

- každé slovo je samostatný řetězec,
- uživatel nevkládá mezery,
- text se normalizuje do Unicode NFC,
- frontend kontroluje veřejná znaková pravidla,
- backend provede stejnou autoritativní normalizaci a kontrolu,
- mezery ve výsledném zobrazení generuje aplikace.

Uživatel explicitně deklaruje typ věty:
- oznamovací → `.`,
- tázací → `?`,
- rozkazovací → `!`.

Tato vazba je deterministický validační invariant. Rozkazovací věta může podle pravidel použít dovolený nevyjádřený podmět imperativu.

Po zadání slov následuje povinná strukturovaná analýza slovo po slově. U každého výskytu slova formulář podle aktuálního field schema vyžaduje zejména:
- slovní druh,
- úplnou soutěžní identitu podle zvoleného modelu,
- lemma / základní tvar,
- morfologické vlastnosti konkrétního použitého tvaru,
- konkrétní použitý `surfaceForm`,
- hlavní větnou funkci nebo technickou roli funkčního slova,
- všechny povinné odkazy na konkrétní další výskyty slov,
- minimální obhajobu a zdroje vyžadované pravidly.

Podle rozhodnutí #86 hráč ručně nevyplňuje celé paradigma ani nepoužité tvary. Normativní tabulky systém používá k deterministickému ověření konkrétního deklarovaného tvaru.

### Exact-match kontrola skutečného slova

Po vyplnění kompletní identity a konkrétního použitého tvaru může hráč požádat o exact-match kontrolu proti **katalogu skutečných slov**. Výsledek smí pouze potvrdit, že přesně tato kombinace už je v katalogu uznaná jako skutečné slovo. Nesmí nabízet možné identity, autocomplete, podobná slova ani alternativy.

Tato kontrola je odlišná od interní morfologické review cache. Stav review cache se hráči před submittem nikdy nezobrazuje ani nedotazuje jako membership oracle.

### Syntaxe
UI nabízí uzavřený seznam hlavních syntaktických funkcí. Odborný významový podtyp není povinný whitelist.

- běžný závislý člen má právě jedno řídící slovo,
- přísudek nemá head,
- doplněk má zvlášť vazbu k přísudku a k podmětu nebo předmětu,
- koordinace má dvě různé spojované části,
- předložky `k/v/z` nemají hlavní větnou funkci; mají technickou roli a právě jednu vazbu na řízené jmenné slovo.

Povinnou vazbu nelze nahradit volným textem.

## Hranice živé validace

Během editace formulář smí kontrolovat zveřejněná mechanická a strukturální pravidla, úplnost deklarace a deterministicky odvoditelnou morfologii konkrétního hráčova návrhu. Nesmí generovat kandidáty, navrhovat jiný model nebo řešit valenci, významové či nedeterministické syntaktické spory za hráče.

Exact-match kontrola katalogu skutečných slov je zvláštní povolený lookup kompletního vlastního návrhu. Naproti tomu interní review cache je vždy neveřejná a její membership se před submittem neprozrazuje.

Pokud pravidly přípustný případ formulář neumí reprezentovat, přímo ve formuláři je viditelná informace o možnosti kontaktovat rozhodčího e-mailem. Pro MVP se nezavádí speciální fallback workflow ani zvláštní stav podání.

## Draft a immutable revize

`sentence` je dlouhodobý kontejner řešení jednoho registrovaného účtu. Běžná práce probíhá v editovatelném draftu.

Každé konečné odeslání vytvoří **immutable `sentence_revision`** – přesný snapshot textu, pořadí slov, strukturovaných deklarací, syntaxe, zdrojů, obhajoby, typu věty, vlastnícího účtu a času submitu. Normativně odvoditelné nepoužité tvary paradigmatu nejsou povinnou součástí hráčova snapshotu.

Admin ani validační systém nikdy nerozhodují nad proměnlivým draftem. Všechny verdicty odkazují na konkrétní revizi. Pokud je podání vráceno k doplnění, stará revize zůstává nedotčena a další odeslání vytvoří revizi novou.

Nová verze pravidel nevytváří novou revizi věty; nad stejnou immutable revizí vznikne nový validační výsledek.

## MVP schvalovací workflow

1. Registrovaný účet odešle draft; vznikne immutable revize.
2. Backend zopakuje všechny deterministické kontroly včetně odvození konkrétních morfologických tvarů.
3. U tokenů deklarovaných jako skutečná slova se jejich status řeší proti samostatnému katalogu skutečných slov; případný chybějící exact match není sám o sobě automatické zamítnutí a může jít k review/správě katalogu.
4. Nad uzamčenou revizí proběhne neveřejný lookup relevantních morfologických posouzení v interní review cache pro danou `rules_version`.
5. `APPROVED` review cache se pro tutéž verzi pravidel znovu použije automaticky.
6. `REJECTED` poskytne adminovi existující negativní rozhodnutí a důvod.
7. `UNKNOWN` musí admin ručně posoudit. Schválením vzniká budoucí `APPROVED`, zamítnutím `REJECTED` v review cache pro danou rules verzi.
8. Admin může revizi schválit, zamítnout nebo vrátit k doplnění.
9. Čekající a zamítnuté revize nejsou veřejné. Zveřejní se až revize administrativně uznaná a obsahově platná podle příslušné verze pravidel.

Veřejné peer review není součástí MVP.

## Katalog skutečných slov

Katalog skutečných slov je samostatná provozní lexikální autorita. Není obecně scoped na jednu `rules_version`; lze jej průběžně opravovat a rozšiřovat bez vydání nové verze pravidel. Musí umět exact-match nad kompletní soutěžní identitou a konkrétním použitým tvarem a uchovávat auditní stopu správy katalogu.

Hráčské rozhraní nad tímto katalogem je záměrně omezené: žádný browse, export, prefix search, autocomplete ani nabídka podobných slov.

## Interní morfologická review cache

Review cache je neveřejná provozní paměť podřízená pravidlům. Pro každou novou `rules_version` začíná automatický schvalovací prostor prázdný; historická rozhodnutí starších verzí se uchovávají, ale nepřenášejí jako automatické schválení.

Rozhodující stavy jsou:
- `APPROVED`,
- `REJECTED`,
- `UNKNOWN` (absence rozhodného záznamu může být jeho technickou reprezentací).

Rozhodnutí review cache uchovává minimálně konkrétní identitu/tvar, `rules_version`, výsledek, rozhodujícího admina, čas, důvod a zdroje. Review cache nesmí vytvářet nové soutěžní pravidlo ani být použita jako veřejný membership oracle.

## Revalidace a historie

Historické schválení podle starší verze pravidel je neměnný fakt. Po vydání nové `rules_version` může stejná immutable revize dostat nový obsahový validační výsledek; do aktuálního žebříčku vstupují jen řešení platná podle aktuální verze.

Historická procesní compliance původního podání (např. tehdy platná AI/tool policy) se při obsahové revalidaci retroaktivně nepřepisuje.

Každý rozhodující validační záznam musí být reprodukovatelný a uvádět příslušnou rules/review-cache/validator provenance. Pokud rozhodnutí záviselo na tehdejším stavu katalogu skutečných slov, musí být dohledatelná i tato lexikální provenance, aniž by se katalog skutečných slov tímto stal součástí `rules_version`.

## Bez komentářů v MVP

Komentáře, komentářové identity, komentářové magic linky, moderace komentářů a jejich privacy/retention lifecycle nejsou součástí prvního MVP. Jejich případné budoucí zavedení bude nové produktové rozhodnutí.
