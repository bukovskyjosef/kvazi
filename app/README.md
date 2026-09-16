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

- `rules-data.mjs` — jediná JS přístupová vrstva k versioned normative release datům,
- `schema.mjs` — technická reprezentace formulářových polí a úplné normativní modelové nabídky,
- `state.mjs` — kanonický klientský stav draftu a mutace,
- `validation.mjs` — orchestrace deterministických klientských kontrol,
- `morpho.mjs` — deep morfologická logika nad normativními tabulkami,
- `view.mjs` — DOM rendering odvozeného stavu,
- `editor.mjs` — události a koordinace editoru,
- `terms.mjs` — textové/terminologické konstanty UI.

Konkrétní význam polí, pravidlové požadavky a cílové chování konfigurátoru se neudržují v tomto README; řídí se aktuální dokumentací a GitHub Issues.

## Aktivní a dormant validační cesta

Model selectors se reachability analýzou nefiltrují. Všechny normativně povolené modely zůstávají v UI dostupné.

Validační orchestrace ale může po definitivním surface/motiv failure skončit dřív a nespouštět branch-specific deep-validaci, která už nemůže změnit INVALID verdikt.

Pokud `morpho.mjs` nebo backend už obsahují funkční deep-validator pro dnes nedosažitelnou větev, takový kód se pouze kvůli současnému motivu nemaže ani hromadně nezakomentovává. Může zůstat jako dormant/reusable implementace a mít levné unit testy; povinné browser/HTTP/DB/E2E pokrytí se soustředí na aktivní flow a server authority.

Detailní kontrakt je v `/docs/architecture/03-validation.md` a `/docs/architecture/05-konfigurator-ux.md`.

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

## Runtime release a DB upgrade

Nový verdict používá explicitní `data/active-release.json`, společný dataset a manifest. PHP ověřuje SHA-256, identitu release a verzi běžícího validátoru; submit kontroluje také registraci v DB. Historické release soubory se nepřepisují. `node app/tools/check-releases.mjs` ověřuje integritu vůči `origin/main` (jiný Git base lze zadat přes `KVAZI_RELEASE_BASE`); stejná kontrola běží při PR.

Čistý Docker bootstrap používá všechny soubory `docker/db/init/`. Existující DB potřebuje jednorázově nové `05-m1-release.sql` a atomické `06-m1-core.sql` přes `psql -v ON_ERROR_STOP=1`; init adresář se nad existujícím volume automaticky znovu nespouští. Historické revize/výsledky zůstávají zachované. Konfliktní legacy data migraci zastaví; reset volume není upgrade.

Nad hotovou M1/M2 DB se M3 nasazuje pouze aplikací `docker/db/init/07-m3-release.sql` přes `psql -v ON_ERROR_STOP=1` a novým aplikačním/runtime balíkem. Migrace registruje immutable release, nepřidává tabulky/sloupce/indexy a nespouští revalidaci. Produktové stránky a jejich privacy/decision kontrakt popisuje [07-product-workflow.md](../docs/architecture/07-product-workflow.md).

Povinný runner ověří browser launch před testy, PHP syntax, celý Node/parity/HTTP/DB stack, čistý bootstrap a upgrade v samostatné disposable databázi a všechny browser scénáře. Cleanup test fixtures používá privilegovaný bypass immutable triggerů pouze pro vlastní testová data.

Za TLS proxy nastavte `AUTH_COOKIE_SECURE=1`; přímé HTTPS jej nastaví automaticky. Session má absolutní životnost dvě hodiny. Logout vyžaduje POST a stejný CSRF token jako ostatní browserové změny. Admin stránky i endpointy používají serverový `auth_require_admin()`; HTTP/DB a browser regrese ověřují jejich autorizaci a mutation CSRF.
