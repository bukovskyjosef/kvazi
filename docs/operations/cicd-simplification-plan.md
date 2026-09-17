# Plán zjednodušení CI/CD pro hobby provoz

> **Status tohoto dokumentu:** budoucí migrační handoff. Není to popis aktuálně aktivního production flow. Dokud není zjednodušený flow skutečně implementovaný a ověřený, platí `production-release.md` a aktuální stav/evidence se ověřují v GitHub Issues.
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

### 3.2 PR CI

Cílem je jeden srozumitelný required výsledek. Levné deterministic checks běží vždy. Drahé browser/DB/image acceptance lze omezit podle skutečného rizika změny pouze tehdy, pokud routing zůstane jednoduchý, testovatelný a nesníží ochranu rizikových oblastí.

Není cílem stavět obecný risk engine. Pokud by path/risk routing přinesl větší složitost než úsporu, je přijatelné ponechat plný gate pro všechny aplikační změny a optimalizovat jen jednoznačné low-risk případy, například docs-only změny.

### 3.3 Production Environment a production trigger

Po cutoveru **není GitHub `production` Environment používán jako approval gate**.

Produkční deployment spouští nativní **Coolify GitHub App Auto Deploy** pro branch `main`. GitHub Actions neposílá deploy request a nepřepisuje `git_commit_sha`.

Po ověřeném cutoveru lze odstranit production deployment secrets/tokeny, pokud je už žádný jiný workflow nepotřebuje, zejména:

- `COOLIFY_TOKEN`,
- případný `COOLIFY_READ_TOKEN`, pokud nebude zachován pro lehké post-deploy ověření,
- další hodnoty existující pouze kvůli starému custom deploy helperu.

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

Konkrétní mechanismus post-deploy smoke v #123 má zůstat co nejjednodušší. Pokud lze použít lehké bounded polling/ověření nad Coolify a veřejnými endpointy, nepřidávat nový orchestration framework.

## 6. Co se po úspěšném cutoveru odstraní

Až po prakticky ověřeném release novou cestou lze odstranit:

- duplicitní plný post-merge production gate,
- GitHub Environment approval pro běžný release,
- ruční Commit SHA pin jako release krok,
- custom production deploy helper a jeho testy, pokud nemají jinou samostatnou hodnotu,
- obsolete GitHub/Coolify API secrets a tokeny,
- přechodné M5 instrukce, které už neodpovídají skutečnému provozu.

Neodstraňovat diagnostické nebo security testy se samostatnou hodnotou mimo starý deployment mechanismus.

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