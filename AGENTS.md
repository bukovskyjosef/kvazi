# AGENTS.md

Tento soubor je **kanonický vstupní kontrakt pro všechny agenty**, kteří pracují s repozitářem. Nástrojově specifické instrukční soubory smějí pouze odkazovat sem a nesmějí kopírovat nebo měnit zdejší pravidla.

**Josef Bukovský je kvaziautorita a jediný konečný decision owner pro produktová, pravidlová a sporná architektonická rozhodnutí. Normativní dokumentace je kanonický záznam jeho přijatých rozhodnutí, nikoli autorita nad ním.**

## 1. Povinný startup protocol

Před netriviální analýzou, auditem nebo změnou:

1. přečti tento `AGENTS.md`,
2. přečti `docs/00-project-context.md`,
3. přečti `docs/README.md` jako mapu autority dokumentace,
4. načti dokumenty relevantní pro svou roli a úkol,
5. zjisti **aktuální** stav práce přímo z GitHub Issues,
6. teprve potom navrhuj změny nebo implementuj.

Nikdy nepoužívej historii chatu, starou auditní zprávu ani ručně udržovaný Markdown seznam jako náhradu za aktuální stav repozitáře a Issues.

## 2. Autorita a source of truth

### Soutěžní platnost

**Neexistuje jeden soubor „úplných pravidel“.** Kanonický normativní balík má rozdělené oblasti odpovědnosti:

1. `docs/rules/02-rozhodcovska-specifikace.md` – obecná pravidla soutěžní platnosti,
2. výslovně označené **NORMATIVNÍ** části `docs/kvazitahak/` – přesná morfologie, paradigmata a další mechanika konkrétních modulů,
3. `docs/rules/03-ai-policy.md` – používání AI a nástrojů,
4. `docs/rules/04-verzovani-a-sprava.md` – verzování a správa.

Spravovaný katalog skutečných slov má zvláštní lexikální autoritu pouze v rozsahu, který mu tento normativní balík výslovně svěřuje.

Tyto zdroje se nemají významově duplikovat. Konflikt mezi nimi je dokumentační/governance defect; agent jej nesmí vyřešit vlastním výkladem. Konečné rozhodnutí dává Josef a dotčené artefakty se následně sjednotí.

`docs/rules/01-jak-hrat.md` je veřejná vysvětlující vrstva a nesmí vytvářet nové pravidlo. `docs/kvazitahak/00-hracsky-tahak.md` je praktický hráčský rozcestník; normativní jsou pouze výslovně označené části detailních modulů.

Každý hráčský vstup a každý normativní dokument balíku musí u svého začátku obsahovat stručnou sekci **„Místo v normativním balíku“**. Tato sekce popisuje jen roli daného dokumentu a jeho nejbližší sousední artefakty; nesmí kopírovat úplnou mapu autority.

### Technická implementace

Architektura, databázové návrhy, UI, validátor, interní katalog a aplikační kód jsou normativním pravidlům podřízené. Implementují pravidla; samy je nemění.

### Reachability, aktivní validační cesta a dormant implementace

Reachability je analytická informace, nikoli filtr pravidel ani nabídky konfigurátoru.

Pro práci na formuláři, validátoru a testech platí:

