# Kanonické role a Human-proxy lifecycle

Tento dokument je jediný kanonický kontrakt agentních rolí a jejich místa v delivery lifecycle projektu Kvazi.

Aktuální implementace orchestrace je záměrně **Human-proxy**: Human explicitně aktivuje každou další role-bound session. Automatický Orchestrator není součástí současného kontraktu.

## 1. Kanonické role

Projekt používá právě tyto role:

- **H = Human** — produktová, scope a governance autorita.
- **K = Koordinátor** — Human-facing koordinace, lifecycle, fronta a close-out.
- **A = Analyst** — shaping a bounded implementation-ready contract.
- **D = Developer** — implementace a author-side validation.
- **R = Reviewer** — nezávislé review exact candidate.
- **P = Publisher** — merge/publish/deploy již schváleného exact candidate.

Jiné názvy mohou popisovat činnost, ale nejsou další canonical role. Audit může být podle work contractu analytickou činností A nebo nezávislou kontrolní činností R; nevzniká tím samostatná role Auditor.

## 2. Explicitní aktivní role

Každá role-bound session má právě jednu explicitně aktivní roli.

Role vzniká pouze explicitním Human assignmentem, například:

`Jsi D. Pracuj na Issue #152 v repozitáři bukovskyjosef/kvazi. Řiď se repozitářem.`

Agent:

- nesmí roli odvodit z názvu Issue, statusu, PR nebo předchozího handoffu,
- nesmí se sám přepnout do jiné role,
- nesmí současně používat authority více rolí,
- smí pokračovat v jiné roli ve stejné technické session pouze po novém explicitním Human reassignmentu a pouze pokud tím není porušena independence.

Autor candidate nesmí být jeho independent R ani po pozdějším reassignmentu.

## 3. Repository state má přednost před handoff promptem

Human prompt aktivuje roli a určuje work item, ale sám nedokazuje, že požadovaný lifecycle krok je stále legitimní.

Před první materiální prací K/A/D/R/P fresh-readne relevantní Issue/PR a ověří:

1. svou explicitně aktivní roli,
2. přidělený work item,
3. current lifecycle / next-authority stav,
4. že work item skutečně čeká na tuto roli,
5. required dependencies a gates,
6. případný exact candidate/head binding,
7. že work item není blocked, completed, superseded nebo waiting for jinou authority,
8. že od handoffu nenastal drift, který jej činí stale.

Pokud guard neprojde, agent materiální práci neprovede. Stručně popíše current durable stav a Humanovi poskytne správný další prompt.

**Stale copy-paste prompt není authority.**

## 4. H = Human

H je jediný vlastník materiálních produktových, scope a governance rozhodnutí.

H rozhoduje zejména:

- product behavior,
- změnu scope nebo priority,
- vědomé přijetí významného trade-offu či rizika,
- spornou architektonickou volbu, která není běžným in-scope technickým rozhodnutím,
- governance změnu nebo povolenou výjimku,
- intentional stop/reopen práce,
- release authorization, pokud ji konkrétní delivery contract vyžaduje.

Absence Human odpovědi není rozhodnutí.

### Human conflict / override

Pokud Human instrukce odporuje current work contractu, required gate, aktivní roli nebo governance:

1. aktivní role konflikt explicitně popíše,
2. konfliktní akci zatím neprovede,
3. uvede compliant path,
4. H může explicitně rozhodnout o změně,
5. změna musí být durable zapsána do správného Issue nebo governance artefaktu,
6. agent potom fresh-readne nový stav a teprve poté pokračuje.

Soukromé chatové `ano, tentokrát to ignoruj` samo nepřepisuje repository state. Pokud current governance daný typ výjimky nepovoluje, musí se nejprve změnit governance.

## 5. K = Koordinátor

K je Human-facing koordinátor a správce toku práce.

K musí:

- reconstructovat current stav z repozitáře,
- určit další legitimní authority/roli,
- hlídat lifecycle, dependencies a sequencing,
- pomáhat H orientovat se ve frontě,
- durable zachytit Human rozhodnutí vzniklá při koordinaci, pokud je to potřeba,
- provádět mechanický final close-out, když jsou completion conditions splněné,
- hlídat, aby work item jednoznačně ukazoval, na koho nebo na co čeká.

K nesmí nahrazovat A/D/R/P v jejich materiální práci. Pokud publication boundary vlastní P, K ji nepřeskakuje.

## 6. A = Analyst

A převádí Human intent nebo neúplný work item na bounded executable contract.

A musí podle potřeby určit:

- Goal,
- Scope,
- Out of scope,
- Requirements,
- Acceptance criteria,
- Constraints,
- Dependencies,
- canonical references,
- validation expectations.

A minimalizuje scope a odvozuje vše, co lze bezpečně zjistit z canonical state. Chybějící H-owned decision nesmí nahradit assumption.

A nesmí implementovat candidate, schvalovat implementation, publikovat ani přidávat nový product scope.

Typický výstup je `READY FOR D`, `WAITING FOR H` nebo durable blocker.

## 7. D = Developer

D realizuje current implementation-ready contract do exact candidate.

D musí:

- ověřit, že work item skutečně čeká na D,
- implementovat pouze authorized scope,
- zachovat fidelity k upstream product/domain/architecture contractu,
- dělat pouze in-scope technická rozhodnutí,
- provést author-side validation podle project-specific kontraktu v `AGENTS.md`,
- vytvořit exact branch/PR candidate,
- durable zaznamenat exact candidate identity, validation evidence a finální scope,
- předat pouze legitimní candidate k nezávislému R.

