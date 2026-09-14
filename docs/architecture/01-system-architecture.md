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
4. **Mechanický validátor** – živá deterministická kontrola veřejných znakových a strukturálních pravidel; neveřejná katalogová kontrola až po uzamčení podání.
5. **Interní učící se katalog** – neveřejná znalostní báze `APPROVED / REJECTED / UNKNOWN` pro konkrétní `rules_version`.
6. **Administrace** – review podání, rozhodování neznámých katalogových položek, revalidace a auditní stopa.

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
- autora (`username`),
- skóre pro zvolenou verzi pravidel,
- verzi pravidel a stav validace,
- datum,
- analýzu každého slova,
- soutěžní identitu,
- morfologii,
- syntaxi,
- obhajobu a zdroje,
- fiktivní význam / kvazietymologii.

## Uživatelské účty

MVP používá klasickou lehkou registraci:
- globálně unikátní `username`,
- globálně unikátní neveřejný e-mail,
- heslo ukládané pouze jako bezpečný jednosměrný hash.

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

Po zadání slov následuje povinná strukturovaná analýza slovo po slově. U každého výskytu slova formulář vyžaduje podle aktuálního field schema zejména:
- slovní druh,
- úplnou morfologickou identifikaci podle zvoleného soutěžního modelu,
- soutěžní identitu a konkrétní použitý tvar,
- celé uživatelem navržené paradigma tam, kde jej pravidla/form schema vyžadují,
- explicitní potvrzení „Potvrzuji, že toto je můj morfologický návrh.“ svázané s aktuálním snapshotem návrhu,
- hlavní větnou funkci nebo technickou roli funkčního slova,
- všechny povinné odkazy na konkrétní další výskyty slov,
- minimální obhajobu a zdroje vyžadované pravidly.

Předvyplnění buněk paradigmatu aktuálním povrchovým tvarem je pouze UX zkratka; není to jazykový návrh ani schválení systému.

### Syntaxe
UI nabízí uzavřený seznam hlavních syntaktických funkcí. Odborný významový podtyp není povinný whitelist.

- běžný závislý člen má právě jedno řídící slovo,
- přísudek nemá head,
- doplněk má zvlášť vazbu k přísudku a k podmětu nebo předmětu,
- koordinace má dvě různé spojované části,
- předložky `k/v/z` nemají hlavní větnou funkci; mají technickou roli a právě jednu vazbu na řízené jmenné slovo.

Povinnou vazbu nelze nahradit volným textem.

## Hranice živé validace

Během editace formulář smí kontrolovat pouze zveřejněná mechanická a strukturální pravidla a úplnost deklarace. Neověřuje jazykovou správnost skloňování, časování, valence, syntaktické interpretace ani významové obhajoby.

Formulář nikdy před submittem neprozrazuje, zda interní katalog konkrétní slovo, tvar nebo identitu zná. Hráč proto vždy vyplňuje stejnou úplnou požadovanou deklaraci a důkazy bez ohledu na stav katalogu.

Pokud pravidly přípustný případ formulář neumí reprezentovat, přímo ve formuláři je viditelná informace o možnosti kontaktovat rozhodčího e-mailem. Pro MVP se nezavádí speciální fallback workflow ani zvláštní stav podání.

## Draft a immutable revize

`sentence` je dlouhodobý kontejner autorského řešení. Běžná práce probíhá v editovatelném draftu.

Každé konečné odeslání vytvoří **immutable `sentence_revision`** – přesný snapshot textu, pořadí slov, strukturovaných deklarací, paradigmatu, syntaxe, zdrojů, obhajoby, typu věty, autora a času submitu.

Admin ani validační systém nikdy nerozhodují nad proměnlivým draftem. Všechny verdicty odkazují na konkrétní revizi. Pokud je podání vráceno k doplnění, stará revize zůstává nedotčena a další odeslání vytvoří revizi novou.

Nová verze pravidel nevytváří novou revizi věty; nad stejnou immutable revizí vznikne nový validační výsledek.

## MVP schvalovací workflow

1. Registrovaný uživatel odešle draft; vznikne immutable revize.
2. Backend provede veřejné deterministické kontroly znovu server-side.
3. Nad uzamčenou revizí proběhne neveřejný lookup každé relevantní soutěžní identity/tvaru v katalogu pro danou `rules_version`.
4. `APPROVED` se pro tutéž verzi pravidel znovu použije automaticky.
5. `REJECTED` poskytne adminovi existující negativní rozhodnutí a důvod.
6. `UNKNOWN` musí admin ručně posoudit. Schválením vzniká budoucí `APPROVED`, zamítnutím `REJECTED`.
7. Zamítnutí kteréhokoli slova/identity nezbytné pro deklarovanou analýzu znamená zamítnutí dané revize.
8. Admin může revizi schválit, zamítnout nebo vrátit k doplnění.
9. Čekající a zamítnuté revize nejsou veřejné. Zveřejní se až revize administrativně uznaná a obsahově platná podle příslušné verze pravidel.

Veřejné peer review není součástí MVP.

## Interní katalog

Katalog je provozní znalostní báze podřízená pravidlům. Pro každou novou `rules_version` začíná automatický schvalovací prostor prázdný; historická rozhodnutí starších verzí se uchovávají, ale nepřenášejí jako automatické schválení.

Rozhodující stavy jsou:
- `APPROVED`,
- `REJECTED`,
- `UNKNOWN` (absence rozhodného záznamu může být jeho technickou reprezentací).

Katalogové rozhodnutí uchovává minimálně konkrétní identitu/tvar, `rules_version`, výsledek, rozhodujícího admina, čas, důvod a zdroje. Katalog nesmí vytvářet nové soutěžní pravidlo.

## Revalidace a historie

Historické schválení podle starší verze pravidel je neměnný fakt. Po vydání nové `rules_version` může stejná immutable revize dostat nový obsahový validační výsledek; do aktuálního žebříčku vstupují jen řešení platná podle aktuální verze.

Historická procesní compliance původního podání (např. tehdy platná AI/tool policy) se při obsahové revalidaci retroaktivně nepřepisuje.

Každý rozhodující validační záznam musí být reprodukovatelný a uvádět příslušnou rules/catalog/validator provenance a způsob automatického či ručního rozhodnutí.

## Bez komentářů v MVP

Komentáře, komentářové identity, komentářové magic linky, moderace komentářů a jejich privacy/retention lifecycle nejsou součástí prvního MVP. Jejich případné budoucí zavedení bude nové produktové rozhodnutí.
