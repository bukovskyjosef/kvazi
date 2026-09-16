# Exact-match katalog a interní morfologické review služby

> **Status:** technický kontrakt služeb M2 podle #6/#102. Soutěžní identitu určuje `../rules/02-rozhodcovska-specifikace.md` a normativní moduly kvazitaháku; persistence je v `02-database-model.md`, hráčský UX v `05-konfigurator-ux.md`.

## Kanonický klíč

`app/public/includes/exact-key.php` sestavuje klíč serverově. Surface a lexikální texty se převedou na NFC lowercase; diakritika a Q/KV zůstávají rozlišené. Prázdné hodnoty, whitespace v lexikálním zápisu, neúplná povinná pole, neplatné enumy/modely a nekonzistentní identita či odvození jsou odmítnuté před lookupem. Linguistickou shodu konkrétního surface s paradigmatem nadále rozhoduje existující deterministický validátor; katalogové API nevrací očekávaný tvar ani alternativu.

Server explicitně vybírá tato pole:

| POS | `identity_json` | `form_json` |
|---|---|---|
| substantivum | pos, lemma, model, rod, životnost pouze pro relevantní model | pád, číslo |
| adjektivum | pos, základní lemma, model | rod/životnost, pád, číslo, stupeň pouze u stupňovatelného modelu |
| sloveso | pos, infinitiv, časovací typ | druh tvaru, vid; present: osoba a číslo; imperative: osoba 2sg/1pl/2pl; lParticiple: rod a číslo, životnost pouze u mužského plurálu |
| zájmeno | pos, zájmenné lemma, bez produktivního modelu | explicitní pád, číslo, rod, osoba včetně `notApplicable` |

Přivlastňovací adjektivum vyžaduje platné zdrojové lemma/model, správný rod zdroje a odpovídající derivační lemma. Zdrojové údaje se ověří, ale nevytvářejí další soutěžní identitu: její normativní definice zůstává lemma + adjektivní model. Nestupňovatelnému modelu se nevynucuje pole stupně. Neužité/stale morfologické hodnoty (např. číslo dříve zvoleného present při imperative) nejsou součástí klíče.

Zájmenná signature je uložena v `token.form.pronoun = {case, number, gender, person}`. Všechna čtyři pole jsou povinná; chybění nebo prázdný string nejsou `notApplicable`. Pád: 1–7; číslo: singular/plural; rod: masculineAnimate/masculineInanimate/feminine/neuter; osoba: 1–3; každé pole navíc dovoluje explicitní `notApplicable`. Server vlastnosti nedovozuje z lemmatu. Zájmeno má pouze lexicalStatus=real. Oddělený objekt nekoliduje s existing closed enumy produktivních form fields a nemění jejich validátor.

Syntaxe, token ID, obhajoby, zdroje, valence, lexicalStatus, klientské prefix flagy/score ani libovolná další klientská pole nejsou součástí exact identity. LexicalStatus se kontroluje pro úplnost deklarace, ale neumožňuje duplikovat stejnou identitu přepnutím real/quasi. Vid slovesa patří ke konkrétnímu posuzovanému použití, nikoli do soutěžní identity.

JSON objekty se sestavují v pevném pořadí; PostgreSQL JSONB equality/uniqueness zaručuje nezávislost match na původním pořadí klientských keys. Katalogový klíč je identity + form + surface; interní review navíc rules_version konkrétního uloženého validation_result.

Jednopísmenné funkční tokeny a uzavřené pomocné být mají normativní výjimku bez katalogového/review klíče. Prefix se odvozuje ze surface. Review zachovává úplné prefixované lemma a příznak normativní odvozeniny; katalog u prefixovaného substantiva ověřuje jen kompletní neprefixovaný základ se stejným modelem/form. Řetězení prefixu se odmítá.

## Endpointy a autorizace

Všechny endpointy jsou JSON POST se session, CSRF a `Cache-Control: no-store`. ID jsou kladná JSON integers, tokenId je neprázdný string. Nepodporovaná top-level pole se odmítají. ADMIN role se kontroluje z DB security helperem M1 a DB trigger ji znovu vynucuje při zápisu.

