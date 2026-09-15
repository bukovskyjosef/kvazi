# Mapa dokumentace

Tento soubor je **jediná úplná mapa artefaktů a jejich autority**.

**Konečnou autoritou hry je kvaziautorita / Josef Bukovský.** Normativní dokumenty jsou kanonickým záznamem přijatých rozhodnutí; pokud si odporují, jde o dokumentační/governance vadu, kterou rozhodne kvaziautorita a dokumentace se následně sjednotí.

## Normativní balík

**Neexistuje jeden soubor „úplných pravidel“.** Soutěžní pravidla tvoří kanonický normativní balík artefaktů s rozdělenými oblastmi odpovědnosti:

1. `rules/02-rozhodcovska-specifikace.md` – obecná pravidla soutěžní platnosti,
2. výslovně označené **NORMATIVNÍ** části `kvazitahak/01-07` – přesná mechanika jednotlivých modulů,
3. `rules/03-ai-policy.md` – pravidla používání AI a nástrojů,
4. `rules/04-verzovani-a-sprava.md` – verzování, revalidace a správa pravidel.

Spravovaný katalog skutečných slov je zvláštní lexikální autorita v rozsahu, který mu normativní balík výslovně svěřuje. Není pátým dokumentem pravidel ani veřejným seznamem kandidátů.

Každý hráčský nebo normativní dokument má u svého začátku krátkou sekci **„Místo v normativním balíku“**. Ta pouze vysvětluje jeho vlastní roli a nejbližší sousední artefakty; **nesmí vytvářet paralelní úplnou mapu autority**. Tou zůstává pouze tento `docs/README.md`.

| Artefakt | Publikum | Normativní? | Účel | Jak se mění |
|---|---|---:|---|---|
| `rules/01-jak-hrat.md` | hráč | ne | stručná příručka základních pravidel a vstup do hry | musí následovat normativní balík |
| `rules/02-rozhodcovska-specifikace.md` | rozhodčí, auditor, vývojář | ano | kanonická obecná pravidla platnosti; neduplikuje přesná paradigmata | produktové změny přes explicitní rozhodnutí Josefa |
| `rules/03-ai-policy.md` | hráč, správce | ano | normativní pravidla používání AI a nástrojů | produktové změny přes explicitní rozhodnutí Josefa |
| `rules/04-verzovani-a-sprava.md` | správce, auditor | ano | normativní pravidla verzování, revalidace a správy | procesní rozhodnutí Josefa |
| `kvazitahak/00-hracsky-tahak.md` | hráč | ne | jediný praktický hráčský rozcestník mezi „Jak hrát“ a přesnými moduly | musí následovat normativní balík |
| `kvazitahak/01-07` – označené NORMATIVNÍ části | hráč, rozhodčí, vývojář | ano | přesné uzavřené modely, tabulky/paradigmata, syntaktické testy, valence, hranice a prefix `kvazi-` | společně s rules verzí / explicitním rozhodnutím Josefa |
| `kvazitahak/` – příklady/vysvětlivky | hráč | ne | srozumitelnost | nesmí rozšířit pravidla |
| spravovaný katalog skutečných slov | rozhodčí, aplikace | zvláštní autorita | potvrzuje soutěžní status skutečných slov/tvarů; není veřejným tahákem kandidátů | průběžná správa dle pravidel, bez nutné změny rules_version |
| `architecture/` | vývojář, auditor | ne | technický návrh | podřízeno pravidlům |
| `db/schema-draft.sql` | vývojář, auditor | ne | pracovní DB návrh | zatím bez statusu produkční migrace |
| GitHub Issues | všichni agenti | procesně autoritativní | jediný živý backlog, stav práce a implementační historie | přes issue workflow a labely |
| `governance/decision-workflow.md` | všichni agenti | procesní | pravidla práce s issues | změna governance procesu |
| `governance/decisions.md` | všichni agenti | ne | historické/stabilní shrnutí dřívějších rozhodnutí | není backlog ani samostatný normativní source of truth |
| `audit/` | auditor | ne | auditní metodika a zprávy | akční nálezy musí být issues |
| `history/` | správce, auditor | ne | historie návrhu | nemá přebíjet aktuální pravidla |
| `app/` | vývojář | ne | aplikační kód | nesmí definovat nové pravidlo |

## Jak si představit hráčské artefakty

Pro hráče existují tři navazující vrstvy:

1. **Jak hrát** – stručná základní pravidla: `rules/01-jak-hrat.md`.
2. **Hráčský tahák** – praktický rozcestník: `kvazitahak/00-hracsky-tahak.md`.
3. **Přesné tabulky a moduly kvazitaháku** – `kvazitahak/01-syntax.md` až `07-prefix-kvazi.md`; jejich výslovně NORMATIVNÍ části jsou závazné a obsahují přesnou mechaniku daných oblastí.

Vedle hráčské cesty stojí **Rozhodcovská specifikace** `rules/02-rozhodcovska-specifikace.md`: je to hlavní obecný normativní dokument pro sporné případy, audit a implementaci. Přesné morfologické tabulky ani ostatní modulové mechanismy v ní záměrně nejsou duplikované. AI policy a verzování mají vlastní normativní dokumenty.

## Autorita backlogu

Aktuální otevřená práce se **nikdy neurčuje z textového souboru v repozitáři**. Získává se přímo z GitHub Issues podle stavu a labelů. Dokumentace může odkazovat na jednotlivé issues jako na závislost nebo historii, ale nesmí udržovat jejich paralelní seznam ani kopii stavů.

## Praktická autorita

Pokud vznikne konflikt:

1. zjisti, zda jde o soutěžní platnost nebo technickou implementaci,
2. pro obecnou soutěžní platnost čti rozhodcovskou specifikaci,
3. pro přesnou morfologii nebo jinou mechaniku konkrétního modulu čti jeho NORMATIVNÍ část v kvazitaháku,
4. pro používání AI/nástrojů čti `rules/03-ai-policy.md`,
5. pro verzování a správu čti `rules/04-verzovani-a-sprava.md`,
6. pro otevřenou otázku nebo práci hledej odpovídající GitHub issue,
7. technický artefakt odporující pravidlům je technická chyba,
8. konflikt normativních dokumentů je governance defect; konečný výklad dává Josef a dokumentace se opraví.

## Dokumenty s TODO

`TODO` znamená nedokončený obsah, nikoli implicitní default. Pokud TODO představuje samostatně plánovanou práci nebo blokuje další vývoj, musí být navázáno na GitHub issue.

## Rychlé cesty

- hráč: `rules/01-jak-hrat.md` → `kvazitahak/00-hracsky-tahak.md` → podle potřeby `kvazitahak/01-07`
- sporný případ / rozhodčí: `rules/02-rozhodcovska-specifikace.md` → relevantní NORMATIVNÍ modul kvazitaháku
- auditor: `/AGENTS.md` → `audit/README.md` → celý `docs/` + `db/schema-draft.sql` + otevřená issues
- vývojář: `/AGENTS.md` → `architecture/00-boundaries.md` → relevantní pravidla → GitHub Issues