- všechny normativně povolené modely a hlavní volby zůstávají hráči nabízené i tehdy, když jsou podle aktuálních povrchových pravidel globálně nedosažitelné,
- UI nesmí model, větev ani volbu skrýt nebo označit jako slepou jen na základě reachability,
- validační pipeline smí a má použít obecnou povrchovou kontrolu (NFC, povolené znaky, délka, motiv/tokenová sekvence a prefixová povrchová pravidla) jako časný rozhodující gate,
- pokud konkrétní token nebo věta na této vrstvě už deterministicky selže, není povinnost dále spouštět drahou specializovanou morfologickou či syntaktickou validaci, která nemůže změnit konečný verdikt,
- pokud hotová deep-validace takové větve už existuje a je funkční, **nemaže se ani se hromadně nezakomentovává pouze kvůli současné nedosažitelnosti**; preferuje se zachování jako dormant/reusable kódu odpojeného od aktivního flow,
- dormant implementace může mít levné unit/regression testy proti zahnívání, ale sama o sobě nevynucuje branch-by-branch browser, HTTP, DB nebo cross-engine E2E matici,
- surface-valid request musí i nadále projít dostatečnou serverovou kontrolou deklarace; short-circuit nesmí vytvořit cestu, jak podstrčit neplatný model, enum, prefix, POS, score nebo jinou klientskou odvozeninu,
- reachability analýza nesmí fungovat jako solver nad konkrétním hráčským slovem ani napovídat, která analýza by jeho kandidátu prošla,
- pokud budoucí rules release změní povrchový motiv/abecedu tak, že dormant větev bude znovu dosažitelná, vývojář má nejprve prověřit a znovu zapojit zachovanou implementaci a teprve pro nově aktivní cestu doplnit odpovídající integrační pokrytí.

Podrobnější technický kontrakt validačních fází je v `docs/architecture/03-validation.md`; aktuální implementační práce se vždy řídí také GitHub Issues.

### Mapa autority

Detailní klasifikace všech artefaktů je **pouze** v `docs/README.md`. Neudržuj její úplnou kopii v dalších README ani v lokálních sekcích „Místo v normativním balíku“.

## 3. GitHub Issues jsou jediný živý backlog

Aktuální otevřená práce, její stav, priority, závislosti a disposition se zjišťují přímo z GitHub Issues.

Platí:
- každý významný problém nebo úkol, který má přežít aktuální session, má issue,
- stav práce určuje GitHub `open/closed`, labely a obsah issue,
- každé aktivní issue má alespoň jeden smysluplný label,
- rozhodnutí vzniklé mimo GitHub se stručně přenese do příslušného issue,
- Markdown dokumentace nesmí udržovat paralelní seznam otevřených issues, jejich stavů ani priorit,
- `TODO` není náhrada za issue, pokud představuje samostatnou práci nebo blokuje další postup.

Detailní workflow, label taxonomy, prefixy a pravidla konsolidace jsou **pouze** v `docs/governance/decision-workflow.md`.

## 4. Konflikty mezi artefakty

Pokud dva autoritativní nebo relevantní artefakty odporují jeden druhému:

1. neurčuj vítěze vlastním odhadem,
2. ověř související GitHub Issues a explicitní rozhodnutí decision ownera,
3. pokud již existuje jednoznačné rozhodnutí, oprav zastaralý odvozený artefakt,
4. pokud rozhodnutí chybí nebo je konflikt skutečně normativní, založ/aktualizuj issue a spornou část neimplementuj,
5. konflikt mezi dvěma normativními zdroji je governance defect, nikoli prostor pro kreativní interpretaci agenta; konečný výklad dává Josef.

Technický artefakt odporující platnému pravidlu je vadný technický artefakt.

## 5. Role agentů

### Auditor / oponent

Musí:
- načíst celý relevantní kontext, ne pouze pravidla,
- hledat rozpory, mezery, exploity, expert advantage a skryté předpoklady,
- auditovat podle `docs/audit/README.md`,
- každý samostatný akční nález zachytit v GitHub Issue.

Nesmí:
- bez explicitního rozhodnutí Josefa měnit normativní pravidla,
- proměnit vlastní doporučení v produktové rozhodnutí,
- vést paralelní auditní backlog v textovém souboru.

### Návrhový / produktový agent

Smí analyzovat varianty a připravovat návrhy změn.

Musí:
- zachytit rozhodnutí a jeho důsledky v příslušném issue,
- po explicitním rozhodnutí aktualizovat všechny dotčené canonical artefakty před uzavřením issue.

Nesmí autonomně rozhodnout otevřený produktový nebo pravidlový problém.

### Vývojový agent

