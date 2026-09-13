# Komentáře, magic link a administrace

## Komentáře bez klasického účtu

Na stránce konkrétní věty uživatel zadá e-mail. Na něj přijde jednorázový magic link platný 10 minut. Po ověření může publikovat anonymní komentář pod stabilním pseudonymem odvozeným od e-mailové identity.

## E-mailová identita

Doporučení:

```text
normalized_email
 -> HMAC-SHA256(email, SERVER_SECRET)
 -> email_hmac
```

Veřejný pseudonym může mít tvar `Kvazista-7F4A92`.

Stejný e-mail má vždy stejnou anonymní identitu a pseudonym. Běžný e-mail se nemá veřejně zobrazovat.

## Magic link

- kryptograficky náhodný token,
- platnost 10 minut,
- jednorázový,
- databáze ukládá pouze hash tokenu.

Samotný GET odkazu token nespotřebuje. Spotřebování proběhne až při odeslání komentáře.

Doporučený POST flow v jedné DB transakci:

1. ověřit token,
2. ověřit expiraci,
3. ověřit, že nebyl použit,
4. ověřit denní limit,
5. vložit komentář,
6. označit token jako použitý.

## Limit komentářů

Výchozí pravidlo:

> **1 komentář z jedné e-mailové identity za kalendářní den globálně přes celý web.**

## Rate limiting magic linků

Doporučení:
- nejvýše 3 žádosti na e-mail za hodinu,
- rozumný limit také na zdroj požadavků.

## Moderace

Komentář může mít stav:
- `VISIBLE`,
- `HIDDEN`,
- `DELETED`.

Admin může komentář skrýt, obnovit nebo odstranit a přidat interní poznámku.

## Admin

KISS rozhraní:

### Dashboard
- čekající věty,
- nové komentáře,
- schválené věty,
- námitky proti katalogu.

### Věty
- detail,
- schválit,
- odmítnout,
- vrátit k doplnění,
- archivovat,
- vytvořit novou revizi.

### Katalog
- navrhnout lexém/tvar,
- schválit,
- odmítnout,
- deaktivovat,
- připojit zdroj.

## Audit administrace

Důležité administrátorské zásahy se auditují minimálně údaji:
- admin,
- akce,
- typ entity,
- ID entity,
- stav před/po změně,
- čas.
