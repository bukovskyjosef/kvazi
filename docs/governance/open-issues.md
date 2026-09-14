# Otevřené body a úkoly

Tento dokument je stručný index skutečně aktivního backlogu. Autoritativní diskuse a aktuální stav jsou v GitHub Issues.

Finální produktová a pravidlová rozhodnutí provádí Josef Bukovský. Uzavřené auditní nálezy zůstávají dohledatelné v GitHub historii, ale nejsou zde znovu uváděny jako aktivní práce.

## P0 – normativní specifikace

- **#1** `[SPEC] Dokončit normativní kvazitahák a paradigmata`
  - přesná substantivní a adjektivní paradigmata,
  - explicitně povolené realizace/dublety,
  - finální hráčské normativní tabulky.

- **#2** `SPEC: Finální slovesné typy`
  - finální minimální sada časovacích typů odvozená z reachability,
  - lemma podmínky, paradigmata, relevantní časy/způsoby a varianty.

- **#4** `[SPEC] Provést reachability audit soutěžních mechanismů`
  - pomocná slovesa, zájmena, `kuře`, přivlastňovací adjektiva, stupňování, krátké tvary a další hraniční větve,
  - rozlišení `dosažitelný / hraniční / prokazatelně nedosažitelný`.

- **#60** `[SPEC] Výjimka pro podstatná jména s prefixem kvazi-`
  - prověřit záměrnou herní výjimku, která by dovolila podstatná jména začínající `kvazi-` i nad běžný limit 5 znaků,
  - pracovní příklad: `kvaziváza` → `kvazivázy`,
  - přesně uzavřít rozsah výjimky, vztah k motivům, základu, soutěžní identitě a paradigmatu.

## P1 – field schema a formulář

- **#5** `[SPEC] Dokončit field schema soutěžního formuláře`
  - úplná strukturovaná deklarace per POS/model,
  - celé editovatelné paradigma a snapshot potvrzení uživatele,
  - syntax a povinné vazby,
  - `k/v/z` a `a/i`,
  - sentence-level typ věty `oznamovací / tázací / rozkazovací`,
  - přímá vazba typu věty na interpunkci `. / ? / !` a pravidla nevyjádřeného podmětu,
  - u slovesa deklarovaný valenční rámec **včetně obhájení konkrétním současným českým slovesem se stejnou valencí** a explicitní realizace obligatorních slotů.

- **#54** `[IMPLEMENTATION] Umožnit editaci a vložení slova uprostřed věty`
  - editace surface formy a vložení na zvolenou pozici,
  - stabilní interní ID a řízená invalidace závislých dat,
  - při refaktoru současně řešit přístupnost a výchozí jednoduchou hráčskou terminologii.

## P2 – validace, data a katalog

- **#7** `[IMPLEMENTATION] Deterministický znakový validátor a testy`
  - FE/BE mechanické a strukturální invarianty,
  - NFC normalizace,
  - submit gate a finální backend revalidace,
  - žádný pre-submit catalog oracle ani generování návrhů.

- **#8** `[IMPLEMENTATION] Srovnat architekturu a DB model s přijatými rozhodnutími`
  - immutable `sentence_revision`,
  - oddělení deklarace, katalogového resolution, obsahové validity, procesní compliance a publikace,
  - úplná validační provenance a historizace,
  - DB integrita a produkční migrace.

- **#6** `[IMPLEMENTATION] Interní učící se katalog pro MVP`
  - interní `APPROVED / REJECTED / UNKNOWN`,
  - lookup až nad uzamčenou revizí,
  - automatické znovupoužití pouze v rámci stejné `rules_version`,
  - ruční rozhodnutí neznámé položky adminem a auditní stopa.

## P3 – uživatelé, workflow a security

- **#35** `[IMPLEMENTATION] Uživatelské účty a autorství podání`
  - klasická registrace/přihlášení,
  - unikátní `username`, neveřejný unikátní e-mail a stabilní `user_id`,
  - reset zapomenutého hesla,
  - podání pevně navázané na autora.

- **#36** `[IMPLEMENTATION] Security baseline registrace, session a admin role`
  - bezpečný auth/session/recovery model,
  - serverově vynucená role `ADMIN`,
  - CSRF, throttling, bezpečné cookies, audit citlivých akcí a bezpečné renderování uživatelského obsahu.

- **#61** `[FEATURE] Moje věty a workflow přepracování podání`
  - přehled přihlášeného uživatele podle stavů minimálně `čeká na revizi / schválená / vrácena k přepracování`,
  - vrácená věta se otevře jako nová editovatelná revize,
  - původní odevzdaný snapshot zůstává immutable,
  - nové odevzdání vytvoří nový immutable snapshot ke schválení.

## P4 – release a reprodukovatelnost

- **#9** `[IMPLEMENTATION] Release proces pravidel, manifest a revalidace`
  - immutable manifest každé `rules_version`,
  - release metadata a changelog,
  - revalidace historických immutable revizí bez přepisu minulosti,
  - rules/catalog/validator/scoring provenance a historický vs. aktuální leaderboard.

## Stav po konsolidaci

Aktivní backlog má být malý a významový. Detailní auditní nálezy, které pouze rozepisovaly část některého master issue, jsou uzavřené jako absorbované/duplicate a jejich požadavky jsou přeneseny do výše uvedených masterů.

Komentáře, comment magic links, samostatná komentářová identita, samostatný `admin_user`, veřejný katalog a bulk katalogové workflow nejsou součástí prvního MVP.
