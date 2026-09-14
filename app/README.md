# Aplikační část

Vstupní kontext pro vývoj je v `/AGENTS.md` a `/docs/architecture/00-boundaries.md`. Autoritu dokumentů popisuje `/docs/README.md`; aktuální práce je v GitHub Issues.

Stack: PHP 8.x, PostgreSQL, HTML5, CSS a vanilla JavaScript.

Konfigurátor `public/konfigurator.html` je strukturální prototyp podle #63.
Spouští se přes HTTP (ES moduly), například z kořene repozitáře:

```sh
php -S 127.0.0.1:8080 -t app/public
```

Otevřete `http://127.0.0.1:8080/konfigurator.html`. Draft žije pouze v paměti
stránky. Místní JSON náhled nic neodesílá a nevytváří revizi ani stav review.

V `public/js/konfigurator/` jsou oddělené:

- `schema.mjs`: veřejná rozhodnutá pole, pracovní buňky tabulek a explicitní gates;
- `state.mjs`: kanonický draft, stabilní ID, NFC a mutace se snapshotovým potvrzením;
- `validation.mjs`: čistá znaková, strukturální a completeness validace;
- `view.mjs`: DOM rendering odvozeného stavu;
- `editor.mjs`: události, centrální přepočet a zachování focusu.

Token má oddělené `surface`, `lemma`, `pos`, `model`, `identity`, `form`,
`lexicalStatus`, `role`, `relations`, `valency`, `evidence` a `morphology`.
`model` u slovesa představuje soutěžní časovací typ. `valency.declaration` je
zatím neprůhledné prázdné místo, nikoli návrh finálního rámce nebo slotů.
Budoucí veřejný valenční adaptér musí společně dodat pole, kontrolu úplnosti
a kontrolu vazeb na sloty. Nevychází z interního katalogu.

Změna textu ruší textově závislou deklaraci, ale zachová ID a nezávislé vazby.
Změna modelu ruší modelově závislé kategorie a buňky. Změna funkce ruší její
vlastní vazby; odstranění slova ruší odkazy na odstraněné ID. Každá mutace
přepočítá celý odvozený stav a odstraní starý náhled. Potvrzení zahrnuje schema,
identitu, použitý tvar, paradigma a podklady; změna těchto dat je zneplatní.

Pracovní tabulky jmen nepředepisují koncovky ani povolené varianty. Jejich
vyplnění a potvrzení nenahrazuje dokončení normativních modelů (#1).
Slovesná paradigmata se načtou až ze specifikovaných modelů (#2); hraniční
větve zůstávají podmíněné #4 a obecná valence #5. Výjimku navrhovanou v #60
znaková validace nepovoluje. Aktuální stav těchto závislostí určuje GitHub.
Dokud nejsou potřebná schemata úplná, `submitReady` zůstává false. Backend
musí při budoucím skutečném submitu všechny kontroly autoritativně zopakovat.

Deterministické regresní testy (Node.js 22 nebo novější, bez závislostí):

```sh
node --test app/tests/*.test.mjs
```

Volitelný integrační test používá Playwright dostupný mimo aplikační runtime:

```sh
PLAYWRIGHT_MODULE=/absolutni/cesta/playwright/index.mjs node app/tests/konfigurator.browser.mjs
```

`CHROME_PATH` může určit vlastní executable prohlížeče. Test spustí dočasný
HTTP server na localhostu a ověří editor, vazby, potvrzení, náhled a základní
přístupnost. Syntetické dokončené schema v unit testech je pouze testovací
fixture; není dostupné v UI a nepředstavuje návrh soutěžních pravidel.