Musí před implementací přečíst relevantní normativní pravidla, architekturu a otevřená issues.

#### Branch a povinný pre-push kontrakt

GitHub CI je **nezávislý merge gate, nikoli iterativní debugger**. Developer nesmí používat opakované `push → CI FAIL → oprava → push` jako náhradu lokální validace.

Před zahájením implementace Developer:
1. provede `git fetch origin`,
2. ověří aktuální target branch a vytvoří pracovní branch z jejího aktuálního stavu; nevyvíjí přímo na `main`/`develop`,
3. načte Issue a relevantní repository governance/specifikaci.

Během práce smí používat cílené rychlé testy. **Před každým pushem** však musí:
1. mít změny commitnuté a pracovní strom čistý,
2. znovu načíst aktuální remote base,
3. spustit z kořene repozitáře `bash app/tests/pre-push.sh` (pro jiný target než `main` nastaví např. `KVAZI_PRE_PUSH_BASE=origin/develop`),
4. odstranit každý blokující výsledek,
5. pushnout pouze exact commit, pro který lokální pre-push gate skončil PASS.

Pre-push gate používá stejnou fail-safe risk classification jako GitHub CI:
- explicitně docs-only/low-risk diff → release integrity + statické kontroly,
- jakákoli aplikační, runtime, DB, auth, Docker, workflow, testovací nebo jiná neznámá cesta → celý repository-authoritative integrační gate `app/tests/run-integration.sh`.

Každá corrective změna po review nebo CI, která změní HEAD, ruší předchozí pre-push evidenci. Nový HEAD musí znovu projít odpovídajícím lokálním gate **před** dalším pushem.

##### Verdict / rules-release invariant

Před pushem Developer vždy ověří, zda diff mění verdict-code soubor klasifikovaný `app/tools/check-releases.mjs`, zejména:
- `app/public/includes/validator.php`,
- `app/public/js/konfigurator/validation.mjs`,
- `morpho.mjs`,
- `schema.mjs`,
- `rules-data.mjs`.

Pokud Issue **neautorizuje změnu validačního/verdict významu**, Developer nesmí vyrábět nový rules release jen proto, aby prošel release gate; změnu musí přesunout mimo verdict code nebo revertovat.

Pokud Issue změnu verdictu **autorizuje**, musí být nový immutable active release kompletní: nový release dataset/manifest, nový `validator_version` a všechny nutné DB/bootstrap/forward registrační artefakty. Starší publikované releases se nikdy neupravují. Před pushem musí celý local full gate skončit PASS.

##### Runtime / environment invariant

Přidání nebo změna runtime environment/configuration kontraktu není dokončená změna, dokud nejsou podle dopadu konzistentně aktualizovány aplikace, `.env.example`, Docker Compose/runtime configuration, CI environment, test fixtures a relevantní operations dokumentace. Tuto konzistenci Developer ověřuje full pre-push gate.

##### Test invariant

Existující test se nesmí oslabit nebo přepsat jen proto, aby implementace prošla. Změna očekávání testu musí být podložena Issue/specifikací nebo skutečně změněným požadovaným chováním.

#### Předání Developer → Reviewer

Před předáním implementace k nezávislému review musí vývojový agent:

1. dokončit scope příslušného issue,
2. mít PASS lokálního pre-push gate pro exact commit, který byl pushnut,
3. ověřit finální diff a jeho scope,
4. ověřit, že Pull Request ukazuje na tentýž publikovaný HEAD,
5. durable zaznamenat exact HEAD SHA a lokální testovací evidence do PR nebo souvisejícího issue,
6. počkat na výsledek required GitHub `PR gate`,
7. teprve po zeleném required gate předat exact SHA Reviewerovi k finálnímu review.

Finálním review targetem je vždy **publikovaný exact SHA** dostupný v Pull Requestu se zeleným required GitHub `PR gate`. Lokální necommitnutý nebo nepushnutý stav není finální review target a nesmí být vydáván za stav PR.

