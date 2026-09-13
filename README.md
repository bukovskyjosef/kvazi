# Nejdelší kvazivěta

Repozitář projektu **Nejdelší kvazivěta**.

## Rychlá orientace

### Pro hráče
- `docs/rules/01-jak-hrat.md`
- `docs/kvazitahak/README.md`

### Pro audit
- `AGENTS.md`
- `docs/audit/README.md`
- GitHub issue #11

### Pro vývoj
- `AGENTS.md`
- `docs/architecture/00-boundaries.md`
- `app/README.md`

## Normativní zdroje

Soutěžní platnost určují:
- `docs/rules/02-rozhodcovska-specifikace.md`
- výslovně označené normativní části `docs/kvazitahak/`
- `docs/rules/03-ai-policy.md`
- `docs/rules/04-verzovani-a-sprava.md`

`docs/rules/01-jak-hrat.md` je stručná vysvětlující vrstva.

Architektura, databáze, UI a interní katalog pravidla implementují; samy je nemění.

## Struktura

```text
AGENTS.md
.github/
app/
db/
docs/
  audit/
  rules/
  kvazitahak/
  architecture/
  governance/
  history/
```

## Rozhodování a otevřené body

Finální produktová a pravidlová rozhodnutí provádí Josef Bukovský.

Používané prefixy GitHub Issues:
- `[DECISION]` – otevřená volba
- `[AUDIT]` – auditní nález
- `[IMPLEMENTATION]` – technický úkol
- `[META]` – procesní práce

Podrobný postup: `docs/governance/decision-workflow.md`.

Aktuální rozhodovací backlog:
- #1 kvazitahák
- #2 slovesné časovací typy
- #3 valenční rámce a vid
- #4 reachability audit
- #5 morfologický formulář
- #6 interní morfologický katalog
- #7 znakový validátor
- #8 architektura a DB model
- #9 release proces
- #10 scope MVP
- #11 nezávislý audit repozitáře

## Dokumentační vrstvy pro hráče

1. **Jak hrát** – jednoduchý vstup.
2. **Kvazitahák** – praktické modely a tabulky.
3. **Rozhodcovská specifikace** – úplná normativní pravidla.

## Autorství

Autorem této podoby kvaziproblému, konceptu **Nejdelší kvazivěty** a jejích pravidel je **Josef Bukovský**.
