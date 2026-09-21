# Nejdelší kvazivěta

Repozitář projektu **Nejdelší kvazivěta**.

## Rychlá orientace

### Pro hráče
- `docs/rules/01-jak-hrat.md`
- `docs/kvazitahak/README.md`

### Pro agenty
- `AGENTS.md` – jediný povinný startup router
- GitHub Issues – jediný aktuální backlog a task state
- `AGENTS.md` pro role-bound práci routuje přes shared + active-role contract k Issue/PR a task-specific canonical references
- `docs/README.md` – úplná mapa autority používaná jako fallback, ne universal pre-Issue read

### Pro audit
- `AGENTS.md`
- `docs/audit/README.md`
- GitHub Issues

### Pro vývoj
- `AGENTS.md`
- `docs/architecture/00-boundaries.md`
- `app/README.md`
- GitHub Issues

Při práci na konfigurátoru, validátoru nebo jejich testech navíc vždy čti:
- `docs/architecture/03-validation.md` – canonical technický kontrakt validačních fází, surface gate a dormant deep-validace,
- `docs/architecture/05-konfigurator-ux.md` – funkční/UX projekce konfigurátoru.

Důležitý implementační invariant: všechny normativně povolené modely zůstávají hráči nabízené; reachability nesmí filtrovat UI. Po definitivním konkrétním surface/motiv failure však aktivní flow nemusí spouštět deep branch-specific validaci, která už nemůže změnit INVALID verdikt. Funkční hotový deep-validator se kvůli současné nedosažitelnosti nemaže; zůstává jako udržovatelná dormant/reusable implementace.

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

Tento přehled je pouze rychlá orientace; úplnou klasifikaci a autoritu artefaktů určuje `docs/README.md`.

```text
AGENTS.md
.github/
app/
db/                    # návrhové DB artefakty
docker/                 # runtime/provozní artefakty včetně executable DB bootstrapu
docker-compose.yml      # lokální runtime orchestrace
docs/
  archive/              # historické nenormativní materiály
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
