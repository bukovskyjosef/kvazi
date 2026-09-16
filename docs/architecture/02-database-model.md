# Databázový model

> **Status:** minimální autoritativní persistence MVP podle rozhodnutí #8/#9/#97. Tento dokument je technický; soutěžní platnost určuje normativní balík. Návrhový checklist je `../../db/schema-draft.sql`, executable bootstrap a upgrade jsou v `../../docker/db/init/`.

## Účel

DB dokládá hráčský vstup, autoritativní serverový verdict a skóre, rules/validator version, použitá interní review rozhodnutí a admin rozhodnutí nad konkrétní revizí. Neukládá AI/fair-play informace, generický audit log, snapshoty celé DB ani obecný provenance graf.

## Rules release

`rules_release` uchovává `version`, SHA-256 runtime datasetu, `validator_version`, čas vydání a popis. Řádky se nemění ani nemažou. Runtime je v `app/data/rules/<version>/normative.json` a `manifest.json`; explicitní active release je `app/data/active-release.json`. FE i PHP používají stejná integrity-checkovaná data. Submit ověří jejich shodu s registrovaným DB releasem.

Změna schopná změnit verdict vytváří nový release. Historické výsledky zůstávají u původních verzí; vydání release nespouští automatickou revalidaci. Manifest všech Markdown dokumentů ani registry historických enginů nejsou požadované.

## Účty a vlastnictví

`user_account` je jediná identita pro role `USER` a `ADMIN`. Má stabilní ID, unikátní username, neveřejný e-mail a bezpečný password hash. Unikátnost e-mailu se kontroluje i DB indexem nad `lower(btrim(email))`; aplikace ukládá lowercase trimmed adresu. Veřejná registrace vždy vytváří `USER`.

Účet může reprezentovat jednotlivce i kolektiv; samostatní spoluautoři se neevidují. Session je PHP session s bezpečnými cookie atributy a explicitní životností. `login_throttle` uchovává pouze krátkodobé IP čítače, nikoli auditní historii. Mailové tokeny se zavádějí až v #104/#105 po #106.

## Věta a immutable submit

`sentence` je stabilní kontejner s právě jedním neměnným `user_id` a časem vytvoření. Není nositelem měnitelného finálního verdictu. Pracovní draft je klientský stav.

`sentence_revision` uchovává `sentence_id`, `revision_no`, `submitted_by`, rules version při submitu, čas a immutable `draft_json`. JSON je přesný hráčský vstup včetně pořadí a ID tokenů, povrchů, typu věty, morfologie, syntaxe, obhajoby a zdrojů. Klientské odvozeniny v něm nejsou autoritou.

Nepoužité paradigma se ručně neukládá. Každý pomocný token `být` zůstává samostatným zapsaným tokenem i slovem pro skóre, ale patří do stejného přísudku. Tokenové syntaktické reference jsou validátorem omezené na tuto revizi.

DB trigger kontroluje ownera a další monotónní číslo revize pod zámkem sentence. Unikátní `(sentence_id, revision_no)` brání duplicitám. Resubmit zamyká stejný kontejner a vyžaduje `return` nad poslední revizí. Původní revize ani výsledky se nepřepisují; direct UPDATE/DELETE historie DB odmítá, včetně mazání přes parent cascade.

## Autoritativní výsledek

`validation_result` uchovává konkrétní revision a sentence, `rules_version`, `validator_version`, `is_valid`, `word_score`, `char_score`, serverový `result_json` a čas. Composite FK zaručují správnou sentence/revision i shodu validátoru s immutable releasem. Skóre je nezáporné a patří výsledku dané verze.

`result_json` je serverová diagnostika včetně kanonického textu. Není druhým kompletním stromem hráčské deklarace. NFC, normativní POS/prefix inference a další serverové odvozeniny jsou reprodukovatelné z immutable vstupu a versioned validátoru. Podstrčené klientské score, prefix, POS a rules version se nikdy nečtou jako autorita.

