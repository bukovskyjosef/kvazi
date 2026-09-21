# Mapa dokumentace

Tento soubor je **jediná úplná mapa významových kategorií repozitáře a jejich autority**. Nemá katalogizovat každý jednotlivý soubor; má zajistit, aby člověk i agent dokázali určit roli každé významné vrstvy projektu a našli správný source of truth.

**Konečnou autoritou hry je kvaziautorita / Josef Bukovský.** Normativní dokumenty jsou kanonickým záznamem přijatých rozhodnutí; pokud si odporují, jde o dokumentační/governance vadu, kterou rozhodne kvaziautorita a dokumentace se následně sjednotí.

## Normativní balík

**Neexistuje jeden soubor „úplných pravidel“.** Soutěžní pravidla tvoří kanonický normativní balík artefaktů s rozdělenými oblastmi odpovědnosti:

1. `rules/02-rozhodcovska-specifikace.md` – obecná pravidla soutěžní platnosti,
2. výslovně označené **NORMATIVNÍ** části `kvazitahak/01-07` – přesná mechanika jednotlivých modulů,
3. `rules/03-ai-policy.md` – pravidla používání AI a nástrojů,
4. `rules/04-verzovani-a-sprava.md` – verzování, revalidace a správa pravidel.

Spravovaný katalog skutečných slov je zvláštní lexikální autorita v rozsahu, který mu normativní balík výslovně svěřuje. Není pátým dokumentem pravidel ani veřejným seznamem kandidátů.

Každý hráčský nebo normativní dokument má u svého začátku krátkou sekci **„Místo v normativním balíku“**. Ta pouze vysvětluje jeho vlastní roli a nejbližší sousední artefakty; **nesmí vytvářet paralelní úplnou mapu autority**. Tou zůstává pouze tento `docs/README.md`.

## Mapa významových kategorií repozitáře

