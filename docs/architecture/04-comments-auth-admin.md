# Uživatelské účty a administrace

## Uživatelské účty

Pro MVP se používá lehká klasická registrace uživatele.

Povinné údaje:
- `username` – globálně unikátní a veřejně používaný pro atribuci,
- `email` – globálně unikátní a neveřejný,
- heslo – aplikace ukládá pouze bezpečný jednosměrný password hash, nikdy plaintext heslo.

Soutěžní podání se váže na stabilní interní `user_id` autora.

Magic-link přihlašování se pro MVP nepoužívá.

## Přihlášení a zapomenuté heslo

Uživatel se přihlašuje klasicky svými přihlašovacími údaji.

Aplikace musí podporovat zapomenuté heslo:

1. uživatel zadá registrovaný e-mail,
2. systém vytvoří kryptograficky náhodný, časově omezený a jednorázový resetovací token,
3. na e-mail odešle odkaz pro změnu hesla,
4. databáze neukládá reset token v otevřené podobě,
5. po úspěšné změně hesla se token zneplatní.

Resetovací odkaz není magic-link login; slouží pouze ke změně hesla.

Konkrétní algoritmus password hashování, parametry session/cookies, délka a expirace reset tokenu, rate limiting a další bezpečnostní ochrany patří do implementační security baseline a musí být uzavřeny před produkčním nasazením.

## Komentáře

Komentáře nejsou součástí prvního MVP a v této fázi se neimplementují.

Nevzniká tedy komentářový datový model, magic-link identita komentujících, moderace komentářů, denní komentářové limity ani komentářový privacy/retention workflow. Případné budoucí zavedení komentářů bude nové produktové rozhodnutí a musí vycházet z tehdy platného modelu registrovaných uživatelů.

## Admin

Administrátor je běžný registrovaný uživatel se stejnou autentizační identitou jako ostatní uživatelé. Pro MVP se používají dvě role:

- `USER`,
- `ADMIN`.

Samostatný typ nebo tabulka `admin_user` se nepoužívá. Admin roli nelze získat veřejnou registrací ani měnit z klientského UI. Každý administrační endpoint musí oprávnění `ADMIN` ověřit server-side.

KISS rozhraní:

### Dashboard
- čekající věty,
- schválené věty.

### Věty
- detail,
- schválit,
- odmítnout,
- vrátit k doplnění (autor poté odesílá novou revizi sám),
- archivovat.

### Katalog
- navrhnout lexém/tvar,
- schválit,
- odmítnout,
- deaktivovat,
- připojit zdroj.

Stejný uživatelský účet může být současně hráčem i administrátorem. Rozdíl je pouze v autorizaci.

## Audit administrace

Důležité administrátorské zásahy se auditují minimálně údaji:
- admin `user_id`,
- akce,
- typ entity,
- ID entity,
- stav před/po změně,
- čas.

Konkrétní bezpečnostní baseline administrace – session management, CSRF ochrana, throttling/lockout, bezpečné cookie atributy a recovery proces – zůstává implementačním security požadavkem před produkčním nasazením.
