# Produkční release

> **Stav tohoto dokumentu:** aktuální provozní kontrakt po dokončeném CI/CD cutoveru #124. Konkrétní release evidence a SHA se evidují v GitHub Issues.

Technický kontrakt pro PR → Coolify Auto Deploy → PostgreSQL 18. Nemění soutěžní pravidla ani domain workflow. Autoritu dokumentace určuje [centrální mapa](../README.md); skutečný stav nasazení a evidence patří do GitHub Issues.

## Release flow

```text
PR
  ↓
1× required CI gate (PR gate)
  ↓
merge do main
  ↓
Coolify GitHub App Auto Deploy
  ↓
Docker HEALTHCHECK
  ↓
krátký read-only production smoke
```

Merge do `main` je záměr nasadit do produkce (rozhodnutí #122). Žádný samostatný production approval, žádný běžný ruční `git_commit_sha` pin v Coolify, žádný custom GitHub deploy trigger.

## GitHub CI

- `ci.yml` spouští jediný required job **`PR gate`** při PR do `main`/`develop`.
  - Vždy: release integrity (`check-releases.mjs`).
  - Docs-only / low-risk změny: pouze rychlé kontroly.
  - Aplikační / runtime / DB / auth / Docker / workflow / test změny: plný integrační stack (Node 22, PHP 8.3, Chromium, Docker Compose PG18, `run-integration.sh`).
  - Fail-safe: neznámá cesta → plný gate. Routing je testovaný regresním testem (`ci-risk.test.mjs`).
- `production.yml` (`Production smoke`) po pushi do `main` deterministicky ověří nasazení přesného commitu (`github.sha`) přes `/api/version.php` a poté provede read-only smoke. Stale healthy produkce neuspěje.
- Explicitní `shell: bash` zapíná `pipefail`, aby `tee` nezměnilo selhání runneru na zelený job.
- PR nemá Environment, secrets, `pull_request_target` ani deployment. Token má pouze `contents: read`.
- Log plného runneru je artifact na 14 dní. CI `down --volumes` uklízí jen disposable GitHub-hosted stack.
- Authoritative full runner pro ruční/auditní použití: `bash app/tests/run-integration.sh`.

### `main` ruleset

1. Target default branch / `main`, enforcement Active; změny jdou přes pull request a review conversations musí být vyřešené.
2. Mechanický ruleset aktuálně nevyžaduje číselný počet approving reviews (`required_approving_review_count = 0`); případné nezávislé review požadavky vycházejí z repository governance, ne z tohoto branch gate.
3. Require status checks + up-to-date branch: jediný required check context je **`PR gate`** z GitHub Actions.
4. Force push a delete branch jsou zakázané a ruleset nemá běžný bypass.
5. `.github/workflows/`, `.github/ci/` a test runner podléhají stejnému repository review/governance procesu jako ostatní release změny.

## Coolify Application

Produkční Application je připojená přes **GitHub App**:

- Git source `bukovskyjosef/kvazi`, branch **`main`**.
- **Auto Deploy ON** — Coolify automaticky nasadí po pushi do `main` přes GitHub App webhook.
- **Source commit availability = Available during build** (Application → Configuration → Advanced; dřívější label `Include Source Commit in Build = ON`) — zpřístupní `SOURCE_COMMIT` při buildu pro deployment identity `/api/version.php`.
- Build pack Dockerfile, base/build context **`/`**, Dockerfile **`docker/php/Dockerfile`**, exposed internal port **`80`**.
- Žádný veřejný direct port mapping PHP, source bind mount ani startup/pre/post-deployment DB command.
- Application má baked-in image, DB je samostatný persistentní PG18 resource na kompatibilní interní síti.
- Autoritativní readiness je součást image: **Docker `HEALTHCHECK` v `docker/php/Dockerfile`**, interval 10 s, timeout 5 s, start period 10 s, retries 12.

```dockerfile
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=12 CMD ["php", "/usr/local/bin/kvazi-healthcheck.php"]
```

Docker provádí existující příkaz `php /usr/local/bin/kvazi-healthcheck.php`. Probe je mimo document root, ověřuje interní HTTP `/healthz` přes dostupné PHP a nepřidává curl/wget ani DB startup hook.

Povinný packaging gate (`deployment.acceptance.mjs`) kontroluje přesný Dockerfile kontrakt, healthcheck konfiguraci postaveného image i běžícího kontejneru, skutečný Docker stav `healthy` a probe exit0/exit1 při dostupné/nedostupné DB.

Build arg `SOURCE_COMMIT` předává git SHA do image pro veřejnou identitu nasazené verze (`/api/version.php`). V Coolify je proto explicitně nastaveno **Source commit availability = Available during build**.

Runtime env pouze v Coolify, ne build args (kromě `SOURCE_COMMIT`):

```text
APP_ENV=production
DB_HOST=<skutecny-interni-host-z-Coolify>
DB_PORT=<skutecny-interni-port-z-Coolify>
DB_NAME=<skutecny-db-name>
DB_USER=<skutecny-db-user>
DB_PASSWORD=<secret>
AUTH_COOKIE_SECURE=1
TRUSTED_PROXY_CIDRS=<skutecna-bezprostredni-proxy-CIDR>
```

Použijte přesně interní connection údaje samostatného **PostgreSQL 18** resource, nikdy lokální Compose service/veřejnou IP VPS. Persistentní PG18 storage; app redeploy neřídí DB lifecycle.

## Environment a secrets

GitHub Environment `production` byl po úspěšném cutoveru odstraněn. Stejně tak byly odstraněny obsolete GitHub secrets `COOLIFY_TOKEN`, `COOLIFY_READ_TOKEN`, `COOLIFY_APP_UUID`, `COOLIFY_URL` a revokovány Coolify API tokeny, které sloužily pouze starému custom deploy helperu.

Nový release flow používá GitHub App Auto Deploy a tyto deploy secrets/tokeny nepotřebuje. DB/Cloudflare/S3 credentials patří do runtime/infra secret storage, nejsou součástí CI.

## Production verification a smoke

Po pushi do `main` workflow `Production smoke` deterministicky ověří nasazení:

1. **Deployment identity:** polluje `GET /api/version.php` dokud SHA odpovídá `github.sha`. Stale healthy produkce se starým SHA neuspěje — workflow čeká na aktuální deployment nebo dosáhne timeout a FAIL.
2. **Readiness:** ověří `GET /healthz` → HTTP 200, přesný JSON `{"status":"ok"}`.
3. **Read-only smoke:**
   - `GET https://kvazi.cz/` → HTML/200, bez neočekávaného redirectu,
   - `GET https://kvazi.cz/api/normative.php` → JSON/200, očekávaná aktivní rules verze.

Smoke nesmí vytvářet ani mazat produkční uživatelská data. Neúspěšný deployment/health/smoke znamená FAIL.

Smoke lze spustit i ručně: `EXPECTED_SHA=<sha> node app/tools/production-smoke.mjs`.

## Cloudflare / HTTPS

Operátor nastaví canonical `https://kvazi.cz`, `www.kvazi.cz → https://kvazi.cz`, platný origin certifikát a Cloudflare **Full (Strict)**. DNS/certifikáty/skutečné adresy patří do infra.

Pouze Cloudflare ingress smí dojít k origin Coolify proxy; firewall/origin mechanismus musí blokovat bypass. PHP nesmí být veřejně dostupné mimo proxy. `TRUSTED_PROXY_CIDRS` obsahuje úzkou skutečnou bezprostřední proxy před PHP (preferujte `/32`/`/128`), žádnou odhadnutou širokou privátní síť. Proxy předává `CF-Connecting-IP` pouze z ověřené CF ingress cesty; podstrčený header z jiné cesty nesmí získat trusted význam.

## První DB a forward upgrades

Po review/merge, před prvním deplojem, operátor připraví PG18 resource a bootstrapuje **jen prázdnou produkční DB** z přesného schváleného checkoutu. Osm souborů **01 → 08 s `ON_ERROR_STOP=1`** je v [kanonickém packaging postupu](../../app/README.md#production-image-a-samostatná-postgresql-18-db). SQL není součást app image; workflow nesmí automaticky aplikovat init SQL.

Po bootstrapu ověřte `server_version_num / 10000 = 18`, schema `kvazi`, revision/validation/admin/morphology/catalog tabulky, pět runtime releases a aktivní dataset `public-1.3.1` v application. Žádné default admin credentials.

Při nasazení opravného konfigurátoru nad existující M3 DB předem aplikujte `docker/db/init/08-configurator-release.sql` přes `psql -v ON_ERROR_STOP=1`. Registruje `public-1.3.1` / validator `1.3.1` bez změny schématu, pravidlové mechaniky nebo historických výsledků.

Budoucí DB release: backup, review explicitního forward SQL pro skutečný stav DB, `ON_ERROR_STOP=1`, verifikace, kompatibilní app deploy. Release bez DB změny nemá migration step. Nikdy replay bootstrapu/reset volume/automatický schema downgrade/revalidace historických výsledků.

## Rollback

Pro každý release musí být dohledatelný poslední známý zdravý app SHA; původní cutover rollback point a evidence jsou v #124.

Po neúspěšném deployi:
- v Coolify znovu nasadit poslední známý zdravý aplikační commit podporovaným mechanismem (dashboard rollback),
- produkční DB neresetovat ani nedowngradovat jen kvůli aplikačnímu rollbacku,
- fix/revert PR do `main` vrátí kompatibilní app obsah, projde gate a automaticky se nasadí,
- žádný automatický force-push/rewind main, `down -v`, mazání dat/obcházení immutable pravidel,
- nouzový app rollback je explicitní operator krok; nasazený SHA a odchylku od main zapište do issue.

## Backup a restore

Před veřejným provozem zapněte Coolify scheduled PG backups do **externího S3-compatible storage mimo failure domain VPS** nebo vlastníkem zvoleného bezpečného cíle. Jednoduché minimum: denní backup, retention posledních 7 úspěšných denních záloh; vlastník potvrdí cíl/retention. Credentials jen Coolify secret storage. Záloha v app containeru/jediném VPS nestačí.

Obnovte **skutečnou produkční zálohu** do explicitně pojmenovaného **disposable PG18 resource/volume**, s jinými connection údaji a ověřením cíle před restore. Nikdy restore přes jedinou ostrou DB.
