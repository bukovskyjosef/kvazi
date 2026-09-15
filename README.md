# Nejdelší kvazivěta

Repozitář projektu **Nejdelší kvazivěta**.

## Rychlá orientace

### Pro hráče
- `docs/rules/01-jak-hrat.md`
- `docs/kvazitahak/README.md`

### Pro agenty
- `AGENTS.md` – kanonický vstupní kontrakt
- `docs/00-project-context.md` – smysl a principy projektu
- `docs/README.md` – jediná úplná mapa dokumentace a autority
- GitHub Issues – jediný aktuální backlog

### Pro audit
- `AGENTS.md`
- `docs/audit/README.md`
- GitHub Issues

### Pro vývoj
- `AGENTS.md`
- `docs/architecture/00-boundaries.md`
- `app/README.md`
- GitHub Issues

## Normativní balík

**Neexistuje jeden soubor „úplných pravidel“.** Soutěžní pravidla tvoří kanonický normativní balík artefaktů s rozdělenými oblastmi odpovědnosti:
- `docs/rules/02-rozhodcovska-specifikace.md` – obecná pravidla soutěžní platnosti,
- výslovně označené NORMATIVNÍ části `docs/kvazitahak/` – přesná mechanika jednotlivých modulů,
- `docs/rules/03-ai-policy.md` – pravidla používání AI a nástrojů,
- `docs/rules/04-verzovani-a-sprava.md` – verzování a správa pravidel.

Spravovaný katalog skutečných slov je zvláštní lexikální autorita vymezená těmito pravidly. Úplnou mapu autority udržuje pouze `docs/README.md`.

`docs/rules/01-jak-hrat.md` a `docs/kvazitahak/00-hracsky-tahak.md` jsou hráčské vysvětlující vrstvy; pravidla nerozšiřují.

Architektura, databáze, UI, validátor a aplikační kód pravidla implementují; samy je nemění.

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

## Řízení práce

Finální produktová a pravidlová rozhodnutí provádí Josef Bukovský.

**GitHub Issues jsou jediný aktuální backlog projektu.** README ani jiný Markdown soubor neudržuje seznam otevřených úkolů, jejich stavů nebo priorit.

Detailní governance, labely a issue workflow jsou pouze v `docs/governance/decision-workflow.md`.

## Dokumentační cesta pro hráče

1. **Jak hrát** – jednoduchý vstup.
2. **Hráčský tahák** – praktický rozcestník.
3. **Přesné normativní moduly kvazitaháku** – tabulky a konkrétní mechanika podle potřeby.

Vedle této hráčské cesty stojí rozhodcovská specifikace a další části normativního balíku. Žádný z nich sám nepředstavuje úplná pravidla.

## Autorství

Autorem této podoby kvaziproblému, konceptu **Nejdelší kvazivěty** a jejích pravidel je **Josef Bukovský**.
