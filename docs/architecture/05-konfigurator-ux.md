# Konfigurátor kvazivěty – funkční a vzhledová specifikace

> **Status:** živý dokument reflektující aktuální stav prototypu `app/public/konfigurator.html`
> a jeho modulů v `app/public/js/konfigurator/`.
> Produktové požadavky a auditní nálezy jsou v `docs/audit/2026-09-14-audit-konfiguratoru.md`.
> Tento dokument popisuje implementovanou UX vrstvu, nikoli soutěžní pravidla.

---

## 1. Architektura stránky

Stránka se skládá ze čtyř logických karet:

1. **Zadání věty** – preview, typ věty, vkládání slov.
2. **Deklarace slova** – editor vybraného tokenu (skrytý, dokud není nic vybráno).
3. **Kontrola deklarace** – validační panel.
4. **Akce** – local preview JSON, základ pro budoucí submit.

Stav žije čistě v paměti stránky (`draft` v `editor.mjs`). Nic se neodesílá ani neukládá.

---

## 2. Záhlaví (header)

- Gradient pozadí: `#0f172a → #1e3a5f`.
- Vlevo: název „Konfigurátor kvazivěty" + podtitulek „Nejdelší kvazivěta · prototyp".
- Vpravo (`.header-nav`):
  - Tlačítko **terminologický přepínač** (`#termToggle`) – přepíná mezi odbornými
    a českými názvy (viz sekce 7).
  - Odkaz **← Úvod** vedoucí na `/`.

---

## 3. Vkládání slov (sentence entry)

### 3.1 Vstupní pole

- Jedno textové pole `#newSurface` uvnitř flexibilního `.sentence-entry` kontejneru.
- Slova se oddělují mezerou nebo Enterem – po každé mezeře/Enteru se aktuální
  obsah pole rozdělí na tokeny a každý se stane chipem.
- Backspace v prázdném poli smaže poslední chip.
- Pole podporuje IME kompozici (čínština, japonština apod.) – commit probíhá
  až po `compositionend`.

### 3.2 Chipy tokenů

Každé slovo je reprezentováno jako `.token-chip` (inline-flex):

- **Levá část** (`.chip` + `button[data-action=select]`): kliknutí vybere token
  do editoru.
- **Pravá část** (`.chip-remove` + `button[data-action=delete-chip]`): odstraní token.

Vizuální stav chipu:

| Třída    | Podmínka                        | Efekt                          |
|----------|---------------------------------|--------------------------------|
| `.ok`    | token je kompletní              | zelený rámeček (`#86efac`)     |
| `.err`   | token má chybějící pole         | červený rámeček, světle červené pozadí |
| `.active`| token je právě vybrán v editoru | modrý rámeček + `box-shadow`   |

Barvy chipů podle slovního druhu (třídy `pos-*`, neaplikují se při `.active`):

| Třída              | Barva pozadí | Barva textu |
|--------------------|--------------|-------------|
| `.pos-noun`        | modrá        | tmavě modrá |
| `.pos-adjective`   | zelená       | tmavě zelená |
| `.pos-verb`        | žlutá        | hnědooranžová |
| `.pos-pronoun`     | fialová      | tmavě fialová |
| `.pos-preposition` | světle šedá  | šedá |
| `.pos-conjunction` | azurová      | tmavě cyan |

Třídy jsou přidány renderem podle hodnoty `w.pos` tokenu.

### 3.3 Vkládání na konkrétní pozici

Skrytý `<select id="insertPlace">` (v DOM kvůli logice, uživateli neviditelný)
uchovává aktuální cílovou pozici (za/před konkrétní token nebo na konec).
Po vložení se pozice automaticky posune za právě vložené slovo.

---

## 4. Metadata věty (sentenceFields)

Renderuje se do `#sentenceFields` po každém volání `render()`.

### 4.1 Typ věty

Tři radio buttony jako `.radio-label` uvnitř `.radio-group` (flex řádek):

- **Oznamovací** (`declarative`) – default.
- **Tázací** (`interrogative`).
- **Rozkazovací** (`imperative`).

### 4.2 Podmět není vyjádřen (implicitní podmět)

Zobrazuje se **pouze** pro typ `imperative`. Checkbox je renderován přímo
v `.radio-group` flex řádku (nikoli na novém řádku) ve stylu `.radio-label`,
takže vizuálně navazuje na skupinu radiobuttonů.

Label: „Podmět není vyjádřen".

### 4.3 Volitelné pole (optional-wrap)

Zbylá nepovinná pole jsou sbalená v `<details class="optional-wrap">`:

- **Fiktivní význam celé věty** – textové pole.
- **Další obhajoba celé věty** – textové pole.

`details` zachovává svůj `open` stav přes re-rendery (stav se čte před přepsáním
innerHTML a obnoví se po něm).

---

## 5. Preview věty

