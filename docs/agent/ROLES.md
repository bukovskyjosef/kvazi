# Kanonické role a Human-proxy lifecycle

Tento dokument je stručný **registry a lifecycle root** jediného kanonického role-contract tree projektu Kvazi. Shared invariants jsou v `COMMON.md`; detail role je delegovaný do `roles/<ROLE>.md`.

Aktuální orchestrace je záměrně **Human-proxy**. Automatický Orchestrator není součástí contractu.

## Kanonické role

- **H = Human** — jediná produktová, scope a governance decision authority.
- **K = Koordinátor** — lifecycle, fronta a close-out → `roles/K.md`
- **A = Analyst** — shaping bounded executable contractu → `roles/A.md`
- **D = Developer** — implementation + author-side validation → `roles/D.md`
- **R = Reviewer** — independent exact-candidate review → `roles/R.md`
- **P = Publisher** — merge/publish/deploy schváleného exact candidate → `roles/P.md`

Projekt nepoužívá další canonical role. Audit je podle work contractu činnost A nebo nezávislá kontrolní činnost R; nevzniká tím samostatná role Auditor.

Role-bound session aktivuje pouze explicitní Human assignment. Handoff/status roli neaktivuje. Shared activation, independence, pre-run, override, relevance-driven retrieval a Human-proxy handoff invariants jsou výhradně v `COMMON.md`.

## Výchozí lifecycle

```text
H intent
  ↓
A — pokud je potřeba shaping
  ↓
READY FOR D
  ↓
D
  ↓
READY FOR R
  ↓
R
  ├─ CHANGES REQUIRED → D
  ├─ DECISION REQUIRED → H / A
  └─ APPROVED → READY FOR P
                    ↓
                    P
                    ↓
                    K close-out
                    ↓
                   DONE
```

Dostatečně specifikovaný work item může A přeskočit:

`H → D → R → P → K`

Auditní, provozní nebo rozhodovací work item používá jen authority, které jeho contract skutečně vyžaduje.

## Cold-start routing

Normální role-bound session nečte detail ostatních rolí:

`AGENTS.md → COMMON.md → roles/<ACTIVE_ROLE>.md → Issue/PR → pre-run guard → task Canonical references → minimum complete context`

Full `docs/README.md` a `docs/00-project-context.md` jsou conditional/fallback zdroje podle `COMMON.md`, nikoli univerzální startup.
