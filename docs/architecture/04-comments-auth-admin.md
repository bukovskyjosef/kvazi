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

Registrace vyžaduje ověření e-mailu (#104): po úspěšné registraci aplikace odešle ověřovací e-mail s jednorázovým tokenem (platnost 24 hodin). Uživatel se nemůže přihlásit, dokud neověří e-mail kliknutím na odkaz ve zprávě. Auto-login po registraci se neprovádí. Tokeny jsou v tabulce `auth_token` (sdílená s budoucí obnovou hesla #105); DB ukládá pouze SHA-256 hash, nikoli plaintext. Opětovné zaslání je omezeno na 3 požadavky za hodinu; odpověď je vždy neutrální (anti-enumeration). Mailový backend #106 (`includes/mail.php`) poskytuje `kvazi_mail_send()` s SMTP a outbox transportem.

Security základ používá bcrypt (cost 12), session ID rotation při loginu, `HttpOnly`, `SameSite=Lax`, `session.use_strict_mode` a absolutní životnost session dvě hodiny. V přímém HTTPS režimu se nastavuje `Secure`; za TLS proxy musí provoz nastavit `AUTH_COOKIE_SECURE=1` (aplikace nevěří klientským forwarded hlavičkám). Login i registrace používají společné CSRF helpery; JSON submit ověřuje stejný token explicitní hodnotou. Logout je CSRF chráněný POST a ruší session i cookie. Budoucí admin operace používají `auth_require_admin()` serverově.

E-mail se ukládá jako `strtolower(trim(email))`; DB vynucuje unikátnost `lower(btrim(email))`. Login má atomický limit deseti pokusů za patnáct minut podle `auth_client_ip()`: default je přímá `REMOTE_ADDR`, pouze explicitní `TRUSTED_PROXY_CIDRS` bezprostřední proxy umožní jednu validní `CF-Connecting-IP`; `X-Forwarded-For` se ignoruje. Neúspěchy zůstávají započítané, úspěch čítač ruší; staré čítače se mažou. Cloudflare/Coolify trust boundary a runtime env kontrakt popisuje `app/README.md`. Nejde o account lockout.

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

### Fronta a detail
- `/admin/vety.php` – konkrétní aktuální revisions čekající na rozhodnutí,
- `/admin/veta.php?revisionId=N` – exact immutable detail, serverový výsledek a interní review,
- read-only GET bez binding/decision side effectů; žádný obecný dashboard.

### Věty
- detail,
- schválit,
- zamítnout,
- vrátit k doplnění/přepracování (autor poté odesílá novou revizi sám).

### Katalog
- exact položka se serverově rekonstruuje z tokenu immutable revize,
- v admin detailu potvrdit jako skutečné slovo (true) nebo explicitně nepotvrdit real-word status (false),
- připojit plain-text důvod a zdroj,
- samostatná interní morphology review UI používá M2 služby; katalog a cache se neslévají.

Kompletní approval, owner resubmit a veřejný subset kontrakt je v `07-product-workflow.md`.

Stejný uživatelský účet může být současně hráčem i administrátorem. Rozdíl je pouze v autorizaci.

## Historie administrace

Citlivé doménové zásahy uchovávají admina, akci, důvod a čas ve své doménové tabulce. `administrative_decision` cílí na konkrétní immutable revizi; review cache opravuje rozhodnutí novým následným záznamem. Generická tabulka `audit_log`, AI/fair-play evidence ani audit používání nástrojů nejsou součástí MVP. Autorizaci skutečných budoucích admin endpointů je nutné integračně ověřit při jejich implementaci.