- Element `#sentencePreview` nad kartou zadání.
- Font: Georgia/Times New Roman (serif), 28 px.
- Prázdný stav: kurzíva, světle šedá, nápis „Věta se zobrazí zde…".
- Zobrazuje tokeny oddělené mezerou + závěrečnou interpunkci podle typu věty.

---

## 6. Editor deklarace slova

Zobrazuje se pouze pokud je vybrán token (`selectedId != null`). Renderuje se
jako obsah `#editor` karty.

### 6.1 Sekce: Identita a použitý tvar

- **Slovní druh** – select s odbornou/českou terminologií (viz sekce 7).
  Pro funkční slova (předložka, spojka) je disabled a ukazuje jen svůj druh.
- **Základní tvar** – text input (neurčitek pro slovesa).
- **Deklarovaná identita** – select (Skutečné slovo / Kvazislovo).
- **Soutěžní vzor / časovací typ** – select ze vzorů definovaných v `schema.mjs`.
- **Pád, Číslo** (podstatná jména, zájmena) a **Rod, Pád, Číslo** (přídavná jména)
  použitého tvaru – selecty.
- **Prefix kvazi-** (podstatná jména) – select.
- **Druh slovesného tvaru** (slovesa) – select: přítomný/budoucí, rozkazovací způsob,
  l-příčestí. Podle vybrané hodnoty se kontextově zobrazí:
  - *přítomný/budoucí* → Osoba (1/2/3), Číslo.
  - *rozkazovací způsob* → Osoba/číslo (2.sg / 1.pl / 2.pl).
  - *l-příčestí* → Rod (mužský/ženský/střední), Číslo, a pokud maskulinum plurál,
    pak i Životnost.
- **Vid** – select (Nedokonavý / Dokonavý / Obouvidový).
- **Valenční obhajoba** – multiline text area.

Pod formulářem se zobrazí výsledek morfologické kontroly tvaru (viz sekce 8).

### 6.2 Sekce: Větná funkce a vazby

- **Větná funkce** – select s odbornou/českou terminologií.
- **Řídící slovo / Predikát / Nominál / Levá-pravá část** – selecty s tokeny věty
  (dle `relationShapes` pro danou roli).
- Checkbox **„Vztah je významově nejasný nebo závisí na fiktivním významu"**
  – pokud zaškrtnuto, zobrazí se text inputy pro obhajobu a českou analogii.

### 6.3 Sekce: Podklady pro posouzení

- **Morfologická obhajoba** – text input.
- **Zdroj** (jen pro skutečná slova) – select (IJP / ASSČ).
- **Konkrétní heslo a doklad** – text input.

### 6.4 Přehled zbývajícího

Na konci editoru je shrnutí všeho, co u tokenu chybí (issues, missing,
chyba morfologické shody).

---

## 7. Terminologický přepínač

### 7.1 Výchozí stav

**Výchozí jsou odborné termíny** (latinsko-řecké). Tlačítko zobrazuje
„Přepnout do češtiny".

### 7.2 Přepnutý stav

Po kliknutí se zobrazují české termíny. Tlačítko zobrazuje „Přepnout na odborné".

### 7.3 Pokrytí

Modul `terms.mjs` překládá tyto pojmy:

| Koncept       | Odborný termín         | Český termín            |
|---------------|------------------------|-------------------------|
| noun          | Substantivum           | Podstatné jméno         |
| adjective     | Adjektivum             | Přídavné jméno          |
| verb          | Verbum                 | Sloveso                 |
| pronoun       | Pronomen               | Zájmeno                 |
| preposition   | Prepozice              | Předložka               |
| conjunction   | Konjunkce              | Spojka                  |
| subject       | Subjekt                | Podmět                  |
| predicate     | Predikát               | Přísudek                |
| object        | Objekt                 | Předmět                 |
| agreeingAttr. | Atribut shodný         | Přívlastek shodný       |
| attribute     | Atribut neshodný       | Přívlastek neshodný     |
| adverbial     | Adverbiale             | Příslovečné určení      |
| supplement    | Predikativum           | Doplněk                 |
| coordination  | Koordinace             | Spojení souřadných částí|
| 1.–7. pád     | Nominativ … Instrumentál | 1. pád … 7. pád       |
| singular      | Singulár               | Jednotné                |
| plural        | Plurál                 | Množné                  |
| masculineAnim.| M živ                  | Mužský životný          |
| masculineInan.| M neživ                | Mužský neživotný        |
| feminine      | F                      | Ženský                  |
| neuter        | N                      | Střední                 |
| imperfective  | Imperfektivum          | Nedokonavý              |
| perfective    | Perfektivum            | Dokonavý                |
| biaspectual   | Biaspektuální          | Obouvidový              |

Přepnutí okamžitě překreslí celý UI (jeden `toggleMode()` + `render()`).
Termíny jsou aplikovány v: selectech slovního druhu a větné funkce, headrech
a řádcích morfologické tabulky, selectech pádu/čísla/rodu/vidu.

---

## 8. Morfologická shoda

Modul `morpho.mjs` obsahuje normativní paradigmatické tabulky pro všechny soutěžní vzory a modely
a exportuje funkci `validateForm(w)`. Ta dostane token a synchronně vrátí:

```js
{ ok: boolean, expected: string | null, message: string | null }
```

- `ok: true, expected: 'kvaz'` — deklarovaný tvar byl deterministicky odvozen a povrchový tvar
  tokenu mu odpovídá (nebo se liší jen nefunkčně, v tom případě se zobrazí poznámka).
- `ok: false, message: '…'` — tvar nelze ověřit nebo povrchový tvar neodpovídá očekávanému.
- `ok: true, expected: null` — ověření nebylo možné (neznámý vzor, funkční slovo): bere se jako OK.

### 8.1 Pokrytí paradigmat

| Kategorie         | Vzory / modely                                         |
|-------------------|--------------------------------------------------------|
| Podstatná jména   | 14 vzorů (pán, muž, předseda, soudce, hrad, stroj, žena, růže, píseň, kost, město, moře, kuře, stavení) |
| Přídavná jména    | mladý, jarní, otcův, matčin (+ gradace 1.–3. stupně)  |
| Slovesa           | V-AT, V-IT, V-NOUT, V-ÝT, V-OVAT × {přítomný, rozkazovací, l-příčestí} |

### 8.2 Zobrazení výsledku v editoru

Ve fieldsettu „Identita a použitý tvar" se pod formulářovými poli zobrazí:

- **✓ Morfologická shoda** (zelený odstavec) – tvar odpovídá deklaraci, uveden očekávaný tvar.
  Pokud se povrchový tvar liší od očekávaného (liší se diakritika apod.), zobrazí se upozornění.
- **Chybí: …** (červený odstavec) – konkrétní chybová hláška (např. „Pád nebo číslo není nastaveno.",
  „Očekávaný tvar je ‚kvaz', ale povrchový tvar je ‚kvazi'.").
- Pro funkční slova (předložka, spojka) a pro neznámé vzory se výsledek nezobrazuje.

### 8.3 Agregace do morfologyOk

`deriveValidationState()` agreguje `formCheck.ok` přes všechny tokeny do `morphologyOk`.
Validační panel zobrazuje „Morfologická shoda ověřena" (✓) nebo „Morfologická shoda ověřena" (Chybí:).
`submitReady` je `false`, dokud není `morphologyOk === true`.

---

## 9. Validační panel

Zobrazuje se v `#validation`. Zobrazuje:

1. Znaková kontrola (DFA motivů, délky, výjimky) – ✓ / Chybí.
2. Větná struktura a syntaktické vazby – ✓ / Chybí.
3. Strukturované údaje úplné – ✓ / Chybí.
4. Morfologická shoda ověřena – ✓ / Chybí.
5. Připraveno k odeslání – ✓ / Chybí.
6. Počet slov a znaků (Q = 1, KV = 2).
7. Seznam aktuálních problémů na úrovni věty.
8. Per-token sbalitelné detaily (`<details>`).

---

## 10. Zachování focusu

Při každém `render()` se před přepsáním DOM zaznamená `document.activeElement.id`
a rozsah textové selekce. Po přepsání se focus i selekce obnoví na stejný element
(pokud stále existuje). Tím se zamezí ztrátě kurzoru při psaní.

---

## 11. Designový systém

### 11.1 Barvy

| Role                | Hodnota       |
|---------------------|---------------|
| Header gradient od  | `#0f172a`     |
| Header gradient do  | `#1e3a5f`     |
| Pozadí stránky      | `#eef1f6`     |
| Karta (pozadí)      | `#ffffff`     |
| Karta (rámeček)     | `#e2e8f0`     |
| Akcent (focus/link) | `#3b82f6`     |
| Úspěch              | `#16a34a`     |
| Chyba               | `#fca5a5`     |

### 11.2 Typografie

- Systémový sans-serif stack (`-apple-system`, `BlinkMacSystemFont`, `Segoe UI`).
- Věta v preview: Georgia/Times New Roman, 28 px.
- UI labels: 11 px uppercase s letter-spacing pro kategorie.

### 11.3 Karty

- `border-radius: 10px`, `box-shadow: 0 1px 3px … 0 4px 16px …`.
- Card header: `#f8fafc` pozadí, uppercase label.

### 11.4 Formulářové prvky

- Inputy a selecty: `border: 1.5px solid #d1d9e6`, `border-radius: 6px`.
- Focus: `border-color: #3b82f6` + `box-shadow` s modrou průhledností.

### 11.5 Responzivita

Pod 600 px se header zalamuje, container má menší padding, preview má menší font.

---

## 12. Aktuální omezení prototypu (záměrná)

- Žádný backend submit – pouze local JSON preview.
- Valenční rámec (`valency.declaration`) je textový popis; sémantická validace
  valenčního slotu pro předmět je jen zástupný bod (#5).
- `submitReady` bude `false`, dokud nejsou potřebná data úplná a morfologická
  shoda ověřena.
- Bez přihlášení, autorizace ani perzistence.
