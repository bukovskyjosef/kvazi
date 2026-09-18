# Plán zjednodušení CI/CD pro hobby provoz

> **Status tohoto dokumentu:** implementovaný migrační handoff. Kód/workflow/dokumentace jsou připravené v PR #125. Dokud neproběhne skutečný #124 cutover (GitHub ruleset + Coolify Auto Deploy ON), platí předchozí M5 `production-release.md` a aktuální stav se ověřuje v GitHub Issues.
>
> Živý backlog a rozhodnutí zůstávají v GitHub Issues. Tento dokument popisuje cílovou topologii, nastavení a cutover kroky; neudržuje stav jednotlivých úkolů.

## 1. Cílový princip

Pro Kvazi platí rozhodnutí #122: **merge do `main` = automatický produkční deploy**.

Cílový flow:

```text
lokální vývoj
    ↓
PR
    ↓
1× required CI gate
    ↓
merge do main
    ↓
Coolify GitHub App Auto Deploy
    ↓
Coolify Docker build
    ↓
Docker HEALTHCHECK
    ↓
krátký production smoke
```

Hlavní důvěra je před merge. Po merge se znovu nespouští celý integrační/release stack a GitHub neřídí produkční deployment přes custom API orchestrátor.

## 2. Bezpečnostní minimum

I po zjednodušení musí platit:

- `main` je chráněný a běžná práce jde přes PR,
- PR nelze mergnout bez required CI PASS,
- secrets nejsou v Git repozitáři,
- běžný deploy automaticky nerebootstrapuje ani neresetuje produkční DB,
- Docker image vlastní authoritative `HEALTHCHECK`,
- neúspěšný build/readiness/smoke není považován za úspěšný release,
- musí existovat jednoduchý rollback na poslední známý zdravý aplikační commit bez DB resetu/downgrade,
- Cloudflare/DNS/TLS/proxy a produkční DB runtime se kvůli CI/CD zjednodušení nemění.

## 3. GitHub — cílové nastavení

### 3.1 `main` ruleset / branch protection

Po cutoveru zachovat minimálně:

- změny do `main` přes pull request,
- required status check pro stabilní PR CI job,
- zákaz force push,
- zákaz delete `main`,
- vyřešené review threads podle repository governance,
- žádný běžný bypass ochrany `main`.

Pokud se při #121 přejmenuje required CI job, ruleset se musí přepnout atomicky tak, aby nevznikl mezistav bez required checku.

### 3.2 PR CI — implementovaný stav

Jeden required job **`CI / PR gate`** v `ci.yml`:

- **Vždy** (docs-only i aplikační PR): release integrity (`check-releases.mjs`).
- **Docs-only / low-risk** (pouze soubory v `docs/`, `*.md`, `LICENSE`, issue/PR templates): jen rychlé kontroly. Žádný Docker/PG18/Playwright.
- **Aplikační / runtime / DB / auth / Docker / workflow / test změny** (cokoliv mimo explicitně safe cesty): plný integrační stack přes `run-integration.sh`.
- **Fail-safe**: neznámá cesta → plný gate. Routing je regresně testovaný (`ci-risk.test.mjs`).

`release-gate.yml` zůstává jako reusable gate pro ruční/auditní spuštění. `Published release integrity` (`releases.yml`) běží nezávisle při každém PR.

### 3.3 Production Environment a production trigger — implementovaný stav

Po cutoveru **není GitHub `production` Environment používán jako approval gate**.

Produkční deployment spouští nativní **Coolify GitHub App Auto Deploy** pro branch `main`. GitHub Actions neposílá deploy request a nepřepisuje `git_commit_sha`.

Starý custom deploy helper (`deploy-production.mjs`) a jeho testy (`production-deploy.test.mjs`) jsou odstraněné. `production.yml` je nahrazen lehkým **`Production smoke`** workflow, který po pushi do `main` pouze ověří veřejné read-only endpointy (healthz, homepage, normative API) bez API tokenů.

Po ověřeném cutoveru lze odstranit production deployment secrets/tokeny:

- `COOLIFY_TOKEN`, `COOLIFY_READ_TOKEN`, `COOLIFY_APP_UUID`, `COOLIFY_URL` — sloužily pouze starému custom deploy helperu; nový flow je nepotřebuje.

Odstranění probíhá až po úspěšném cutoveru.

## 4. Coolify — cílové nastavení

Produkční Application zůstává napojená přes GitHub App na:

```text
repository: bukovskyjosef/kvazi
branch: main
```

Při cutoveru:

- odstranit permanentní `git_commit_sha` pin,
- zapnout **Auto Deploy**,
- ponechat GitHub App source integraci,
- nezavádět custom webhook ani vlastní deployment controller,
- zachovat build pack Dockerfile, build context `/`, Dockerfile `docker/php/Dockerfile`, interní port `80`,
- zachovat runtime env/secrets a samostatný persistentní PostgreSQL 18 resource,
- žádný DB bootstrap/reset jako součást běžného deploye.

Technická verifikace #122 potvrdila, že Coolify GitHub App Auto Deploy je pro tento model podporovaný mechanismus.

## 5. Health a production smoke

Authoritative readiness zůstává v Docker image:

```dockerfile
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=12 CMD ["php", "/usr/local/bin/kvazi-healthcheck.php"]
```

Produkční smoke je krátký a read-only. Minimálně:

```text
GET https://kvazi.cz/healthz
GET https://kvazi.cz/
GET https://kvazi.cz/api/normative.php
```

Požadavky:

- `/healthz` → 200 + očekávaný bezpečný JSON,
- homepage → 200 bez neočekávaného redirectu,
- normative API → 200 + očekávaná aktivní rules verze,
- smoke nesmí vytvářet/mazat produkční uživatelská data.

Post-deploy smoke je implementovaný jako `app/tools/production-smoke.mjs` — jednoduchý bounded polling veřejných endpointů bez API tokenů. Lze spustit i ručně: `node app/tools/production-smoke.mjs`.

## 6. Co je odstraněno v PR #125 a co čeká na cutover

Odstraněno v implementačním PR:

- duplicitní plný post-merge production gate → nahrazen lehkým `Production smoke`,
- custom production deploy helper `deploy-production.mjs` a jeho testy `production-deploy.test.mjs`,
- SHA pin requirement v deploy workflow.

Čeká na #124 cutover (živé nastavení):

- GitHub Environment approval, production secrets/tokeny,
- Coolify: odstranění SHA pinu, zapnutí Auto Deploy,
- GitHub: přepnutí required checku na `CI / PR gate`,
- přechodné M5 instrukce v dokumentaci.

Zachováno se samostatnou hodnotou mimo starý deploy mechanismus:

- `deployment.acceptance.mjs` — packaging gate (Docker image, healthcheck, PG18),
- `release-gate.yml` — reusable full gate pro audit/ruční spuštění,
- `releases.yml` — immutable release integrity.

## 7. Cutover pořadí

1. Znát poslední známý zdravý production SHA jako rollback point.
2. Implementovat #121 a #123 běžným PR, který ještě projde současným ověřeným gate.
3. Aktualizovat verzované workflow a operations dokumentaci na nový model.
4. Upravit GitHub ruleset/required check podle finálního PR CI.
5. V Coolify odstranit SHA pin a zapnout GitHub App Auto Deploy pro `main`.
6. Aktivovat nový flow merge do `main`.
7. Ověřit automatický Coolify deployment, Docker healthy a minimální smoke.
8. Ověřit ještě jednu běžnou změnu nebo jiný bezpečný důkaz, že starý production flow už není potřeba.
9. Teprve potom odstranit obsolete workflow/helpery/secrets/tokeny a přepsat `production-release.md` na nový skutečný stav.

Tento seznam je provozní pořadí, nikoli backlog ani evidence dokončení. Stav práce se zjišťuje z GitHub Issues.

## 8. Rollback

Před cutoverem zaznamenat poslední známý zdravý app SHA.

Pokud nový flow selže:

- vrátit workflow/settings standardním repository postupem,
- v Coolify znovu nasadit poslední známý zdravý aplikační commit podporovaným mechanismem,
- produkční DB neresetovat ani nedowngradovat jen kvůli aplikačnímu rollbacku,
- případné explicitní DB změny mají vlastní forward/rollback kontrakt.

## 9. Co se nemění

Tato optimalizace sama o sobě nemění:

- Cloudflare DNS/proxy/TLS,
- origin ingress omezení,
- runtime `TRUSTED_PROXY_CIDRS`,
- PostgreSQL 18 resource a persistence,
- DB backup/restore požadavky,
- soutěžní pravidla,
- normativní rules release,
- aplikační auth/business logiku.

## 10. Autorita

Aktuální provozní kontrakt zůstává v `production-release.md` do skutečného cutoveru. Tento dokument je přípravný technický handoff.

Živý backlog a rozhodnutí jsou v GitHub Issues. Rozhodnutí #122 o Auto Deploy je finální a tento dokument jej nepředkládá jako otevřenou variantu.