# Nastavení CI/CD po zjednodušení

> Tento dokument je checklist pro budoucí cutover. Dokud není cutover dokončený a ověřený, platí současný `production-release.md`.

## GitHub

### `main`

- změny přes pull request,
- required CI check: **`CI / PR gate`** a **`releases`**,
- force push zakázat,
- delete branch zakázat,
- zachovat review/conversation ochrany podle repository governance.

### Production deployment

Rozhodnutí #122 je finální: **merge do `main` = automatický production deploy**.

Po cutoveru:

- GitHub `production` Environment se nepoužívá jako ruční approval gate,
- GitHub Actions nespouští Coolify deployment přes custom API helper,
- GitHub Actions nepřepisuje `git_commit_sha`,
- produkční deployment spouští Coolify GitHub App Auto Deploy po pushi do `main`,
- post-deploy GitHub část, pokud zůstane, je pouze lehké ověření deploymentu/health/smoke a nesmí znovu spouštět celý release gate.

### Secrets

Do úspěšného cutoveru ponechat současné production secrets. Po ověření nové cesty odstranit pouze ty, které už nic nepoužívá.

Kandidáti na odstranění po cutoveru:

- `COOLIFY_TOKEN`, pokud slouží pouze starému deploy triggeru,
- `COOLIFY_READ_TOKEN`, pokud nebude potřeba ani pro lehké ověření,
- `COOLIFY_APP_UUID`, pokud nebude potřeba ani pro lehké ověření,
- `COOLIFY_URL`, pokud nebude potřeba ani pro lehké ověření.

Žádný secret nemažte před úspěšným novým release a kontrolou závislostí.

## Coolify

Produkční Application:

```text
source: GitHub App
repository: bukovskyjosef/kvazi
branch: main
Auto Deploy: ON
```

Při cutoveru odstranit permanentní ruční `git_commit_sha` pin. Běžný release nesmí vyžadovat editaci SHA v dashboardu.

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

Po novém deploymentu ověřit minimálně:

```text
GET https://kvazi.cz/healthz
GET https://kvazi.cz/
GET https://kvazi.cz/api/normative.php
```

Očekávání:

- `/healthz` → HTTP 200 a bezpečný `status: ok`,
- homepage → HTTP 200 bez neočekávaného redirectu,
- normative API → HTTP 200 a aktivní očekávaná rules verze.

Smoke je read-only a nesmí měnit produkční uživatelská data.

## Cutover checklist

1. Zaznamenat poslední známý zdravý production SHA.
2. Implementační PR #121/#123 nechat projít současným gate.
3. Přepnout required check z `Full release gate / Mandatory stack` na **`CI / PR gate`** (zachovat `releases`).
4. V Coolify potvrdit GitHub App source `bukovskyjosef/kvazi`, branch `main`.
5. Odstranit manual `git_commit_sha` pin.
6. Zapnout `Auto Deploy`.
7. Aktivovat nový workflow stav a provést kontrolovaný merge do `main`.
8. Ověřit, že Coolify deployment spustil GitHub App push event bez ručního triggeru.
9. Ověřit Docker `running:healthy` a minimální production smoke.
10. Ověřit další běžnou změnu / bezpečný test nového flow.
11. Teprve poté odstranit obsolete production workflow/helper/secrets/tokeny.
12. Aktualizovat `production-release.md` na nový skutečný stav.

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