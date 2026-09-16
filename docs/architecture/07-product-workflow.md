# Produktový workflow nad immutable revisions

> **Status:** implementovaný technický kontrakt M3. Soutěžní platnost určuje normativní balík podle `../README.md`; exact keys a M2 služby jsou v `06-review-services.md`, persistence v `02-database-model.md`.

## Stránky a publikační hranice

| Cesta | Publikum | Obsah |
|---|---|---|
| `/admin/vety.php` | ADMIN | aktuální čekající revisions s výsledkem, nejstarší první, exact detail link |
| `/admin/veta.php?revisionId=N` | ADMIN | immutable deklarace, autoritativní výsledek, morfologické a lexikální review, sentence decision |
| `/moje-vety.php` | přihlášený owner | všechny vlastní revisions, latest stav a exact detail links |
| `/moje-veta.php?revisionId=N` | pouze skutečný owner | vlastní deklarace, skóre, stav, celý plain-text return/reject reason, historie |
| `/konfigurator.php?sentenceId=N` | pouze owner latest returned revision | přesný preload uloženého draftu; nový submit vytvoří revision N+1 |
| `/vety.php` | veřejnost | pouze jednotlivé approved revisions, word score DESC, char score DESC, stabilní ID pořadí při shodě |
| `/veta.php?revisionId=N` | veřejnost | pouze konkrétní approved revision, explicitní #73 jazykový subset |

Anonymous admin/owner URL vede na login; USER admin stránka vrací 403. ADMIN nemá owner bypass pro cizí sentence. Missing i neveřejný public detail vrací stejný 404. Public výstup neobsahuje evidence, valency, admin reason/identity, e-mail, review binding, katalogová metadata ani interní validation JSON. Pole se vybírají explicitně serverem; CSS není privacy hranice.

Public seznam má aktuální žebříček pouze pro active rules version a samostatné historické sekce podle `rules/04-verzovani-a-sprava.md`. Detail jasně uvádí původní rules version. Shoda obou skóre v jedné verzi znamená společný rekord; stabilní ID řazení není soutěžní tie-break. Žádná demo schválení ani míchání skóre různých verzí do jednoho rekordu.

## Autoritativní submit kontext

`kvazi_submission()` vyžaduje právě jeden validation result této revision a shodu s její submit rules version. Není aktivní automatická revalidace. Více výsledků nebo nesoulad vyvolá 409 a bezpečně blokuje review/decision; žádné MAX(result.id) ani latest-result heuristiky. M2 runtime loader načítá immutable dataset konkrétního recorded resultu, včetně historických public-1.1/public-1.2. Chybějící historická pronoun signature se zobrazí jako bezpečná nekompletní deklarace: approval blokován, return/reject fungují, draft se nemigruje.

## GET a explicitní review

Queue i admin detail načítají data v PostgreSQL REPEATABLE READ READ ONLY transakci. `KvaziMorphologyReview::peek()` pouze čte exact case, latest decision a případnou stabilní binding. GET nikdy nevytváří case, decision ani `validation_result_review`.

Explicitní UI POST používá existující `/api/admin/morphology-review.php` a `/api/admin/real-word-catalog.php`. Klient posílá revision/result/token IDs, verdict nebo isApproved, případně reason/source a expectedDecisionNo. Server sestavuje canonical key z immutable revision. UNKNOWN lze rozhodnout přímo v detailu; známé morphology cases zobrazují current metadata a usedDecisionId/usedStatus. Katalog interně rozlišuje ABSENT, true, false; public hráčský endpoint nadále vrací jen exactMatch boolean.

## Sentence decision

`POST /api/admin/sentence-decision.php`: JSON `{csrf, revisionId, validationResultId, action, reason?}`. Server-side DB ADMIN gate, CSRF, strict allowlist a integer IDs používají M1/M2 helpers. Podporované akce jsou pouze approve/return/reject; return/reject vyžadují plain-text důvod s alespoň jedním neprázdným znakem. Nepodporovaná pole/akce a preconditions vrací 422, neexistující kontext 404, již rozhodnutá/neaktuální revision 409.

Jedna transakce zamkne sentence a exact revision, znovu načte její stav a autoritativní result, ověří latest pending a jediný decision invariant. `approve` navíc vyžaduje:

1. recorded `validation_result.is_valid=true`,
2. M2 `preconditions().allApproved` podle stabilně skutečně použitých rozhodnutí; známé dosud nenavázané případy naváže v této explicitní cestě,
3. každý exact lexikální případ explicitně posouzený a v souladu s deklarací: real/pronoun/prefixovaný reálný základ → true; quasi → false; absence vždy blokuje,
4. funkční jednopísmenné tokeny a uzavřené pomocné být s M2 key=null jsou výjimky.

Morfologické case locks jsou v ID pořadí před result lock podle M2. Existující katalogové řádky se po morphology checku zamykají FOR SHARE ve stabilním ID pořadí a znovu kontrolují; souběžná lexikální korekce nezmění ověřený stav před commit. Teprve potom se INSERT-ne administrative_decision. Neúspěšný approve rollbackne i nově vytvořené bindings. Již navázaná historická rozhodnutí se korekcí nepřepínají.

Return/reject nepřepisují draft/result a nepotřebují vyřešené morphology/catalog keys. Dva souběžné sentence decisions skončí jedním úspěchem a jedním 409; DB unique invariant je další ochrana. Ani admin stránka, ani endpoint nenabízí editaci immutable podání.

## Owner lifecycle a navigace

Pouze latest returned revision nabízí edit/resubmit CTA. Server preload odmítá pending/approved/rejected a cizí owner kontext; submit znovu kontroluje return pod sentence lock. Historická revision a reason zůstávají immutable. Po return→resubmit→approve je veřejná jen nová schválená revision.

Sdílená navigace má přímé odkazy podle anonymous/USER/ADMIN stavu; persisted ADMIN role se znovu ověřuje. Logout zůstává POST+CSRF. Přímé odkazy se zalamují na úzkém viewportu bez nového menu frameworku. Konfigurátor obsahuje viditelný informační mailto fallback `veta@kvazi.cz`, bez dalšího DB/API/mail workflow.

## Release a ověření

Pronoun completeness podle #109 čte FE/PHP společný versioned `pronoun_form_signature` z nového public-1.3 / validator 1.3.0. Chybění, null a prázdný string nejsou explicitní notApplicable. Historické runtime soubory zůstávají byte-for-byte immutable. `07-m3-release.sql` registruje release bez schema změny a bez revalidace historie.

Povinný `bash app/tests/run-integration.sh` zahrnuje pronoun unit/parity, M2 exact/review/catalog, M3 HTTP/DB workflow, PHP syntax a skutečné UI Playwright workflow na desktop/mobile. Samostatné finální release acceptance a souhrnný security sweep nejsou součástí těchto produktových služeb.
