# Aplikační část

Tento README je pouze technická orientace k aplikaci. Neobsahuje soutěžní pravidla, aktuální field schema ani živý backlog.

Autoritativní kontext:
- `/AGENTS.md` — vstupní kontext a governance pro agenty,
- `/docs/README.md` — mapa artefaktů a jejich autorita,
- `/docs/architecture/` — cílová technická architektura,
- GitHub Issues — jediný živý backlog a aktuální implementační úkoly.

## Stack

- PHP 8.3 + Apache (pdo, pdo_pgsql, intl, mbstring)
- PostgreSQL 18
- HTML5
- CSS
- vanilla JavaScript

## Lokální spuštění

Z kořene repozitáře:

```sh
docker compose up --build
```

Compose načítá lokální `.env` nebo runtime env (např. z Coolify). Bez `.env` použije pouze development fallback `kvazi/kvazi`. Volitelně zkopírujte `.env.example` do ignorovaného `.env` a nastavte vlastní hodnoty před prvním bootstrapem DB. `DB_PASSWORD` je jediný název hesla; změna env na existujícím PostgreSQL volume sama heslo DB nezmění. `.env.example` je dokumentace kontraktu, nemá skutečné secrets. PHP dotenv soubory nenačítá; mimo Compose musí web server dostat stejné proměnné ze svého runtime environmentu (lokální server lze spustit pomocí `php -S 127.0.0.1:8080 -t app/public`).

Konfigurátor je dostupný na:

```text
http://127.0.0.1:8080/konfigurator.php
```

Vyžaduje přihlášeného uživatele pro submit; samotná stránka se zobrazí i nepřihlášenému.

