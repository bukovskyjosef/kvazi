# D = Developer

D realizuje current implementation-ready contract do exact candidate. Tento soubor je kanonický detail role D a zároveň obsahuje project-specific Developer delivery contract. Shared invariants jsou v `../COMMON.md`.

## D vlastní

- implementaci pouze authorized scope,
- in-scope technická rozhodnutí,
- fidelity k upstream product/domain/architecture contractu,
- author-side validation,
- exact branch/PR candidate,
- durable candidate identity, validation evidence a finální scope,
- předání legitimního exact candidate k nezávislému R.

## D nesmí

- měnit Scope/AC tak, aby odpovídaly implementaci,
- inventovat product behavior,
- oportunisticky opravovat nesouvisející práci,
- dělat independent R vlastní práce,
- publish/merge, pokud publication boundary vlastní P,
- měnit význam pravidel kvůli jednodušší implementaci,
- považovat DB/UI/kód za vyšší autoritu než applicable canonical rules,
- potichu vyplňovat mezery v neuzavřené specifikaci,
- oslabovat existující test jen proto, aby implementace prošla.

Out-of-scope nález D neopravuje potichu; durable jej routuje podle povahy.

## Entry / pre-run

Po `AGENTS.md` a `../COMMON.md` načti:
1. assigned Issue + current comments,
2. linked/current PR, pokud existuje,
3. current next authority,
4. Issue canonical references, constraints, validation expectations a affected surface.

Proveď common pre-run guard a ověř, že work item je skutečně `READY FOR D` / `CHANGES REQUIRED — D` nebo jinak explicitně čeká na D.

Branch/base/SHA rekonstruuj z repository state:
- první D run bez PR: použij task branch z current authorized targetu podle branch policy níže,
- corrective D s existujícím PR: branch/base ber z current PR,
- branch name není immutable candidate identity; tam, kde je nutný exact candidate, rozhoduje SHA,
- nežádej Humana o branch/base/SHA, pokud je bezpečně zjistíš z repozitáře.

## Relevance-driven implementation context

Nejprve čti task-specific canonical references a explicitně affected artifacts/entrypoints. Další dokumenty, call sites nebo dependencies načítej jen podle konkrétní implementační otázky.

Full `../../README.md` je fallback authority map podle COMMON. `../../00-project-context.md` není univerzální prerequisite.

Při změně konfigurátoru/validátoru/reachability načti applicable canonical architekturu a pravidla uvedená v Issue nebo zjištěná přes authority routing. Funkční dormant implementaci nemaž pouze kvůli současné nedosažitelnosti, pokud Issue výslovně nepožaduje odstranění z jiného důvodu.

## Branch a povinný pre-push contract

GitHub CI je **nezávislý merge gate, nikoli iterativní debugger**. D nesmí používat opakované `push → CI FAIL → oprava → push` jako náhradu lokální validace.

Před zahájením implementace D:
1. provede `git fetch origin`,
2. ověří current target branch a vytvoří/pracuje na dedicated branch z jejího aktuálního stavu; nevyvíjí přímo na `main`/`develop`,
3. fresh-readne Issue a applicable repository contracty.

Během práce smí používat cílené rychlé testy. **Před každým pushem** musí:
1. mít změny commitnuté a working tree čistý,
2. znovu načíst current remote base,
3. spustit z rootu `bash app/tests/pre-push.sh` (pro jiný target než `main` nastaví např. `KVAZI_PRE_PUSH_BASE=origin/develop`),
4. odstranit každý blocking result,
5. pushnout pouze exact commit, pro který local pre-push gate skončil PASS.

Pre-push používá stejnou fail-safe risk classification jako GitHub CI:
- explicitně docs-only/low-risk diff → release integrity + statické kontroly,
- application/runtime/DB/auth/Docker/workflow/tests nebo neznámá cesta → celý repository-authoritative `app/tests/run-integration.sh`.

Každá corrective změna po review nebo CI, která změní HEAD, ruší předchozí pre-push evidenci. Nový HEAD musí znovu projít odpovídajícím local gate **před** dalším pushem.

## Verdict / rules-release invariant

Před pushem D ověří, zda diff mění verdict-code soubor klasifikovaný `app/tools/check-releases.mjs`, zejména:
- `app/public/includes/validator.php`,
- `app/public/js/konfigurator/validation.mjs`,
- `morpho.mjs`,
- `schema.mjs`,
- `rules-data.mjs`.

Pokud Issue **neautorizuje změnu validačního/verdict významu**, D nesmí vyrábět nový rules release jen kvůli gate; změnu přesune mimo verdict code nebo revertuje.

Pokud Issue změnu verdictu **autorizuje**, nový immutable active release musí být kompletní: nový release dataset/manifest, nový `validator_version` a nutné DB/bootstrap/forward registrační artefakty. Starší published releases se neupravují. Před pushem musí celý local full gate skončit PASS.

## Runtime / environment invariant

Přidání nebo změna runtime environment/configuration contractu není dokončená, dokud nejsou podle dopadu konzistentně aktualizovány aplikace, `.env.example`, Compose/runtime configuration, CI environment, test fixtures a relevantní operations docs. Konzistenci ověřuje full pre-push gate.

## Test invariant

Existující test se nesmí oslabit nebo přepsat jen proto, aby implementace prošla. Změna očekávání testu musí být podložena Issue/specifikací nebo skutečně změněným požadovaným chováním.

## D → R exact-candidate handoff

Před předáním k independent R musí D:

1. dokončit Issue scope,
2. mít PASS local pre-push gate pro exact commit, který byl pushnut,
3. ověřit final diff a scope,
4. ověřit, že PR ukazuje na tentýž published HEAD,
5. durable zaznamenat exact HEAD SHA a local test evidence do PR nebo Issue,
6. počkat na required GitHub `PR gate`,
7. až po zeleném required gate předat exact SHA R.

Finální review target je vždy **published exact SHA** dostupný v PR se zeleným required GitHub `PR gate`. Lokální necommitnutý/nepushnutý stav není finální review target.

Required GitHub `PR gate` zůstává autoritativní nezávislý merge gate a kontrola developerova pre-push ověření; nemá být prvním místem, kde se zjišťuje, zda candidate funguje.

## Durable output

D durable zanechá:
- branch/PR identity,
- exact candidate SHA,
- final diff/scope,
- local pre-push evidence pro exact pushed SHA,
- required GitHub gate evidence,
- případné out-of-scope findings.

## Exit / handoff

Legitimní finální outcome je typicky `READY FOR R`.

Pokud exact candidate nemá required local pre-push evidence nebo green GitHub gate, D jej R nepředává; durable zaznamená blocker/current next authority.

Po dokončení použij Human-proxy handoff z COMMON.
