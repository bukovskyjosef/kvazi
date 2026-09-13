# Mapa dokumentace

Tento soubor je orientační mapa artefaktů a jejich autority.

| Artefakt | Publikum | Normativní? | Účel | Jak se mění |
|---|---|---:|---|---|
| `rules/01-jak-hrat.md` | hráč | ne | stručný vstup do hry | musí následovat normativní pravidla |
| `rules/02-rozhodcovska-specifikace.md` | rozhodčí, auditor, vývojář | ano | hlavní pravidla platnosti | produktové změny přes rozhodnutí Josefa |
| `rules/03-ai-policy.md` | hráč, správce | ano | používání AI | produktové změny přes rozhodnutí Josefa |
| `rules/04-verzovani-a-sprava.md` | správce, auditor | ano | verze, revalidace, governance | procesní rozhodnutí Josefa |
| `kvazitahak/` – označené NORMATIVNÍ části | hráč, rozhodčí | ano | uzavřené soutěžní modely | společně s rules verzí |
| `kvazitahak/` – příklady/vysvětlivky | hráč | ne | srozumitelnost | nesmí rozšířit pravidla |
| `architecture/` | vývojář, auditor | ne | technický návrh | podřízeno pravidlům |
| `db/schema-draft.sql` | vývojář, auditor | ne | pracovní DB návrh | zatím bez statusu produkční migrace |
| `governance/decisions.md` | všichni agenti | nepřímo | stabilní shrnutí přijatých voleb | aktualizovat po významném rozhodnutí |
| `governance/open-issues.md` | všichni agenti | ne | index backlogu | GitHub Issues jsou detailnější zdroj |
| `audit/` | auditor | ne | auditní metodika a zprávy | auditor může přidávat nálezy |
| `history/` | správce, auditor | ne | historie návrhu | nemá přebíjet aktuální pravidla |
| `app/` | vývojář | ne | aplikační kód | nesmí definovat nové pravidlo |

## Praktická autorita

Pokud vznikne konflikt:

1. zjisti, zda jde o soutěžní platnost nebo technickou implementaci,
2. pro soutěžní platnost čti rozhodcovskou specifikaci a normativní kvazitahák,
3. pro otevřenou otázku hledej `[DECISION]` issue,
4. technický artefakt odporující pravidlům je technická chyba,
5. nevyřešený rozpor založ jako `[AUDIT]` nebo `[DECISION]` issue.

## Dokumenty s TODO

`TODO` znamená skutečně otevřenou specifikaci. Neznamená implicitní default ani oprávnění vývojáře zvolit vlastní variantu.

## Rychlé cesty

- hráč: `rules/01-jak-hrat.md` -> `kvazitahak/`
- auditor: `/AGENTS.md` -> `audit/README.md` -> celý `docs/` + `db/schema-draft.sql`
- vývojář: `/AGENTS.md` -> `architecture/00-boundaries.md` -> relevantní pravidla -> issues
