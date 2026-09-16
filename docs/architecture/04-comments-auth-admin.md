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

Ověření registračního e-mailu a obnova hesla jsou odložené do #104/#105 po mailovém backendu #106. Aktuální registrace provádí auto-login a nevytváří verification ani recovery tokeny.

Security základ používá bcrypt (cost 12), session ID rotation při loginu, `HttpOnly`, `SameSite=Lax`, `session.use_strict_mode` a absolutní životnost session dvě hodiny. V přímém HTTPS režimu se nastavuje `Secure`; za TLS proxy musí provoz nastavit `AUTH_COOKIE_SECURE=1` (aplikace nevěří klientským forwarded hlavičkám). Login i registrace používají společné CSRF helpery; JSON submit ověřuje stejný token explicitní hodnotou. Logout je CSRF chráněný POST a ruší session i cookie. Budoucí admin operace používají `auth_require_admin()` serverově.

E-mail se ukládá jako `strtolower(trim(email))`; DB vynucuje unikátnost `lower(btrim(email))`. Login má atomický limit deseti pokusů za patnáct minut podle přímé IP adresy. Neúspěchy zůstávají započítané, úspěch čítač ruší; staré čítače se mažou. Za proxy musí provoz zvážit sdílení IP adres. Nejde o account lockout.

Uživatelský obsah je plain text; PHP používá `htmlspecialchars` a JS escapuje interpolovaný text nebo používá `textContent`.

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

## Historie administrace

Citlivé doménové zásahy uchovávají admina, akci, důvod a čas ve své doménové tabulce. `administrative_decision` cílí na konkrétní immutable revizi; review cache opravuje rozhodnutí novým následným záznamem. Generická tabulka `audit_log`, AI/fair-play evidence ani audit používání nástrojů nejsou součástí MVP. Autorizaci skutečných budoucích admin endpointů je nutné integračně ověřit při jejich implementaci.