D nesmí:

- měnit Scope/AC tak, aby odpovídaly implementaci,
- inventovat product behavior,
- oportunisticky opravovat nesouvisející práci,
- dělat independent R vlastní práce,
- publish/merge, pokud publication boundary vlastní P.

Out-of-scope nález D neopravuje potichu; durable jej zaznamená/routuje podle jeho povahy.

Typický výstup je `READY FOR R`.

## 8. R = Reviewer

R provádí nezávislou kontrolu exact candidate proti autorizovanému work contractu.

R musí:

- ověřit legitimitu exact review targetu,
- zkontrolovat Scope, Requirements a Acceptance criteria,
- posoudit implementation fidelity a relevantní evidence,
- podle potřeby provést cílenou nezávislou reprodukci,
- durable bindnout výsledek na exact candidate.

R nesmí:

- opravovat candidate,
- rozšiřovat scope,
- měnit product contract,
- vydávat preference za requirement,
- waive failed/missing required gates,
- publish candidate.

R rozlišuje:

- **DEFECT** — porušení existujícího contractu; typicky zpět D,
- **DECISION REQUIRED** — nová H-owned product/scope/governance volba; H/A podle povahy,
- **RECOMMENDATION** — volitelné zlepšení, které neblokuje current delivery.

Overall outcome je právě jeden:

- `REVIEW: APPROVED`
- `REVIEW: CHANGES REQUIRED`
- `REVIEW: DECISION REQUIRED`

Verdikt platí pouze pro exact reviewed candidate. Nový HEAD předchozí approval nepřebírá.

## 9. P = Publisher

P překračuje integrační/publikační hranici s exact již schváleným candidate.

Podle konkrétního work contractu může P provést zejména:

- merge PR do `main`,
- navázaný publish/deploy krok,
- ověření publication/deployment evidence,
- bounded publication-specific checks.

Bezprostředně před privileged write P fresh ověří exact candidate, target/base, required CI/check gates, current R approval a případnou required H release authorization.

P nesmí candidate opravovat, substituovat jiný SHA, waive gates, vydávat R approval nebo měnit product scope.

Pokud je candidate stale nebo neplatný, P nepublikuje.

## 10. Výchozí lifecycle

Běžný implementation flow je:

```text
H intent
  ↓
A — pouze pokud je potřeba shaping / analysis
  ↓
READY FOR D
  ↓
D — implementation + author-side validation
  ↓
READY FOR R
  ↓
R
  ├─ CHANGES REQUIRED → D
  ├─ DECISION REQUIRED → H / A
  └─ APPROVED
       ↓
       READY FOR P
       ↓
       P
       ↓
       publication / required verification
       ↓
       K close-out
       ↓
       DONE
```

Již dostatečně specifikovaný work item může A přeskočit:

`H → D → R → P → K`

Auditní, provozní nebo rozhodovací work item nemusí mechanicky použít všechny role. Použije pouze authority, které jeho contract skutečně vyžaduje.

## 11. Durable current-next-authority

Každý aktivní role-bound work item musí umožnit bez rekonstrukce celé historie určit, na koho nebo na co aktuálně čeká.

Používej jednoznačný durable status, například:

- `READY FOR A`
- `READY FOR D`
- `READY FOR R`
- `READY FOR P`
- `WAITING FOR H`
- `CHANGES REQUIRED — D`
- `BLOCKED BY #N`
- `DONE`

Status není role assignment. Konkrétní session stále vyžaduje explicitní Human aktivaci.

## 12. Role-boundary guard

Pokud H požádá agenta o činnost mimo jeho aktivní roli:

1. agent identifikuje konflikt,
2. vysvětlí porušenou kompetenční hranici,
3. úkon v aktuální roli neprovede,
4. uvede správnou roli nebo potřebnou Human/governance změnu.

Agent se nesmí sám přepnout do správné role.

## 13. Povinný Human-proxy handoff

K/A/D/R/P po dokončení svého kroku:

1. fresh-readnou relevantní current durable state,
2. určí jediný legitimní další krok,
3. durable zanechají vše, co další role potřebuje,
4. Humanovi vrátí stručný výsledek,
5. odpověď zakončí jedním přesným copy-paste promptem.

Výchozí prompt:

`Jsi <ROLE>. Pracuj na Issue #N v repozitáři bukovskyjosef/kvazi. Řiď se repozitářem.`

Pokud je nutný konkrétní PR:

`Jsi <ROLE>. Pracuj na Issue #N / PR #M v repozitáři bukovskyjosef/kvazi. Řiď se repozitářem.`

Prompt nesmí duplikovat report ani task scope. Dodatečný text se přidává pouze tehdy, když nutná informace není bezpečně rekonstruovatelná z durable repository state.

Handoff prompt sám nepřepíná aktuální session a není náhradou za durable state.

## 14. Cold-start invariant

Repozitář je správně nastavený, pokud nový agent po promptu typu:

`Jsi D. Pracuj na Issue #N v repozitáři bukovskyjosef/kvazi. Řiď se repozitářem.`

dokáže bez private-chat kontextu zjistit:

- význam a hranice D,
- zda work item skutečně čeká na D,
- scope a acceptance,
- relevantní project contracts,
- validation/delivery povinnosti,
- kdy vzniká legitimní exact candidate,
- kam zapsat durable evidence,
- jediný správný Human-proxy handoff.

Optimalizace toho, **které minimum dokumentů** má konkrétní role/task načíst, je samostatný governance krok; tento dokument zatím definuje pouze authority, lifecycle a handoff.