Compose používá stejný root Dockerfile jako production image, source bind mounty pouze překrývají baked-in `app/public` a `app/data`. PostgreSQL 18 ukládá data do named `db_data` na `/var/lib/postgresql` (uvnitř `18/docker`), init adresář se spouští jen nad novou prázdnou DB. Běžné `compose up` volume nemaže. PG16 volume nelze přímo otevřít PG18 image: před přechodem zachovejte původní volume a proveďte explicitní dump/restore do samostatného PG18 volume nebo podporovaný major upgrade. To je odlišné od forward SQL upgrade aplikačního schématu. Nepoužívejte `down -v` jako migraci. Pro izolovaný nový lokální stack lze zvolit vlastní Compose project `docker compose -p kvazi_pg18 up --build` po zastavení původních kontejnerů; starý project volume zůstane zachovaný. Viz [oficiální PG18 volume layout](https://docs.docker.com/guides/postgresql/).

## Production image a samostatná PostgreSQL 18 DB

GitHub/Coolify release flow, Environment secrets, infra handoff, backup/restore a post-merge acceptance popisuje [produkční provozní kontrakt](../docs/operations/production-release.md).

Z rootu repozitáře buildněte samostatný PHP/Apache image:

```sh
docker build -f docker/php/Dockerfile -t kvazi-app:release .
```

Image obsahuje pouze runtime `app/public` v `/var/www/html` a `app/data` v `/var/www/data` mimo document root; root `.dockerignore` omezuje context na runtime a packaging, vylučuje `.env*`, Git a test artefakty. Aplikace nemá PostgreSQL server ani DB startup/migration hook. V Coolify odpovídá samostatné Application, PostgreSQL 18 samostatnému persistentnímu resource; žádný source bind mount není potřeba. Interní HTTP port je **80**, veřejný readiness endpoint **GET `/healthz`**. Vrací pouze JSON status `ok`/200 nebo `unavailable`/503 po DB `SELECT 1`, bez session a interních údajů. Apache mapuje přesnou URL bez redirectu; `/healthz.php` používá stejný handler.

Packaging navíc obsahuje `/usr/local/bin/kvazi-healthcheck.php` mimo document root: přes dostupné PHP kontroluje interní HTTP `/healthz`. Dockerfile vlastní production `HEALTHCHECK` s tímto probe, intervalem 10 s, timeoutem 5 s, start period 10 s a 12 retries; readiness konfigurace nezávisí na healthcheck polích Coolify API. Nepřidává HTTP klient ani DB startup hook. Přesný image healthcheck a source omezení popisuje výše odkazovaný provozní kontrakt.

Runtime env je přesně kontrakt `.env.example`: `APP_ENV`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `AUTH_COOKIE_SECURE`, `TRUSTED_PROXY_CIDRS`. Produkční DB endpoint/name/user/password nastavte explicitně; `db` je jen local-dev fallback, externí hostname ani port nejsou fixní. HTTPS/proxy kontrakt níže zůstává platný. Image ani jeho tag neobsahují deployment secrets.

**Úplně nová prázdná externí DB:** vytvoření DB/resource provede provoz explicitně mimo application container. Z autorizovaného prostředí s `psql` a `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER` a bezpečně dodaným heslem (runtime `PGPASSWORD` nebo chráněný pgpass) jednorázově aplikujte bootstrap v tomto pořadí:

```sh
set -e
for sql in docker/db/init/01-init.sql \
           docker/db/init/02-user-account.sql \
           docker/db/init/03-submission.sql \
           docker/db/init/04-corrective-release.sql \
           docker/db/init/05-m1-release.sql \
           docker/db/init/06-m1-core.sql \
           docker/db/init/07-m3-release.sql \
           docker/db/init/08-configurator-release.sql; do
  psql -v ON_ERROR_STOP=1 -f "$sql"
done
```

SQL soubory jsou explicitní provozní krok z repozitáře, nikoli obsah application image. Potom nasadíte image s runtime env. **Existující DB:** aplikujte pouze relevantní forward upgrade pro její aktuální stav podle sekce níže, poté nový image; nikdy automaticky nereplayujte celý init adresář. Application restart/redeploy DB neinitializuje, neupgraduje ani neřídí její lifecycle. Žádný nový migration framework se nezavádí.

Povinný runner assertuje skutečný DB major **18**, ověřuje disposable bootstrap/upgrade/conflicting rollback a původní immutable/cleanup/regression stack. `deployment.acceptance.mjs` navíc vždy buildí root image a vytvoří vlastní external PG18 resource s odlišným hostname/portem/name/user/password a vlastní volume; application má `Mounts=[]`, testuje runtime layout/versions/extensions, safe healthz 200/503, stránky a marker/release fingerprint po application redeploy. Uklízí pouze vlastní test image/network/container/volume. Samostatný cílený běh:

```sh
node --test app/tests/deployment.acceptance.mjs
```

Deployment acceptance je povinnou součástí `bash app/tests/run-integration.sh`, bez volitelného skipu. Skutečné Coolify resource/DNS/CI/CD/backup/mail nejsou tímto packagingem vytvářené.

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

Oprava konfigurátoru používá `public-1.3.1` / validator `1.3.1` bez změny pravidlové mechaniky. Před nasazením nad M3 DB aplikujte atomickou, idempotentní registraci `docker/db/init/08-configurator-release.sql` přes `psql -v ON_ERROR_STOP=1`. Existující releases a výsledky zůstávají beze změny; automatická revalidace se nespouští.

Povinný runner ověří browser launch před testy, PHP syntax, celý Node/parity/HTTP/DB stack, čistý bootstrap a upgrade v samostatné disposable databázi a všechny browser scénáře. Cleanup test fixtures používá privilegovaný bypass immutable triggerů pouze pro vlastní testová data.

Za TLS proxy nastavte `AUTH_COOKIE_SECURE=1`; přímé HTTPS jej nastaví automaticky. Session má absolutní životnost dvě hodiny. Logout vyžaduje POST a stejný CSRF token jako ostatní browserové změny. Admin stránky i endpointy používají serverový `auth_require_admin()`; HTTP/DB a browser regrese ověřují jejich autorizaci a mutation CSRF.

## Transakční mail

`includes/mail.php` poskytuje `kvazi_mail_send(string $to, string $subject, string $textBody): void` — minimální interní mail adapter bez externích závislostí.

Dva transporty:
- **smtp** — dependency-free SMTP klient (EHLO, STARTTLS, AUTH LOGIN, DATA). V produkci povinný; plaintext (`SMTP_TLS_MODE=none`) je v produkci zakázán.
- **outbox** — deterministic JSONL sink do `MAIL_OUTBOX_PATH` pro integrační testy. V produkci zakázán (`APP_ENV=production`).

Runtime env (viz `.env.example`): `MAIL_TRANSPORT`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_TLS_MODE`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME`, `MAIL_OUTBOX_PATH`. Produkční SMTP credentials (SMTP2GO) nastavte přes Coolify/runtime env, nikoli v repozitáři.

Header injection (CR/LF v recipient, subject, from) je odmítnuta. Dot-stuffing v body dle RFC 5321 §4.5.2.

## Veřejné non-mail MVP

Produkční web server musí spouštět PHP 8.3+ s `pdo_pgsql`, `intl` a `mbstring`, mít document root pouze `app/public` a ponechat `app/data` mimo něj ve stejné adresářové struktuře. Připojení do PostgreSQL nastavte přes runtime `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`; hodnoty `kvazi/kvazi` a porty v root Compose jsou pouze lokální development konfigurace. `APP_ENV=production` označuje produkční prostředí, ale samo nenastavuje secrets, HTTPS ani trust; tyto hodnoty musí provoz explicitně přepsat. Čistá DB používá všechny bootstrap SQL, existující instalace postupuje podle upgrade výše. Produkční secrets nepatří do repozitáře ani do `.env.example`, nastavují se přes Coolify/runtime env.

HTTPS je provozní podmínka veřejného nasazení. Za TLS terminující proxy nastavte `AUTH_COOKIE_SECURE=1`. PHP warnings a výjimky se logují serverově, nezobrazují se klientovi. Dynamické odpovědi používají `nosniff`, `Referrer-Policy: same-origin` a `X-Frame-Options: DENY`; aplikace nepovoluje rich HTML ani framing.

Login throttle používá `auth_client_ip()`. Při přímém nasazení ponechte `TRUSTED_PROXY_CIDRS=` prázdné: použije jen validní `REMOTE_ADDR`, forwarded hlavičky ignoruje. Za proxy nastavte comma-separated IPv4/IPv6 CIDRs **bezprostřední proxy před PHP**, ideálně konkrétní `/32` či `/128`; žádná privátní síť ani Cloudflare rozsah není automatický default. Jen pokud `REMOTE_ADDR` odpovídá takovému CIDR, helper použije jednu validní IP z `CF-Connecting-IP`. Chybějící/neplatný header vrací REMOTE_ADDR, malformed CIDR se ignoruje. `X-Forwarded-For` se nikdy nepoužívá. IP je normalizovaná, limit 10 pokusů / 15 minut a DB schema zůstávají stejné.

Podporovaný produkční kontrakt je Cloudflare → Coolify reverse proxy → PHP: v Coolify env nastavte skutečný úzký CIDR bezprostřední proxy a `AUTH_COOKIE_SECURE=1`. Coolify musí předat původní `CF-Connecting-IP` pouze z ověřené Cloudflare ingress cesty; origin musí blokovat přímé obejití Cloudflare a nepředávat klientem podstrčenou hlavičku z jiné cesty jako důvěryhodnou. PHP má být dostupné jen přes tuto proxy, nikoli přímým veřejným portem. Samotný CIDR proxy neověřuje upstream Cloudflare: tento krok musí vynutit deployment. Viz [Cloudflare headers](https://developers.cloudflare.com/fundamentals/reference/http-headers/) a [origin IP restriction](https://developers.cloudflare.com/fundamentals/concepts/cloudflare-ip-addresses/). Konkrétní produkční adresy nejsou v repo; před veřejným otevřením ověřte ze dvou sítí rozdílné klientské identity a nemožnost spoofingu mimo trust boundary. Deployment infrastruktura se zde nevytváří.

Bootstrap nevytváří účty ani default credentials. První ADMIN se zaregistruje běžným formulářem a operátor jednorázově povýší správný účet přímo v DB:

```sql
UPDATE kvazi.user_account SET role = 'ADMIN'
 WHERE username = '<skutecne_registrovane_jmeno>' AND role = 'USER';
```

Poté je nutný logout a nový login. Veřejné UI roli nepřiděluje. Ověření e-mailu, automatická obnova hesla a transakční mail nejsou součástí tohoto non-mail MVP.

Security suite také ověřuje `.env*` ignore / verzovatelnost `.env.example`, Compose render bez lokálních secrets i s explicitním override a trust nobody / trusted / untrusted / invalid header či CIDR. Skutečný HTTP login dvou různých klientů za jednou trusted proxy dokazuje oddělené throttle identity a bezpečný fallback. Compose smoke check lze samostatně spustit pomocí `docker compose config --quiet`; běžný config výstup může obsahovat runtime secrets, nepublikujte jej.

Release gate spusťte nad lokálním test deploymentem s development DB `kvazi` / user `kvazi` (stávající disposable test contract), disposable bootstrapem a vlastními test fixtures, nikoli nad produkční DB. Container/HTTP/Playwright overrides runneru zůstávají podporované; testy nejsou nástrojem k přípravě produkčních credentials:

```sh
bash app/tests/run-integration.sh
git diff --check
```

Runner fail-fast ověřuje Docker/DB/HTTP/PHP/Playwright/browser, všechna suites bez skipů a na konci vypisuje `M4 SECURITY BASELINE: PASS`, `M4 LIFECYCLE ACCEPTANCE: PASS`, `RELEASE GATE: PASS`. Security HTTP testy zahrnují produkční Secure cookie, session expiry/rotaci, všechny mutation CSRF/method/admin gates včetně revokace, paralelní registraci/throttle a safe errors. `workflow.browser.mjs` je explicitní acceptance A–E #103: registrace a login přes UI, lifecycle a katalog přes produkční akce, ownership/publication a DB immutability/stabilní review binding. Starší SQL return fixture v submit suite je pouze lower-level DB regresí, není důkazem acceptance.