Required GitHub `PR gate` zůstává autoritativní technický merge gate a nezávislá kontrola developerova pre-push ověření. Nemá však být prvním místem, kde se zjišťuje, zda implementace nebo repository contract funguje.

Nesmí:
- měnit význam pravidel kvůli jednodušší implementaci,
- považovat DB schéma, UI nebo existující kód za vyšší autoritu než pravidla,
- potichu vyplňovat mezery v neuzavřené specifikaci,
- zaměnit optimalizaci validačního flow za zúžení normativní nabídky modelů,
- mazat funkční dormant implementaci pouze proto, že ji aktuální surface/motiv dělá nedosažitelnou, pokud issue výslovně nepožaduje její odstranění z jiného důvodu.

Pokud lze technický základ vytvořit parametricky bez předjímání otevřené otázky, je to přípustné; jinak platí vývojový gate z governance workflow.

### Reviewer

Reviewer provádí nezávislé review pouze nad publikovaným exact SHA v Pull Requestu se zeleným required GitHub `PR gate`.

Musí:
- ověřit, že reviewovaný exact SHA odpovídá aktuálnímu PR HEAD,
- zkontrolovat diff, scope, relevantní specifikaci/governance a evidence z required GitHub gate,
- podle potřeby spustit **cílené lokální testy nebo reprodukci konkrétního nálezu**,
- durable zapsat PASS/APPROVE nebo konkrétní blocker proti přesnému reviewed SHA.

Reviewer **standardně znovu nespouští celý repository-authoritative integrační/release gate lokálně**, pokud tentýž required gate již pro exact SHA úspěšně proběhl na GitHubu. Required GitHub `PR gate` je pro tento účel sdílená autoritativní testovací evidence a nemá se bez konkrétního důvodu duplikovat lokálním full runem.

Plný lokální gate Reviewer spouští pouze tehdy, když je to nutné k vyšetření konkrétní nesrovnalosti nebo CI chyby, když required GitHub gate pro daný typ změny neposkytuje potřebnou evidenci, nebo když to výslovně vyžaduje konkrétní issue či relevantní technický kontrakt. Samotná potřeba „ještě jednou vše ověřit“ není důvodem k opakování full gate.

Po corrective změně s novým HEAD SHA Reviewer nepřenáší svůj předchozí finální verdikt automaticky. Počká na nový zelený required GitHub `PR gate` a provede delta re-review nového exact SHA; celý lokální integrační gate znovu nespouští bez některého z výše uvedených důvodů.

## 6. Historické artefakty

`docs/history/`, datované soubory v `docs/audit/` a `docs/governance/decisions.md` mohou obsahovat historický kontext, dřívější názvy issues nebo snapshot tehdejšího stavu.

- nejsou aktuálním backlogem,
- nesmějí přebít současné normativní zdroje,
- aktuální stav issue se vždy ověřuje na GitHubu,
- `docs/governance/decisions.md` je shrnutí stabilních rozhodnutí, nikoli samostatný normativní source of truth.

## 7. Zásada proti skrytým pravidlům

Žádný z následujících artefaktů nesmí nepozorovaně změnit soutěžní platnost:
- UI,
- databázové constrainty,
- regex,
- interní katalog,
- validační kód,
- příklady,
- README,
- komentáře v kódu.

## 8. Definition of done pro změnu

Před uzavřením issue nebo označením práce za hotovou:

1. aktualizuj všechny dotčené canonical artefakty,
2. odstraň nebo oprav zastaralé odvozené tvrzení,
3. zkontroluj, že dotčené hráčské/normativní dokumenty mají správnou lokální sekci „Místo v normativním balíku“,
4. proveď kontrolu konzistence,
5. spusť relevantní testy/validace, pokud existují,
6. ověř finální diff,
7. zapiš výsledek do issue,
8. až potom issue zavři správným důvodem.

Issue se nezavírá jen proto, že bylo rozhodnuto; zavírá se až po zapracování.
