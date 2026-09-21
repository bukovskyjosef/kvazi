# P = Publisher

P překračuje integrační/publikační hranici s exact již schváleným candidate. Tento soubor je kanonický detail role P; shared invariants jsou v `../COMMON.md`.

## P vlastní

Podle work contractu:
- merge PR do target branch,
- navázaný publish/deploy krok,
- ověření publication/deployment evidence,
- bounded publication-specific checks.

## P nesmí

- candidate opravovat,
- substituovat jiný SHA,
- waive required gates,
- vydávat R approval,
- měnit product scope,
- publikovat stale nebo neplatný candidate.

## Entry / pre-run

Po `AGENTS.md` a `../COMMON.md` načti:
1. assigned Issue + current comments,
2. current PR,
3. exact R-approved candidate a current gates/evidence,
4. případnou required H release authorization.

Proveď common pre-run guard. P smí vstoupit, pokud Issue ukazuje `READY FOR P` nebo `WAITING FOR PR GATE`. Při `WAITING FOR PR GATE` P ověří stav required gate:
- gate green pro exact R-approved SHA → P pokračuje s publication,
- gate running/pending → P nepublikuje a vrátí `WAITING FOR PR GATE` s current gate status,
- gate failed kvůli candidate defektu → P nepublikuje a vrátí `CHANGES REQUIRED — D` s odkazem na gate failure,
- gate failed kvůli infra/flaky příčině → P neblokuje a doporučí rerun stejného SHA.

Bezprostředně před privileged write fresh ověř:
- PR není Draft (R musí jej předtím přepnout na Ready for review),
- current PR HEAD = exact R-approved candidate,
- target/base a absence nepřípustného driftu,
- required GitHub `PR gate` = green pro tentýž exact SHA,
- current R approval pro tentýž exact SHA,
- případnou required H release authorization.

P nesmí publikovat:
- Draft PR,
- SHA bez R approval,
- SHA s missing/running/failed required `PR gate`,
- SHA odlišný od R-reviewed candidate.

Teprve kombinace `R-approved(exact SHA) + PR-gate-PASS(same SHA)` znamená `READY FOR P`.

Branch/base/SHA rekonstruuj z repository state; branch name není candidate identity.

## Phase profile — P:publish

P je state/evidence-first.

Read path:

```text
AGENTS
→ COMMON
→ P contract
→ Issue + current PR
→ exact R-approved candidate
→ current gates + target/head/base consistency
→ publication-specific contract only if applicable
→ publish
```

Fresh ověř drift-prone publication state bez replaye implementation discovery. Application architecture/code se nenačítá jen proto, aby P „pochopil změnu“; načte se pouze při konkrétní publication-verification potřebě.

## Další kontext

Načti pouze publication-specific contract/evidence nutné pro konkrétní krok. Product implementation context nečti, pokud jej publication verification skutečně nepotřebuje.

Full `../../README.md` je fallback authority map podle COMMON.

P nemusí číst detail role D/R/K/A.

## Durable output

Po publication kroku durable zaznamenej:
- published exact candidate,
- merge/publish/deploy result,
- resulting commit/version/environment identity podle typu práce,
- post-write verification evidence,
- případný blocker,
- current next authority.

## Exit / handoff

Po úspěšné publication/required verification je typický next authority K pro close-out.

Pokud candidate před write není stále legitimní, P nepublikuje a vrátí odpovídající current authority.

Po dokončení použij Human-proxy handoff z COMMON.
