# Boundaries between rules, data and implementation

This document defines technical boundaries. It is not a game rule.

## Normative layer
Competition validity comes from the normative rule documents and explicitly normative parts of the Kvazitahák. Implementation must not change their meaning.

## Explanatory layer
`Jak hrát`, examples and explanatory text help readers understand the game. They do not create new rules.

## Technical layer
Architecture, forms, APIs, database structures, validators, authentication and admin workflows represent accepted rules. They must not settle an unresolved product or language question.

## Internal catalog
The internal catalog is an operational knowledge base below the rules. A conflict between the catalog and the rules is a catalog defect.

## User declaration
A submitted analysis is the contestant's claim. It does not by itself create authoritative linguistic truth or expand the catalog.

## Derived data
Counts, normalized text, validation results and rankings must be reproducible from source data and the relevant rules/validator provenance.

## Development gate
Implementation may proceed only where behavior is already decided or can remain genuinely parameterized. If a product question is unresolved, use the workflow in `/docs/governance/decision-workflow.md` and GitHub Issues instead of inventing a default.

`/db/schema-draft.sql` is a working design artifact, not production migration history.