| Artefakt / kategorie | Publikum | Normativní? | Účel | Jak se mění / čte |
|---|---|---:|---|---|
| `/AGENTS.md` | všichni agenti | procesní vstupní router | minimální povinný vstup a role-first routing | role-bound session z něj pokračuje do `agent/COMMON.md` a pouze vlastního role contractu; tool-specific instrukce jej nesmějí přebít |
| `agent/COMMON.md` | K/A/D/R/P | procesní / kanonický shared role contract | shared activation, pre-run, authority, context-economy, override a Human-proxy invariants | povinný pro role-bound session po `AGENTS.md`; nesmí obsahovat D/R/P-specific operational detail |
| `agent/ROLES.md` | H/K/A/D/R/P | procesní / kanonický registry | stručný seznam canonical rolí a lifecycle root | je součástí téhož delegated role-contract tree; běžný cold start nemusí číst detail ostatních rolí |
| `agent/roles/{K,A,D,R,P}.md` | vždy jen aktivní role | procesní / kanonický role detail | self-sufficient ownership, boundaries, entry, context triggers, evidence, exit a handoff konkrétní role | role-bound session čte pouze svůj detail; D/R technical contracts žijí v příslušném role file |
| root `README.md` + tool-specific instrukční stuby (např. `CLAUDE.md`, `.github/copilot-instructions.md`) | člověk, agent | ne | orientace a přesměrování na `AGENTS.md` | nesmějí vytvářet vlastní startup/role model ani nutit universal read `docs/README.md` před Issue |
| `00-project-context.md` | agent podle tasku, člověk | ne | stabilní kontext, cíle a produktové principy projektu | conditional source: čte se, když je nutný pro product intent/scope nebo na něj task/role explicitně routuje |
| `rules/01-jak-hrat.md` | hráč | ne | stručná příručka základních pravidel a vstup do hry | musí následovat normativní balík |
| `rules/02-rozhodcovska-specifikace.md` | rozhodčí, auditor, vývojář | ano | kanonická obecná pravidla platnosti; neduplikuje přesná paradigmata | produktové změny přes explicitní rozhodnutí Josefa |
| `rules/03-ai-policy.md` | hráč, správce | ano | normativní pravidla používání AI a nástrojů | produktové změny přes explicitní rozhodnutí Josefa |
| `rules/04-verzovani-a-sprava.md` | správce, auditor | ano | normativní pravidla verzování, revalidace a správy | procesní rozhodnutí Josefa |
| `kvazitahak/00-hracsky-tahak.md` | hráč | ne | jediný praktický hráčský rozcestník mezi „Jak hrát“ a přesnými moduly | musí následovat normativní balík |
| `kvazitahak/01-07` – označené NORMATIVNÍ části | hráč, rozhodčí, vývojář | ano | přesné uzavřené modely, tabulky/paradigmata, syntaktické testy, valence, hranice a prefix `kvazi-` | společně s rules verzí / explicitním rozhodnutím Josefa |
| `kvazitahak/` – příklady/vysvětlivky | hráč | ne | srozumitelnost | nesmí rozšířit pravidla |
| spravovaný katalog skutečných slov | rozhodčí, aplikace | zvláštní autorita | potvrzuje soutěžní status skutečných slov/tvarů; není veřejným tahákem kandidátů | průběžná správa dle pravidel, bez nutné změny `rules_version` |
| `architecture/` | vývojář, auditor | ne | technický návrh systému | podřízeno pravidlům; `03-validation.md` je kanonický technický kontrakt validačních fází a rozlišení úplné modelové nabídky, surface gate a dormant deep-validace; `05-konfigurator-ux.md` je funkční/UX projekce tohoto kontraktu |
| `operations/` | provoz, vývojář, reviewer | ne | aktuální produkční release kontrakt i budoucí provozní/migrační handoffy | vstupní rozcestník je `operations/README.md`; do skutečného cutoveru platí aktuální aktivní kontrakt, plánované změny samy o sobě nemění provoz; skutečný stav a backlog jsou v GitHub Issues |
| `db/schema-draft.sql` | vývojář, auditor | ne | návrhový/pracovní DB model | **není executable runtime migrace ani jediný zdroj skutečného runtime schématu** |
| root `docker-compose.yml` | vývojář, provoz, auditor | ne | lokální/runtime orchestrace PostgreSQL a PHP vrstvy | provozní artefakt; určuje mimo jiné, které runtime soubory jsou skutečně připojeny do kontejnerů |
| `docker/` | vývojář, provoz, auditor | ne | kontejnerová/runtime infrastruktura | implementační/provozní vrstva; nesmí vytvářet produktová ani soutěžní pravidla |
| `docker/db/init/` | vývojář, provoz, auditor | ne | **executable DB bootstrap / runtime schema-init vrstva** připojená z `docker-compose.yml` do PostgreSQL `/docker-entrypoint-initdb.d` | při práci s persistence se musí kontrolovat vedle návrhového `db/schema-draft.sql`; není to totéž co návrh ani obecný migrační framework |
| `app/` | vývojář, auditor | ne | aplikační kód, veřejné projekce, API a testy | skutečná implementace; nesmí definovat nové pravidlo a musí být kontrolována proti normativním/architektonickým zdrojům |
| `.github/` | správce, vývojář, agent | ne / procesní podpora | issue/PR šablony a tool-specific repository metadata | podporuje workflow; GitHub Issues zůstávají jediným živým backlogem a `AGENTS.md` jediným agentním vstupním kontraktem |
| GitHub Issues | všichni agenti | procesně autoritativní | jediný živý backlog, stav práce a implementační historie | přes issue workflow, stav a labely |
| `governance/decision-workflow.md` | všichni agenti | procesní | pravidla práce s issues | změna governance procesu |
| `governance/decisions.md` | všichni agenti | ne | historické/stabilní shrnutí dřívějších rozhodnutí | není backlog ani samostatný normativní source of truth |
| `audit/README.md` | auditor | ne / metodický | aktuální metodika auditu | akční nálezy musí být GitHub Issues |
| datované soubory v `audit/` | auditor, správce | ne / historický snapshot | zachycují výsledek auditu a stav projektu **k uvedenému datu** | nejsou aktuálním backlogem ani současným celkovým verdiktem; aktuální práci ověřuj v Issues a pravidla v normativním balíku |
| `archive/` | správce, auditor | ne / historický archiv | vyřazené pracovní materiály a starší podklady | **nesmí přebít aktuální normativní balík, architekturu ani GitHub Issues** |
| `history/` | správce, auditor | ne / historický | historie návrhu a vývoje konceptu | nemá přebíjet aktuální pravidla, architekturu ani Issues |

### Návrhová DB vrstva versus skutečný runtime bootstrap

Při práci s persistence je nutné držet oddělené dvě role:

- `db/schema-draft.sql` je **návrhový artefakt** používaný pro diskusi a návrh databázového modelu,
- `docker/db/init/` je **executable bootstrap/runtime schema-init vrstva**, kterou root `docker-compose.yml` připojuje do standardního PostgreSQL init adresáře.