| Endpoint | Vstup kromě csrf | Výstup / účel |
|---|---|---|
| `/api/real-word-catalog.php` | kompletní `token` | pouze `{ok:true, exactMatch:boolean}` pro přihlášeného hráče |
| `/api/admin/real-word-catalog.php` | revisionId, validationResultId, tokenId, isApproved, nepovinné reason/source | server rekonstruuje klíč z immutable podání a transakčně potvrdí/změní přesnou položku; `{ok:true}` |
| `/api/admin/morphology-review.php` | revisionId, validationResultId, tokenId; při rozhodnutí verdict, expectedDecisionNo, nepovinný reason | interní lookup/binding nebo append-only APPROVED/REJECTED rozhodnutí |
| `/api/admin/review-status.php` | revisionId, validationResultId | interní tokenové review stavy a reusable review preconditions |

Morfologické API bez verdict provede interní lookup a zapíše stabilní vazbu, pokud skutečně použije rozhodnutí. Při rozhodnutí je očekávané pořadí povinné: 0 pro UNKNOWN, N pro opravu rozhodnutí N. REJECTED vyžaduje důvod obsahující neprázdný text; APPROVED jej vyžadovat nemusí. Klient nemůže určit identity/form/surface/rules version schvalovaného případu ani admina.

401 znamená nepřihlášeného, 403 neplatnou roli/CSRF, 404 chybějící nebo nesouvisející revision/result/token, 422 neúplný/neplatný request, 409 zastaralé očekávané rozhodnutí či transakční souběh, 503 nedostupnou DB/release službu. Hráč nemá cestu k lookupu morfologické cache.

## Cache, transakce a stabilní evidence

`KvaziMorphologyReview` používá pouze morphology_review_case, morphology_review_decision a validation_result_review. Načítá immutable runtime release zapsaného result; manifest, hash, dataset identity a registrovaná rules/validator identity musejí souhlasit. Aktuální active release není náhradou za historická pravidla výsledku; obecný registry historických enginů se nezavádí.

UNKNOWN je absence použitelného rozhodnutí. Nejvyšší decision_no přesného case určuje aktuální lookup pro nové použití. Case se zamkne v transakci, očekávané pořadí se porovná se skutečným a nové rozhodnutí se připojí jako N+1. Unique constraint a monotónní DB trigger z M1 zůstávají autoritou. Zastaralý konkurent dostane 409; historie se nikdy UPDATE-ne ani nemaže.

Jakmile review použije APPROVED/REJECTED, reference result + token → konkrétní decision ID se INSERT-ne jednou. Vazba se zamyká v pořadí case, pak result; precondition více tokenů nejprve zamkne všechny nalezené cases v pořadí jejich ID. Případ vytvořený souběžně až po zjištění absence zůstane pro tento lookup bezpečně UNKNOWN a další refresh již použije nové rozhodnutí. Konfliktní již existující vazba se nikdy nepřepisuje. Pozdější correction mění budoucí lookup, ale ponechává historické usedDecisionId.

Interní odpověď rozlišuje `status/decisionNo/decision` aktuálního case a `usedStatus/usedDecisionId` stabilně použitého rozhodnutí revize. Starší revize proto může mít current REJECTED a used APPROVED. Reusable `preconditions()` vyhodnocuje skutečně použité reference: hasUnknown, hasRejected, allApproved. M3 při finálním approve samostatně zkontroluje i deterministický validation_result a další sentence preconditions; tento helper sám větu neschvaluje.

Katalog má vlastní službu `kvazi_catalog_match()` / `kvazi_catalog_decide()` a vlastní tabulku bez rules scope. Jen is_approved=true potvrzuje exact match. Nepotvrzená položka a absence mají stejnou veřejnou odpověď. Lookup ani správa katalogu nečtou/zapisují morphology_review_decision a nemění immutable validation_result. Nenalezení nikdy nemění submitReady.

## Ověření a hranice

`exact-key.test.mjs` ověřuje whitelist, NFC/case, relevantní fields a úplnost včetně zájmen/prefixu. `review.integration.test.mjs` ověřuje skutečné HTTP/DB služby, oddělení domén, historii vazeb, first-decision i correction souběh, ADMIN/CSRF a nezměněný valid submit po not found. Synthetic exact-key fixtures mají is_valid=false a nepředstavují jazykové schválení. Browser `catalog.browser.mjs` ověřuje skutečný katalogový match, invalidaci všech druhů key změn, opožděnou odpověď a not-found submit; je součástí mandatory runneru.

M2 nepřidává tabulky, migrace, runtime rules release, změnu deterministického validátoru, admin detail/queue HTML, finální sentence rozhodovací workflow ani veřejné katalogové procházení.
