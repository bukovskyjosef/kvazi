# Mapa dokumentace

Tento soubor je orientační mapa artefaktů a jejich autority.

| Artefakt | Publikum | Normativní? | Účel | Jak se mění |
|---|---|---:|---|---|
| `rules/01-jak-hrat.md` | hráč | ne | stručný vstup do hry | musí následovat normativní pravidla |
| `rules/02-rozhodcovska-specifikace.md` | rozhodčí, auditor, vývojář | ano | hlavní pravidla platnosti | produktové změny přes explicitní rozhodnutí Josefa |
| `rules/03-ai-policy.md` | hráč, správce | ano | používání AI/nástrojů | produktové změny přes explicitní rozhodnutí Josefa |
| `rules/04-verzovani-a-sprava.md` | správce, auditor | ano | verze a revalidace | procesní rozhodnutí Josefa |
| `kvazitahak/` – označené NORMATIVNÍ části | hráč, rozhodčí | ano | uzavřené soutěžní modely | společně s rules verzí |
| `kvazitahak/` – příklady/vysvětlivky | hráč | ne | srozumitelnost | nesmí rozšířit pravidla |
| `architecture/` | vývojář, auditor | ne | technický návrh | podřízeno pravidlům |
| `db/schema-draft.sql` | vývojář, auditor | ne | pracovní DB návrh | zatím bez statusu produkční migrace |
| GitHub Issues | všichni agenti | procesně autoritativní | jediný backlog, stav práce, rozhodnutí a implementační historie | přes issue workflow a labely |
| `governance/decision-workflow.md` | všichni agenti | procesní | pravidla práce s issues | změna governance procesu |
| `governance/decisions.md` | všichni agenti | ne | historické/stabilní shrnutí dřívějších rozhodnutí | není backlog ani povinný decision log |
| `audit/` | auditor | ne | auditní metodika a zprávy | akční nálezy musí být issues |
| `history/` | správce, auditor | ne | historie návrhu | nemá přebíjet aktuální pravidla |
| `app/` | vývojář | ne | aplikační kód | nesmí definovat nové pravidlo |

## Autorita backlogu

Aktuální otevřená práce se **nikdy neurčuje z textového souboru v repozitáři**. Získává se přímo z GitHub Issues podle stavu a labelů.

Dokumentace může odkazovat na jednotlivé issues jako na závislost nebo historii, ale nesmí udržovat jejich paralelní seznam ani kopii stavů.

## Praktická autorita

Pokud vznikne konflikt:

1. zjisti, zda jde o soutěžní platnost nebo technickou implementaci,
2. pro soutěžní platnost čti rozhodcovskou specifikaci a normativní kvazitahák,
3. pro otevřenou otázku nebo práci hledej odpovídající GitHub issue,
4. technický artefakt odporující pravidlům je technická chyba,
5. nevyřešený rozpor založ jako issue a přiděl mu odpovídající label.

## Dokumenty s TODO

`TODO` znamená nedokončený obsah, nikoli implicitní default. Pokud TODO představuje samostatně plánovanou práci nebo blokuje další vývoj, musí být navázáno na GitHub issue.

## Rychlé cesty

- hráč: `rules/01-jak-hrat.md` → `kvazitahak/`
- auditor: `/AGENTS.md` → `audit/README.md` → celý `docs/` + `db/schema-draft.sql` + otevřená issues
- vývojář: `/AGENTS.md` → `architecture/00-boundaries.md` → relevantní pravidla → GitHub Issues
