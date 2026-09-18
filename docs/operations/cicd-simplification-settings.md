# Nastavení CI/CD po zjednodušení

> Tento dokument zachycuje výsledné nastavení po CI/CD cutoveru #124. Živá evidence, konkrétní SHA a provozní ověření zůstávají v GitHub Issue #124.

## GitHub

### `main`

- změny přes pull request,
- required CI check: **`PR gate`**,
- force push zakázat,
- delete branch zakázat,
- zachovat review/conversation ochrany podle repository governance.

### Production deployment

Rozhodnutí #122 je finální: **merge do `main` = automatický production deploy**.

Aktuální stav:

- GitHub `production` Environment se nepoužívá jako ruční approval gate,
- GitHub Actions nespouští Coolify deployment přes custom API helper,
- GitHub Actions nepřepisuje `git_commit_sha`,
- produkční deployment spouští Coolify GitHub App Auto Deploy po pushi do `main`,
- post-deploy GitHub část, pokud zůstane, je pouze lehké ověření deploymentu/health/smoke a nesmí znovu spouštět celý release gate.

### Secrets a Environment

Po úspěšném cutoveru byly odstraněny obsolete GitHub deployment secrets:

- `COOLIFY_TOKEN`,
- `COOLIFY_READ_TOKEN`,
- `COOLIFY_APP_UUID`,
- `COOLIFY_URL`.

Byl odstraněn i nepoužívaný GitHub Environment `production` a staré Coolify API tokeny určené pouze pro supersedovaný custom deploy helper. Nový flow používá GitHub App Auto Deploy a žádný z těchto tokenů nepotřebuje.

## Coolify

Produkční Application:

```text
source: GitHub App
repository: bukovskyjosef/kvazi
branch: main
Auto deploy: Deploy on push (webhooks)
Source commit availability: Available during build
```

Permanentní ruční `git_commit_sha` pin je odstraněný. Běžný release nevyžaduje editaci SHA v dashboardu.

Zachovat:

```text
build pack: Dockerfile
base/build context: /
Dockerfile: docker/php/Dockerfile
internal port: 80
```

Dále zachovat:

- image-owned Docker `HEALTHCHECK`,
- současné runtime env/secrets,
- samostatný persistentní PostgreSQL 18 resource,
- žádný automatický DB bootstrap/reset/pre/post deployment migration command,
- současné domény, HTTPS/proxy a ingress omezení.

## Health / smoke

Po novém deploymentu `Production smoke` workflow deterministicky ověří:

1. **Deployment identity:** `GET /api/version.php` — polluje dokud SHA odpovídá `github.sha`. Stale healthy produkce se starým SHA neuspěje.
2. **Readiness:** `GET /healthz` → HTTP 200 a bezpečný `{"status":"ok"}`.
3. **Read-only smoke:**
   - `GET https://kvazi.cz/` → HTML/200 bez neočekávaného redirectu,
   - `GET https://kvazi.cz/api/normative.php` → JSON/200 a aktivní očekávaná rules verze.

Smoke je read-only a nesmí měnit produkční uživatelská data.

## Cutover checklist

Checklist byl proveden v #124; konkrétní evidence a SHA jsou v issue.

1. Zaznamenat poslední známý zdravý production SHA.
2. Implementační PR #121/#123 nechat projít současným gate.
3. Přepnout required check na **`PR gate`** (jediný required check).
4. V Coolify potvrdit GitHub App source `bukovskyjosef/kvazi`, branch `main`.
5. Odstranit manual `git_commit_sha` pin.
6. Zapnout `Auto deploy = Deploy on push (webhooks)`.
7. V Application → Configuration → Advanced nastavit **Source commit availability = Available during build** (v dřívějším UI/docs označeno jako `Include Source Commit in Build = ON`); tím je `SOURCE_COMMIT` dostupný při Docker buildu pro `/api/version.php`.
8. Aktivovat nový workflow stav a provést kontrolovaný merge do `main`.
9. Ověřit, že Coolify deployment spustil GitHub App push event bez ručního triggeru.
10. Ověřit Docker `running:healthy` a minimální production smoke.
11. Ověřit další běžnou změnu / bezpečný test nového flow.
12. Teprve poté odstranit obsolete production workflow/helper/secrets/tokeny a nepoužívaný GitHub Environment.
13. Aktualizovat `production-release.md` na nový skutečný stav.

## Rollback

Před cutoverem musí být znám poslední zdravý production SHA. Při selhání nové cesty:

- vrátit GitHub/Coolify nastavení na poslední funkční konfiguraci,
- znovu nasadit poslední známý zdravý aplikační commit,
- produkční DB kvůli rollbacku aplikace neresetovat ani nedowngradovat.

## Neměnit v tomto workstreamu

- Cloudflare DNS/TLS/proxy,
- production DB resource/persistence,
- backup/restore kontrakt,
- application business/rules/auth logiku,
- secrets nesouvisející se starým deployment orchestratorem.