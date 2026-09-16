# Produkční release

Technický kontrakt pro GitHub Actions → Coolify → PostgreSQL 18. Nemění soutěžní pravidla ani domain workflow. Autoritu dokumentace určuje [centrální mapa](../README.md); skutečný stav nasazení a evidence patří do GitHub Issues.

## Release flow a GitHub

`feature → develop → release PR → main → full gate → production Environment → Coolify → readiness → read-only smoke`.

- `ci.yml` volá reusable `release-gate.yml` při PR do `main`/`develop`. Push na přípravnou M5 větev ověřuje stejný gate bez deploymentu.
- `production.yml` běží pouze na push do `main`, volá tentýž gate. Deploy má `needs: gate` i kontrolu eventu/refu/úspěchu. Celý production workflow má concurrency `kvazi-production`, `cancel-in-progress: false`; novější push neruší aktivní deploy. GitHub může nahradit čekající run novějším; nejde o FIFO frontu.
- Zachovaný `Published release integrity` kontroluje immutable runtime releases při PR.
- Gate připravuje Node 22, PHP CLI 8.3 s extensions, zamčené CI dependencies, Chromium a vlastní Compose PG18. Spouští **`bash app/tests/run-integration.sh`**, včetně image/external-DB acceptance, bez produkčních secrets. Dependencies v `.github/ci` nejsou součást runtime image.
- Log runneru je artifact na 14 dní. Lokální gate se spouští nad testovou DB, nikdy nad produkcí: vytváří fixtures a používá privilegovaný test cleanup. CI `down --volumes` uklízí jen disposable GitHub-hosted stack.
- Explicitní `shell: bash` zapíná `pipefail`, aby `tee` nezměnilo selhání runneru na zelený job ([GitHub shell semantics](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#jobsjob_idstepsshell)).
- PR nemá Environment, secrets inheritance, `pull_request_target` ani deployment. Actions jsou v nových workflows připnuté na commit; token má pouze `contents: read`.

Vlastník před prvním production merge nastaví Settings → Rules → Rulesets (nebo Branch protection):

1. Target `main`, enforcement Active; changes through PR, alespoň jedno nezávislé approval, dismiss stale approvals, resolve conversations, require approval of most recent push.
2. Require status checks a up-to-date branch: **`Full release gate / Mandatory stack`** z GitHub Actions a **`releases`** z integrity workflow. Po prvním CI běhu vyberte skutečné check names v UI. Nepoužívejte path filtr, který by required gate přeskočil.
3. Zakažte force push a delete branch; žádný bypass pro běžné releases, pokud plán dovoluje, enforce také pro administrátory. Žádné přímé experimentální push.
4. `.github/workflows/`, `.github/ci/` a deploy skript potřebují nezávislé review jako ostatní release změny. Status check sám neochrání workflow před jeho oslabením v PR.

Pokud plán/oprávnění pravidla nevynucují, jde o release blocker. Agent nemění ruleset bez koordinace vlastníka. `develop` vznikne až po review z přesného přijatého a zdravě nasazeného produkčního `main`, ne ze starší milestone větve. Pak feature PR směřují do `develop`, release PR typicky `develop → main`.

## Environment a credentials

Vytvořte Environment **`production`**, deployment branches pouze `main`, required reviewer a prevent self-review, pokud dostupné. Bariéra umožňuje po merge jednorázovou přípravu DB/infra před schválením prvního deploy jobu. Neschvalujte job před přípravou.

Environment secrets (bez hodnot v Git nebo issue):

| Název | Kontrakt |
| --- | --- |
| `COOLIFY_URL` | Důvěryhodný HTTPS origin instance, bez `/api/v1`, userinfo/query/fragment. |
| `COOLIFY_TOKEN` | Team-bound API token pouze `deploy`, používá se jen pro trigger. |
| `COOLIFY_READ_TOKEN` | Team-bound API token pouze `read`, používá se pro source/config/status; bez `read:sensitive`, `write`, `root`. |
| `COOLIFY_APP_UUID` | Skutečný UUID produkční Application. |

Coolify dashboard vytváří deploy-only token, proto se read používá samostatně; žádná náhrada root tokenem. Oba patří pouze deploy jobu v Environment. DB/Cloudflare/S3 credentials patří do runtime/infra secret storage, nejsou potřebné pro gate ani deploy skript. API musí být dostupné runneru přes ověřené HTTPS podle instance access/IP policy. Nepoužívejte vypnutí TLS ani široké zpřístupnění VPS jako workaround. Rotujte/revoke kompromitované tokeny. Skript nepovoluje redirecty, neposílá credentials veřejnému webu a netiskne API odpovědi, build logs ani network exception details.

## Blocker: přesné Git SHA s read/deploy tokenem

Audit oficiálního Coolify source na commitu `054c560cbdc578836ddfa95d8085761d6733e7c7`:

- [`POST /deploy`](https://coolify.io/docs/api/endpoints/deployments/deploy-by-tag-or-uuid) přijímá UUID/force/preview, **nemá commit parametr**.
- [Controller](https://github.com/coollabsio/coolify/blob/054c560cbdc578836ddfa95d8085761d6733e7c7/app/Http/Controllers/Api/DeployController.php) commit do fronty neposílá; [queue helper](https://github.com/coollabsio/coolify/blob/054c560cbdc578836ddfa95d8085761d6733e7c7/bootstrap/helpers/applications.php) bere `application.git_commit_sha` nebo `HEAD`.
- PATCH připnutí Application vyžaduje `write` ([permissions](https://coolify.io/docs/api/permissions)), které tento CI kontrakt nepovoluje. Změna konfigurace ani rozšíření oprávnění není implementované.

**Plně automatický flow zatím není připravený k aktivaci:** operátor musí zjistit skutečnou nainstalovanou verzi a vyřešit podporované připnutí SHA se schváleným oprávněním/source mechanismem. Bez deterministického řešení v povoleném kontraktu zůstává automatizace blokovaná; rozhodnutí patří decision ownerovi v issue. Neposílejte vymyšlený `commit` parametr, API jej může ignorovat.

Připravený skript pro kontrolovaný deploy vyžaduje **před triggerem** `Application.git_commit_sha === github.sha`. `HEAD`, prázdná hodnota a jiný SHA znamenají FAIL a **žádný deploy request**. Pro první kontrolovaný release může operátor připnout schválený merge SHA v dashboardu před Environment approval; musí zmrazit source/config změny i další dashboard/webhook deploye do dokončení runu. Jde o explicitní ruční krok, **není to řešení plně automatických dalších releases**. Každý další SHA bez nového připnutí bezpečně selže. Budoucí rozšíření mechanismu/oprávnění potřebuje rozhodnutí a review.

## Coolify Application

Operátor ověří skutečnou verzi a její API/healthcheck podporu; tento dokument netvrdí, že resource již byl nakonfigurován:

- Git source `bukovskyjosef/kvazi`, branch **`main`**, konkrétní připnutý SHA podle výše uvedeného kontraktu.
- Build pack Dockerfile, base/build context **`/`**, Dockerfile **`docker/php/Dockerfile`**, exposed internal port **`80`**.
- **Native Auto Deploy OFF** (`settings.is_auto_deploy_enabled=false`), žádný další přímý push deploy webhook ani preview na produkční doméně. Řízený trigger je GitHub deploy job.
- Žádný veřejný direct port mapping PHP, source bind mount ani startup/pre/post-deployment DB command. Application má baked-in M4.5 image, DB je samostatný persistentní PG18 resource na kompatibilní interní síti.
- Readiness zapnutá: **CMD healthcheck** s přesným příkazem níže, interval 10 s, timeout 5 s, start period 10 s, retries 12. Interní GET `/healthz` na portu 80 vyžaduje HTTP200 a přesný JSON `status:ok`, používá dostupné PHP.

```sh
php /usr/local/bin/kvazi-healthcheck.php
```

Skript vyžaduje tento CMD a `running:healthy`; skutečný exit0/exit1 při DB outage ověřuje mandatory external-image acceptance. Oficiální [deployment job](https://github.com/coollabsio/coolify/blob/054c560cbdc578836ddfa95d8085761d6733e7c7/app/Jobs/ApplicationDeploymentJob.php) podporuje CMD, ale jeho safe-command grammar nepovoluje uvozovky/operátory inline `php -r`. Proto image obsahuje malý `docker/php/healthcheck.php` v `/usr/local/bin` mimo document root, allowlist contextu povoluje jen tento další packaging soubor. Příkaz vyhovuje skutečné grammar a nepřidává curl/wget ani jiný HTTP klient. To je konkrétní deployment blocker opravující packaging doplněk M4.5, ne změna business/runtime env/DB kontraktu. HTTP režim Coolify používá curl/wget. Pokud nainstalovaná verze CMD/API polí nepodporuje, reportujte blocker a ověřte podporované řešení; nevypínejte readiness.

Runtime env pouze v Coolify, ne build args:

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

Použijte přesně interní connection údaje samostatného **PostgreSQL 18** resource, nikdy lokální Compose service/veřejnou IP VPS. Nenahrazujte password placeholder dev defaultem. Persistentní PG18 storage podle M4.5; app redeploy neřídí DB lifecycle.

## Cloudflare / HTTPS

Operátor nastaví canonical `https://kvazi.cz`, `www.kvazi.cz → https://kvazi.cz`, platný origin certifikát a Cloudflare **Full (Strict)**. DNS/certifikáty/skutečné adresy patří do infra.

Pouze Cloudflare ingress smí dojít k origin Coolify proxy; firewall/origin mechanismus musí blokovat bypass. PHP nesmí být veřejně dostupné mimo proxy. `TRUSTED_PROXY_CIDRS` obsahuje úzkou skutečnou bezprostřední proxy před PHP (preferujte `/32`/`/128`), žádnou odhadnutou širokou privátní síť. Proxy předává `CF-Connecting-IP` pouze z ověřené CF ingress cesty; podstrčený header z jiné cesty nesmí získat trusted význam. CF rozsahy se spravují v infra, nejsou hardcoded v aplikaci. Podrobnosti M4 jsou v [app README](../../app/README.md#veřejné-non-mail-mvp).

Před veřejným provozem prakticky ověřte ze dvou reálných sítí odlišné throttle identity, spoof header z nedůvěryhodné cesty a blokaci origin bypassu. Source/unit test nenahrazuje production acceptance.

## První DB a forward upgrades

Po review/merge, před schválením prvního deploy jobu, operátor připraví PG18 resource a bootstrapuje **jen prázdnou produkční DB** z přesného schváleného checkoutu. Sedm souborů **01 → 07 s `ON_ERROR_STOP=1`** je v [kanonickém packaging postupu](../../app/README.md#production-image-a-samostatná-postgresql-18-db). Použijte autorizované prostředí s interním přístupem, `psql` a bezpečný pgpass/runtime secret. SQL není součást app image; workflow nesmí automaticky aplikovat init SQL.

Po bootstrapu ověřte `server_version_num / 10000 = 18`, schema `kvazi`, revision/validation/admin/morphology/catalog tabulky, čtyři runtime releases a aktivní dataset `public-1.3` v application. Před registrací `SELECT count(*) FROM kvazi.user_account` vrací **0**. Žádné default admin credentials. První ADMIN se registruje běžně; operátor povýší přesný schválený účet podle app README, potom logout/login.

Budoucí DB release: backup, review explicitního forward SQL pro skutečný stav DB, `ON_ERROR_STOP=1`, verifikace, kompatibilní app deploy. Release bez DB změny nemá migration step. Nikdy replay bootstrapu/reset volume/automatický schema downgrade/revalidace historických výsledků. PG major upgrade má samostatný dump/restore/upgrade postup.

## Potvrzení deploymentu a failure

`deploy-production.mjs` ověří source/config/pin/readiness před triggerem, pošle autentizovaný `POST /api/v1/deploy` pro jedinou Application a získá jediný matching `deployment_uuid`. [GET deployment](https://coolify.io/docs/api/endpoints/deployments/get-deployment-by-uuid) polluje pouze tento UUID; kontroluje application ID, ne-preview a přesný commit. Úspěch vyžaduje **`finished`**, nezměněný application contract, **`running:healthy`** a read-only HTTPS:

- `/healthz`: 200, přesný JSON `{"status":"ok"}`;
- `/` a `/vety.php`: HTML/200, bez redirectu;
- `/api/normative.php`: JSON/200, version i `X-Rules-Version` **`public-1.3`**.

Žádná registrace/submit/admin akce při každém release. Redirect, non200, chybný JSON/SHA/UUID/config, failure/cancel/unknown status nebo 30min timeout znamená FAIL. HTTP requests mají timeout nejvýše 15 s. Trigger se neopakuje po síťové chybě: operátor nejprve ověří případně již přijatý deployment v Coolify, aby nevznikla duplicita. HTTP200 trigger není release PASS.

## Předchozí zdravá aplikace

Uchovávejte alespoň dvě zdravé app verze/images a evidence UUID/SHA. Před otevřením produkce operátor ověří rollback konkrétní Coolify verze na test resource. Podporovaný dashboard/API application rollback zvolí **přesný poslední zdravý image/SHA**, potom readiness/read-only smoke. Nemění DB volume/schema/data. Při SQL změně posuzujte kompatibilitu individuálně, nikoli automatickým downgrade.

Po neúspěšném deployi `main = production` dočasně neplatí. Zastavte releases, ověřte skutečně běžící image/SHA a DB. Fix/revert PR do `main` vrátí kompatibilní app obsah, projde gate a deploy. Žádný automatický force-push/rewind main, `down -v`, mazání dat/obcházení immutable pravidel. Nouzový app rollback je explicitní operator krok; nasazený SHA a odchylku od main zapište do issue.

## Backup a restore

Před veřejným provozem zapněte Coolify scheduled PG backups do **externího S3-compatible storage mimo failure domain VPS** nebo vlastníkem zvoleného bezpečného cíle. Jednoduché minimum: denní backup, retention posledních 7 úspěšných denních záloh; vlastník potvrdí cíl/retention. Credentials jen Coolify secret storage. Ověřte viditelnost selhání, dostupnost objektu a přístup omezený na backup prefix. Záloha v app containeru/jediném VPS nestačí.

Obnovte **skutečnou produkční zálohu** do explicitně pojmenovaného **disposable PG18 resource/volume**, s jinými connection údaji a ověřením cíle před restore. Custom dump: `pg_restore --exit-on-error`; plain SQL: `psql -v ON_ERROR_STOP=1`. Formát zjistěte ze skutečné zálohy. Nikdy restore přes jedinou ostrou DB.

Ověřte PG18, tabulky, counts/vzorek očekávaných accounts/revision/validation/admin/catalog/releases; ideálně izolovaný app image proti restored DB s read-only pages/health. Restore app nepřipojujte na produkční doménu/mail. Evidence: backup timestamp/identifikátor bez secrets, restore cíl/verifikace, cleanup jen disposable resources. Dump je citlivý, nesmí být CI artifact/příloha issue. „Backup created“ není restore PASS.

## Jednorázová production acceptance po review

Evidence v issue, nikoli tvrzení z lokálních testů:

1. Přijatý merge main SHA, skutečný Coolify UUID/commit/status a read-only HTTPS checks.
2. PG18, explicitní bootstrap, zero default accounts, interní connection/persistent storage.
3. Kontrolovaný účet/data: registrace/login/skutečný submit/owner/ADMIN access. Jasně označte záznamy; cleanup nesmí obcházet immutable/domain pravidla.
4. HTTPS/Secure session cookie, CF/origin trust boundary a dva reální klienti s odlišnou throttle identity.
5. Restart/redeploy přesného zdravého image bez ztráty DB dat, znovu health a dohledatelný SHA.
6. Aktivní externí scheduled backup a praktický restore skutečné zálohy do disposable PG18.
7. Main protection skutečně vynucovaná; po zdravém release `develop` z přesného přijatého main.

Přípravná větev se pouze pushuje k nezávislému review, bez merge/develop/produkčního deploye/DB/DNS. CI příprava není dokončení produkčního milestone. Mail/scoring/rules/auth/DB model se nemění.
