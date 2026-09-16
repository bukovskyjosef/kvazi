# Aplikační část

Tento README je pouze technická orientace k aplikaci. Neobsahuje soutěžní pravidla, aktuální field schema ani živý backlog.

Autoritativní kontext:
- `/AGENTS.md` — vstupní kontext a governance pro agenty,
- `/docs/README.md` — mapa artefaktů a jejich autorita,
- `/docs/architecture/` — cílová technická architektura,
- GitHub Issues — jediný živý backlog a aktuální implementační úkoly.

## Stack

- PHP 8.x
- PostgreSQL
- HTML5
- CSS
- vanilla JavaScript

## Lokální spuštění

Z kořene repozitáře:

```sh
php -S 127.0.0.1:8080 -t app/public
```

Konfigurátor je dostupný na:

```text
http://127.0.0.1:8080/konfigurator.php
```

Vyžaduje přihlášeného uživatele pro submit; samotná stránka se zobrazí i nepřihlášenému.

## Struktura konfigurátoru

Hlavní frontendové moduly jsou v `public/js/konfigurator/`:

- `schema.mjs` — technická reprezentace polí a číselníků používaných aktuálním prototypem,
- `state.mjs` — kanonický klientský stav draftu a mutace,
- `validation.mjs` — deterministické klientské kontroly,
- `view.mjs` — DOM rendering odvozeného stavu,
- `editor.mjs` — události a koordinace editoru,
- `morpho.mjs` — morfologická logika aktuální implementace,
- `terms.mjs` — textové/terminologické konstanty UI.

Konkrétní význam polí, pravidlové požadavky a cílové chování konfigurátoru se neudržují v tomto README; řídí se aktuální dokumentací a GitHub Issues.

## Testy

Deterministické regresní testy (Node.js 22 nebo novější, bez aplikačních závislostí):

```sh
node --test app/tests/*.test.mjs
```

Povinný DoD běh (Docker, dostupná DB, HTTP server a Playwright včetně prohlížeče):

```sh
bash app/tests/run-integration.sh
```

Příkaz selže při chybějící závislosti nebo přeskočeném povinném scénáři. Běžný `node --test` může při nedostupném stacku HTTP/DB testy přeskočit; takový běh nenahrazuje DoD.

Samostatný browser test používá Playwright dostupný mimo aplikační runtime a cílí na běžící PHP stack:

```sh
PLAYWRIGHT_MODULE=/absolutni/cesta/playwright/index.mjs node app/tests/konfigurator.browser.mjs
```

`CHROME_PATH` může určit vlastní executable prohlížeče. `KVAZI_BASE_URL` přepíše výchozí `http://127.0.0.1:8080`. Test vyžaduje běžící PHP server (docker compose up nebo php -S).

## Zásada údržby

Do `app/README.md` nepatří duplikace soutěžních pravidel, morfologických tabulek, validačních rozhodnutí ani stavů jednotlivých issues. Takové informace mají zůstat pouze v jejich autoritativních zdrojích, aby aplikační README nedriftovalo od aktuálního produktu.
