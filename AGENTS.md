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

Kanonické normativní zdroje mají rozdělené oblasti odpovědnosti:

1. `docs/rules/02-rozhodcovska-specifikace.md` – obecná pravidla soutěžní platnosti,
2. výslovně označené **NORMATIVNÍ** části `docs/kvazitahak/` – přesná morfologie, paradigmata a další mechanika konkrétních modulů,
3. `docs/rules/03-ai-policy.md` – používání AI a nástrojů,
4. `docs/rules/04-verzovani-a-sprava.md` – verzování a správa.

Tyto zdroje se nemají významově duplikovat. Konflikt mezi nimi je dokumentační/governance defect; agent jej nesmí vyřešit vlastním výkladem. Konečné rozhodnutí dává Josef a dotčené artefakty se následně sjednotí.

`docs/rules/01-jak-hrat.md` je veřejná vysvětlující vrstva a nesmí vytvářet nové pravidlo. `docs/kvazitahak/00-hracsky-tahak.md` je praktický hráčský rozcestník; normativní jsou pouze výslovně označené části detailních modulů.

### Technická implementace

Architektura, databázové návrhy, UI, validátor, interní katalog a aplikační kód jsou normativním pravidlům podřízené. Implementují pravidla; samy je nemění.

### Mapa autority

Detailní klasifikace všech artefaktů je pouze v `docs/README.md`. Neudržuj její kopii v dalších README.

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

Nesmí:
- měnit význam pravidel kvůli jednodušší implementaci,
- považovat DB schéma, UI nebo existující kód za vyšší autoritu než pravidla,
- potichu vyplňovat mezery v neuzavřené specifikaci.

Pokud lze technický základ vytvořit parametricky bez předjímání otevřené otázky, je to přípustné; jinak platí vývojový gate z governance workflow.

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
3. proveď kontrolu konzistence,
4. spusť relevantní testy/validace, pokud existují,
5. ověř finální diff,
6. zapiš výsledek do issue,
7. až potom issue zavři správným důvodem.

Issue se nezavírá jen proto, že bylo rozhodnuto; zavírá se až po zapracování.
