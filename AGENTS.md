# AGENTS.md

Tento soubor je **kanonický vstupní router pro všechny agenty**, kteří pracují s repozitářem. Nástrojově specifické instrukce smějí pouze odkazovat sem; nesmějí vytvářet vlastní startup, role ani authority model.

**Josef Bukovský je jediný konečný decision owner pro produktová, pravidlová a sporná architektonická rozhodnutí.**

## 1. Role-first startup

Pro materiální práci na Issue/PR musí Human explicitně aktivovat kanonickou agentní roli. Pokud role chybí nebo není kanonická, agent role-bound práci neprovádí a použije registry `docs/agent/ROLES.md` pouze k vrácení správného handoffu.

Role-bound cold start:

1. přečti tento `AGENTS.md`,
2. přečti `docs/agent/COMMON.md`,
3. přečti **pouze** detail explicitně aktivní role v `docs/agent/roles/<ROLE>.md`,
4. fresh-readni assigned GitHub Issue + current comments a relevantní/current PR, pokud existuje,
5. proveď pre-run authority guard z COMMON + aktivního role contractu,
6. pokud guard projde, použij task-specific **Canonical references**, constraints, validation expectations a affected surfaces z Issue/PR,
7. načti pouze minimum **úplného** dalšího dokumentačního a kódového kontextu potřebného pro konkrétní autorizovaný krok,
8. kontext rozšiřuj jen kvůli konkrétní unresolved dependency, authority nebo implementation/review/publication otázce.

`docs/README.md` je úplná authority mapa a fallback router, **ne univerzální pre-Issue read**. `docs/00-project-context.md` je podmíněný product context, ne povinný start každé role-bound session.

Pro read-only dotaz, který není role-bound prací na Issue/PR, načti jen zdroje relevantní k dotazu. Materiální změny, review, publication a close-out se vždy řídí aktivní rolí.

## 2. Durable state a source discipline

- GitHub Issues jsou jediný živý backlog a current work state.
- Private chat, stale handoff ani historický snapshot nepřebíjí current durable repository state.
- Permanent repository pravidla se nekopírují do Issues; work item na ně odkazuje přes Canonical references.
- Pokud task routing chybí nebo je nejednoznačný, použij `docs/README.md` jako fallback authority map.
- Konflikt autoritativních artefaktů agent neřeší kreativním výkladem; postupuje podle COMMON a current Issue/Human decision.

## 3. Kanonický role contract tree

Jedna kanonická role/lifecycle autorita je delegovaný strom:

- `docs/agent/COMMON.md` — invariants společné všem role-bound sessions,
- `docs/agent/ROLES.md` — stručný registry a lifecycle root,
- `docs/agent/roles/K.md`
- `docs/agent/roles/A.md`
- `docs/agent/roles/D.md`
- `docs/agent/roles/R.md`
- `docs/agent/roles/P.md`

Detail jiné role se při běžném cold startu nečte.

Project-specific D pre-push/delivery contract žije pouze v `roles/D.md`; R exact-SHA review contract pouze v `roles/R.md`. Jejich semantics se nesmějí obcházet ani znovu definovat v jiném startup dokumentu.

## 4. Work-item routing invariant

Work item, který je označen jako implementation/review/publish ready, musí durable poskytnout nebo přímo nalinkovat informace potřebné pro další roli. Implementation-ready Issue zejména obsahuje Goal, Scope, Out of scope, Requirements, Acceptance criteria, Constraints, Dependencies, Canonical references, validation expectations a current next authority.

Pokud required routing chybí, agent nehádá. Použije fallback authority map a podle aktivní role routing durable doplní, nebo work item zablokuje/routuje správné authority.

## 5. Completion

Role-specific exit conditions, evidence a Human-proxy handoff jsou definované v COMMON a aktivním role contractu. Issue se nezavírá jen proto, že bylo rozhodnuto; close-out nastává až po splnění applicable completion conditions.