Proto nelze z kontroly samotného `db/schema-draft.sql` usuzovat na aktuální skutečně bootstrapované schéma. Auditor nebo vývojář, který mění persistence/runtime, musí zkontrolovat oba artefakty a jejich vazbu na aplikaci. Naopak existence runtime init SQL z něj nedělá vyšší autoritu nad pravidly nebo architektonickými rozhodnutími.

## Jak si představit hráčské artefakty

Pro hráče existují tři navazující vrstvy:

1. **Jak hrát** – stručná základní pravidla: `rules/01-jak-hrat.md`.
2. **Hráčský tahák** – praktický rozcestník: `kvazitahak/00-hracsky-tahak.md`.
3. **Přesné tabulky a moduly kvazitaháku** – `kvazitahak/01-syntax.md` až `07-prefix-kvazi.md`; jejich výslovně NORMATIVNÍ části jsou závazné a obsahují přesnou mechaniku daných oblastí.

Vedle hráčské cesty stojí **Rozhodcovská specifikace** `rules/02-rozhodcovska-specifikace.md`: je to hlavní obecný normativní dokument pro sporné případy, audit a implementaci. Přesné morfologické tabulky ani ostatní modulové mechanismy v ní záměrně nejsou duplikované. AI policy a verzování mají vlastní normativní dokumenty.

## Autorita backlogu

Aktuální otevřená práce se **nikdy neurčuje z textového souboru v repozitáři**. Získává se přímo z GitHub Issues podle stavu a labelů. Dokumentace může odkazovat na jednotlivé issues jako na závislost nebo historii, ale nesmí udržovat jejich paralelní seznam ani kopii stavů.

Datované auditní zprávy jsou historické snapshoty. Jejich tehdejší seznam nálezů, gates, priorit nebo „celkový verdikt“ se nesmí používat jako tvrzení o současném stavu projektu.

## Praktická autorita

Pokud vznikne konflikt:

1. zjisti, zda jde o soutěžní platnost nebo technickou implementaci,
2. pro obecnou soutěžní platnost čti rozhodcovskou specifikaci,
3. pro přesnou morfologii nebo jinou mechaniku konkrétního modulu čti jeho NORMATIVNÍ část v kvazitaháku,
4. pro používání AI/nástrojů čti `rules/03-ai-policy.md`,
5. pro verzování a správu čti `rules/04-verzovani-a-sprava.md`,
6. pro otevřenou otázku nebo práci hledej odpovídající GitHub issue,
7. pro technickou architekturu čti relevantní `architecture/`; při práci na konfigurátoru/validátoru vždy `architecture/03-validation.md` a podle rozsahu `architecture/05-konfigurator-ux.md`,
8. pro skutečný lokální/runtime persistence bootstrap čti `docker-compose.yml` a `docker/db/init/` vedle `db/schema-draft.sql`,
9. technický artefakt odporující pravidlům je technická chyba,
10. konflikt normativních dokumentů je governance defect; konečný výklad dává Josef a dokumentace se opraví.

## Dokumenty s TODO

`TODO` znamená nedokončený obsah, nikoli implicitní default. Pokud TODO představuje samostatně plánovanou práci nebo blokuje další vývoj, musí být navázáno na GitHub issue.

## Rychlé cesty

- hráč: `rules/01-jak-hrat.md` → `kvazitahak/00-hracsky-tahak.md` → podle potřeby `kvazitahak/01-07`
- sporný případ / rozhodčí: `rules/02-rozhodcovska-specifikace.md` → relevantní NORMATIVNÍ modul kvazitaháku
- role-bound agent: `/AGENTS.md` → `agent/COMMON.md` → pouze `agent/roles/<ACTIVE_ROLE>.md` → assigned Issue + current comments (+ relevantní PR) → pre-run guard → task Canonical references / affected surfaces → minimum complete relevant context; tento `README.md` je fallback authority map, ne universal pre-Issue read
- auditní práce: podle work contractu A nebo R; po vlastním role contractu načti `audit/README.md` a další auditní/technické zdroje pouze pokud je konkrétní audit vyžaduje
- D konfigurátoru/validátoru: po Issue/pre-run guardu načti `architecture/03-validation.md` a podle scope `architecture/05-konfigurator-ux.md` jako applicable canonical technický contract; reachability nesmí filtrovat modelovou nabídku a dormant deep-validace se nemaže pouze kvůli současnému motivu
- D persistence/runtime: po Issue/pre-run guardu a task routingu porovnej podle affected surface relevantní `architecture/` + `db/schema-draft.sql` (návrh) + `docker-compose.yml`/`docker/db/init/` (executable bootstrap) + relevantní `app/` kód
