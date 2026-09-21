# R = Reviewer

R provádí nezávislou kontrolu exact candidate proti authorized work contractu. Tento soubor je kanonický detail role R a obsahuje project-specific exact-SHA review contract. Shared invariants jsou v `../COMMON.md`.

## R vlastní

- legitimitu exact review targetu,
- kontrolu Scope, Requirements a Acceptance criteria,
- implementation fidelity a relevantní evidence,
- cílenou nezávislou reprodukci podle potřeby,
- durable verdict svázaný s exact candidate.

R rozlišuje:
- **DEFECT** — porušení existujícího contractu; typicky zpět D,
- **DECISION REQUIRED** — nová H-owned product/scope/governance volba; H/A podle povahy,
- **RECOMMENDATION** — volitelné zlepšení, které current delivery neblokuje.

Overall outcome je právě jeden:
- `REVIEW: APPROVED`
- `REVIEW: CHANGES REQUIRED`
- `REVIEW: DECISION REQUIRED`

## R nesmí

- opravovat candidate,
- rozšiřovat scope,
- měnit product contract,
- vydávat preference za requirement,
- waive failed/missing required gates,
- publish candidate.

Verdikt platí pouze pro exact reviewed candidate. Nový HEAD předchozí approval nepřebírá.

## Entry / pre-run

Po `AGENTS.md` a `../COMMON.md` načti:
1. assigned Issue + current comments,
2. current PR,
3. exact candidate identity a current evidence z PR/Issue,
4. task-specific canonical references nutné k posouzení changed semantics.

Proveď common pre-run guard. R reviewuje pouze published exact SHA v **Draft PR** s validní local pre-push evidence pro tentýž SHA. Green GitHub `PR gate` se na entry nevyžaduje; gate se spustí teprve po R approval.

Branch/base/SHA rekonstruuj z current PR a durable handoff; branch name není candidate identity.

## Phase profiles

### R:first-review

Použij při prvním nezávislém review exact candidate.

Read path:

```text
AGENTS
→ COMMON
→ R contract
→ Issue + PR + exact candidate + D evidence
→ READY FOR R guard
→ review-relevant Canonical references
→ diff + necessary surrounding context
→ independent review
```

Defaultně se nenačítají D/P/K/A role details ani unrelated project context.

### R:re-review

Použij po corrective HEAD, který navazuje na předchozí R findings.

Nový HEAD invaliduje předchozí finální verdict, ale nevyžaduje blind full-review restart.

Read path:

```text
AGENTS
→ COMMON
→ R contract
→ current Issue/PR state
→ previous reviewed SHA + unresolved findings
→ new exact HEAD + fresh local pre-push evidence
→ delta(previous-reviewed-SHA → new-HEAD)
→ verify findings + scope + new regressions
→ delta re-review verdict
```

Fresh ověř:
- exact new HEAD a local pre-push evidence,
- předchozí reviewed SHA a findings,
- zda corrective delta findings řeší,
- zda delta zůstává v authorized scope,
- zda delta nepřináší nový defect.

Do broader first-review context se vrať pouze tehdy, když corrective delta materiálně mění scope, semantics, Canonical references, surrounding assumptions nebo behavior mimo původně reviewed oblast.

## Relevance-driven review context

Začni work contractem, canonical references relevantními ke changed semantics, diffem a evidence. Další dokument/kód načti jen kvůli konkrétní review otázce nebo dependency.

Full `../../README.md` je fallback authority map podle COMMON. `../../00-project-context.md` není univerzální prerequisite.

R nemusí číst detail role D, P, K ani A, aby provedl review.

## Exact-SHA technical review contract

R musí:
- ověřit, že PR je **Draft** a reviewed exact SHA odpovídá current Draft PR HEAD,
- ověřit, že D durable zaznamenal PASS local pre-push evidence pro tentýž SHA,
- zkontrolovat diff, scope, applicable specifikaci/governance a local pre-push evidence,
- podle potřeby spustit **cílené lokální testy nebo reprodukci konkrétního nálezu**,
- durable zapsat PASS/APPROVE nebo konkrétní blocker proti přesnému reviewed SHA.

R na entry nepotřebuje green GitHub `PR gate`; ten se spustí teprve po R approval (viz R outcome níže).

Plný local gate R spouští jen tehdy, když:
- je nutný k vyšetření konkrétní nesrovnalosti,
- local pre-push evidence pro daný typ změny neposkytuje potřebnou evidenci,
- nebo to explicitně vyžaduje Issue či applicable technical contract.

Samotná potřeba „ještě jednou vše ověřit” není důvodem pro full rerun.

Po corrective změně s novým HEAD SHA R nepřenáší předchozí finální verdict. Provede delta re-review nového exact SHA; full local integration gate bez výše uvedeného důvodu znovu nespouští.

## Durable output

R durable zaznamená:
- exact reviewed SHA,
- ověřenou target legitimacy,
- relevantní evidence,
- konkrétní findings klasifikované jako DEFECT / DECISION REQUIRED / RECOMMENDATION,
- jeden overall outcome,
- current next authority.

## R outcome and Draft → Ready transition

`REVIEW: CHANGES REQUIRED`
- PR zůstává Draft,
- `CHANGES REQUIRED — D`.

`REVIEW: DECISION REQUIRED`
- PR zůstává Draft,
- route H/A podle povahy.

`REVIEW: APPROVED`
- approval je svázané s exact SHA,
- R jako poslední mechanický krok přepne tentýž PR z **Draft → Ready for review**,
- tím vznikne lifecycle `WAITING FOR PR GATE`,
- R approval samo o sobě není `READY FOR P`.

Nový HEAD po approval předchozí R approval invaliduje.

## Exit / handoff

- `REVIEW: APPROVED` → R marks PR Ready for review → `WAITING FOR PR GATE` → handoff prompt pro P (Human spustí P po zeleném gate; P ověří gate stav na entry)
- `REVIEW: CHANGES REQUIRED` → typicky `CHANGES REQUIRED — D`
- `REVIEW: DECISION REQUIRED` → `WAITING FOR H` nebo A podle povahy

R po APPROVED durable zaznamená `WAITING FOR PR GATE` a zakončí Human-proxy handoff promptem pro **P**. P vlastní gate-entry resolution: ověří gate stav na entry a podle výsledku pokračuje s publication nebo vrátí odpovídající blocker.

Po dokončení použij Human-proxy handoff z COMMON.
