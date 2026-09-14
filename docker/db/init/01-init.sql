-- Inicializace databáze Nejdelší kvazivěta
-- Spouští se automaticky při prvním startu PostgreSQL kontejneru.
--
-- Doménové tabulky se zde záměrně nevytvářejí. Původní pre-audit schema bylo
-- po 19/19 produktových rozhodnutích překonané (obsahovalo komentářové magic
-- linky, samostatný admin_user a další dnes neplatné modely).
--
-- Aktuální cílový datový model je popsán v:
--   docs/architecture/02-database-model.md
-- a implementační checklist v:
--   db/schema-draft.sql
--
-- Produkční tabulky budou zavedeny verzovanými migracemi až po uzavření
-- zbývajících normativních SPEC úkolů a implementačních DB invariantů.

CREATE SCHEMA IF NOT EXISTS kvazi;
