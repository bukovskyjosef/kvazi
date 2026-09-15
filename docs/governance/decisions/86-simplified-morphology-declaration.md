# Zjednodušená morfologická deklarace hráče

> **Status:** PŘIJATO rozhodnutím kvaziautority dne 2026-09-15.

## Rozhodnutí

Morfologická soutěžní identita slov se **nemění**. Nadále ji určují stejné údaje jako dosud podle příslušného normativního modelu, například lemma/základní tvar, slovní druh, soutěžní model a další vlastnosti, které jsou součástí identity.

Mění se pouze způsob, jakým hráč morfologii při podání deklaruje a prokazuje.

Hráč **nemusí ručně vyplňovat celé paradigma ani tvary, které ve své větě nepoužil**.

U produktivního slova hráč deklaruje pouze:

1. údaje potřebné k jednoznačnému určení soutěžní identity,
2. morfologické vlastnosti konkrétního tvaru použitého ve větě,
3. skutečně použitý povrchový tvar.

Systém z normativních tabulek deterministicky odvodí očekávaný použitý tvar a ověří vztah:

`morfologická identita + vlastnosti konkrétního použití -> právě jeden očekávaný tvar`

Hráč tedy neprokazuje správnost tím, že ručně vyplní všechny ostatní buňky paradigmatu. Nepoužité tvary nejsou součástí jeho povinné deklarace.

## Příklady principu

U substantiva hráč uvede například lemma/základní tvar, rod, relevantní životnost, soutěžní model, číslo a pád použitého tvaru a samotný použitý tvar. Systém ověří, zda z těchto údajů podle normativní tabulky použitý tvar skutečně plyne.

U adjektiva hráč uvede základní tvar/odvození, model, případný stupeň a rod, životnost, číslo a pád konkrétního použití spolu s použitým tvarem. Systém očekávaný tvar odvodí z tabulky.

U slovesa hráč uvede infinitiv, časovací typ, vid a morfologické hodnoty konkrétního použitého tvaru; není povinen vyplnit celé časování.

## Důsledky

- Normativní paradigmata zůstávají úplná a beze změny; slouží jako autoritativní pravidlo pro deterministické odvození a validaci.
- Morfologická identita se touto změnou nerozšiřuje ani nezmenšuje.
- Ruší se dřívější produktový požadavek na celé uživatelsky editovatelné a potvrzované paradigma v konfigurátoru.
- Formulář nemá po hráči vyžadovat potvrzení všech nepoužitých buněk paradigmatu.
- Backend i frontend mohou deterministicky ověřit, zda deklarovaný použitý tvar odpovídá deklarované identitě a konkrétním morfologickým hodnotám.
- Validátor nesmí z této schopnosti udělat generátor kandidátů; ověřuje konkrétní hráčem zadaný návrh.

## Nahrazené starší rozhodnutí

Toto rozhodnutí výslovně nahrazuje starší dílčí rozhodnutí v issue #5 a navazujících auditních/implementačních podkladech, podle něhož mělo celé editovatelné paradigma zůstat povinnou součástí hráčského formuláře.
