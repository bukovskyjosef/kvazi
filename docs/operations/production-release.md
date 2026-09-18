# Produkční release

> **Stav tohoto dokumentu:** popisuje cílový release flow po cutoveru #124. Dokud neproběhne skutečný cutover, platí předchozí M5 kontrakt a aktuální stav se ověřuje v GitHub Issues.

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

1. Target `main`, enforcement Active; changes through PR, alespoň jedno nezávislé approval, dismiss stale approvals, resolve conversations, require approval of most recent push.
2. Require status checks a up-to-date branch: **`CI / PR gate`**. Po prvním CI běhu vyberte skutečný check name v UI.
3. Zakažte force push a delete branch; žádný bypass pro běžné releases.
4. `.github/workflows/`, `.github/ci/` a test runner potřebují nezávislé review jako ostatní release změny.

## Coolify Application

Produkční Application je připojená přes **GitHub App**:

- Git source `bukovskyjosef/kvazi`, branch **`main`**.
- **Auto Deploy ON** — Coolify automaticky nasadí po pushi do `main` přes GitHub App webhook.
- Build pack Dockerfile, base/build context **`/`**, Dockerfile **`docker/php/Dockerfile`**, exposed internal port **`80`**.
- Žádný veřejný direct port mapping PHP, source bind mount ani startup/pre/post-deployment DB command.
- Application má baked-in image, DB je samostatný persistentní PG18 resource na kompatibilní interní síti.
- Autoritativní readiness je součást image: **Docker `HEALTHCHECK` v `docker/php/Dockerfile`**, interval 10 s, timeout 5 s, start period 10 s, retries 12.

```dockerfile
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=12 CMD ["php", "/usr/local/bin/kvazi-healthcheck.php"]
```

Docker provádí existující příkaz `php /usr/local/bin/kvazi-healthcheck.php`. Probe je mimo document root, ověřuje interní HTTP `/healthz` přes dostupné PHP a nepřidává curl/wget ani DB startup hook.

Povinný packaging gate (`deployment.acceptance.mjs`) kontroluje přesný Dockerfile kontrakt, healthcheck konfiguraci postaveného image i běžícího kontejneru, skutečný Docker stav `healthy` a probe exit0/exit1 při dostupné/nedostupné DB.

Build arg `SOURCE_COMMIT` předává git SHA do image pro veřejnou identitu nasazené verze (`/api/version.php`). Coolify jej při Auto Deploy předává automaticky.

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

GitHub `production` Environment se v běžném release flow nepoužívá jako approval gate.

Po cutoveru #124 a ověření nové cesty odstranit obsolete secrets:
- `COOLIFY_TOKEN`, `COOLIFY_READ_TOKEN`, `COOLIFY_APP_UUID`, `COOLIFY_URL` — sloužily pouze starému custom deploy helperu.

DB/Cloudflare/S3 credentials patří do runtime/infra secret storage, nejsou součástí CI.

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

Po review/merge, před prvním deplojem, operátor připraví PG18 resource a bootstrapuje **jen prázdnou produkční DB** z přesného schváleného checkoutu. Sedm souborů **01 → 07 s `ON_ERROR_STOP=1`** je v [kanonickém packaging postupu](../../app/README.md#production-image-a-samostatná-postgresql-18-db). SQL není součást app image; workflow nesmí automaticky aplikovat init SQL.

Po bootstrapu ověřte `server_version_num / 10000 = 18`, schema `kvazi`, revision/validation/admin/morphology/catalog tabulky, čtyři runtime releases a aktivní dataset `public-1.3` v application. Žádné default admin credentials.

Budoucí DB release: backup, review explicitního forward SQL pro skutečný stav DB, `ON_ERROR_STOP=1`, verifikace, kompatibilní app deploy. Release bez DB změny nemá migration step. Nikdy replay bootstrapu/reset volume/automatický schema downgrade/revalidace historických výsledků.

## Rollback

Před cutoverem zaznamenat poslední známý zdravý app SHA jako rollback point.

Po neúspěšném deployi:
- v Coolify znovu nasadit poslední známý zdravý aplikační commit podporovaným mechanismem (dashboard rollback),
- produkční DB neresetovat ani nedowngradovat jen kvůli aplikačnímu rollbacku,
- fix/revert PR do `main` vrátí kompatibilní app obsah, projde gate a automaticky se nasadí,
- žádný automatický force-push/rewind main, `down -v`, mazání dat/obcházení immutable pravidel,
- nouzový app rollback je explicitní operator krok; nasazený SHA a odchylku od main zapište do issue.

## Backup a restore

Před veřejným provozem zapněte Coolify scheduled PG backups do **externího S3-compatible storage mimo failure domain VPS** nebo vlastníkem zvoleného bezpečného cíle. Jednoduché minimum: denní backup, retention posledních 7 úspěšných denních záloh; vlastník potvrdí cíl/retention. Credentials jen Coolify secret storage. Záloha v app containeru/jediném VPS nestačí.

Obnovte **skutečnou produkční zálohu** do explicitně pojmenovaného **disposable PG18 resource/volume**, s jinými connection údaji a ověřením cíle před restore. Nikdy restore přes jedinou ostrou DB.