Pět znaků normativně validního substantivního prefixu `kvazi-` je jediná sekundární skórová výjimka. Prefixované substantivum zůstává jedním slovem a základ musí být platný i na stejném místě bez prefixu. Neověřený stringový prefix sám skórovou výjimku nevytváří.

Výsledky jsou immutable. Unikátní `(revision_id, rules_version)` ponechává možnost budoucího explicitního posouzení podle jiné verze, ale neimplementuje automatický lifecycle revalidace.

## Administrativní rozhodnutí

`administrative_decision` obsahuje sentence, revision, admina, `approve/return/reject`, důvod a čas. Composite FK odmítá revizi jiné sentence. Jedna revize má nejvýše jedno standardní finální rozhodnutí; rozhodnutá revize má právě jedno. Záznam se nepřepisuje ani nemaže. DB ověřuje roli rozhodujícího admina při zápisu; endpoint musí navíc autorizovat skutečně přihlášeného uživatele a ověřit CSRF.

UI/API admin rozhodnutí patří dalším taskům. Persistence nevytváří univerzální workflow engine.

## Interní morfologická review cache

Oddělená interní doména pro #6:

- `morphology_review_case`: exact key = rules version + kanonická úplná `identity_json` + konkrétní morfologie `form_json` + NFC lowercase `surface_form`.
- `morphology_review_decision`: stabilní ID, case/rules version, monotónní `decision_no`, `APPROVED/REJECTED`, důvod, admin a čas. `REJECTED` vyžaduje důvod. Oprava přidává další rozhodnutí; historii nepřepisuje. Pro budoucí exact lookup se použije nejvyšší `decision_no` daného case.
- `validation_result_review`: explicitní stabilní vazba validation result + token ID → skutečně použité review decision. Composite FK brání propojení různých rules verzí. Jednou připojená reference se nemění ani nemaže.

`UNKNOWN` znamená absenci rozhodnutí. Nová rules version nepřebírá staré znalosti. V M1 je připravena persistence; lookup, rozhodování a preconditions admin schválení se implementují v #6/#99/#100. Při zapojení těchto zápisů server ověří úplnost exact klíče a shodu s konkrétním tokenem immutable revize. Cache nikdy neposkytuje hráčský membership endpoint.

## Katalog skutečných slov

`real_word_catalog` je samostatná provozní lexikální autorita pro #102. Exact key je úplná kanonická `identity_json` + `form_json` + NFC lowercase `surface_form`; není rules-version scoped. Uchovává lexikální schválení, zdroj/důvod, rozhodujícího admina a čas poslední změny. Není morfologickou review cache.

M1 připravuje jen persistence. #102 doplní serverovou kontrolu úplnosti klíče a pouze potvrzení schváleného exact match vlastního kompletního návrhu. Žádný browse, autocomplete, prefix/fuzzy hledání ani alternativy. Nepotvrzený match není automatické zamítnutí. Pomocná sada `být` a jednopísmenné funkční tokeny jsou normativní výjimky mimo katalog; u prefixu katalog případně potvrzuje základ.

## Bootstrap a upgrade

Čistá DB se vytváří přímo v cílovém stavu z `docker/db/init/01–06`. Existující DB aplikuje nová `05-m1-release.sql` a atomické `06-m1-core.sql`; staré release a výsledky zůstávají zachovány. Upgrade odstraní obsolete compliance/audit tabulky. Pokud legacy data odporují novým constraintům, upgrade selže a nevybírá za vlastníka historický verdict. Nepoužívat reset volume jako migraci.

Povinné testy ověřují čistý bootstrap, HTTP/DB lifecycle, odmítnuté zápisy, neměnnost, versioning, oddělení katalogu/cache a skutečný browser submit. Privilegované mazání pouze vlastních disposable test fixtures je vyhrazené testům; aplikace nemá cestu k obcházení historie.
