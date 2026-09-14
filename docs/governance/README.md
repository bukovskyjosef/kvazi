# Governance – index

## Základní princip

Josef Bukovský rozhoduje finální produktové a pravidlové otázky.

Agenti připravují analýzy, varianty, nálezy a implementační návrhy, ale nemají nahrazovat explicitní rozhodnutí implicitním předpokladem.

## Jediný backlog

**GitHub Issues jsou jediným autoritativním backlogem projektu.**

V dokumentaci se neudržuje seznam aktuálně otevřených bodů, jejich stavů ani priorit. Stav práce se zjišťuje přímo z GitHub Issues podle `open/closed`, labelů, vazeb a obsahu jednotlivých issues.

Každé aktivní issue musí mít alespoň jeden smysluplný label. Dokument může na konkrétní issue odkazovat, ale nesmí vytvářet paralelní kopii backlogu.

## Soubory

- `decision-workflow.md` – povinný životní cyklus issues, rozhodnutí, labely a pravidla pro agenty
- `decisions.md` – historické/stabilní shrnutí významných dříve přijatých rozhodnutí; není backlogem ani autoritativním stavem issue
- `glossary.md` – slovník pojmů

## Klasifikace issues

Primární klasifikací jsou GitHub labely:
- `question` – otevřená specifikace, produktová/pravidlová otázka nebo auditní téma,
- `enhancement` – plánovaná implementace nebo feature,
- `bug` – rozpor implementace s přijatým chováním,
- `documentation` – práce, jejímž hlavním výstupem jsou pravidla/specifikace/dokumentace,
- `duplicate` – požadavek absorbovaný do jiného master issue.

Prefixy typu `[SPEC]`, `[DECISION]`, `[AUDIT]`, `[IMPLEMENTATION]`, `[FEATURE]` nebo `[META]` mohou zůstat v názvu pro čitelnost, ale nenahrazují labely.

## Co je důležitější než tento adresář

Tento adresář není normativní herní specifikace.

Pokud governance shrnutí odporuje aktuálním normativním pravidlům, opravuje se governance shrnutí. Pokud dokumentace a issue tracker odporují ve stavu otevřené práce, stav GitHub Issue je autoritativní.
