-- Inicializace databáze Nejdelší kvazivěta
-- Spouští se automaticky při prvním startu PostgreSQL kontejneru.
--
-- Vytváří pouze schéma kvazi; všechny doménové tabulky jsou zavedeny
-- následnými migracemi (02-user-account.sql, 03-submission.sql).
--
-- Aktuální cílový datový model je popsán v:
--   docs/architecture/02-database-model.md

CREATE SCHEMA IF NOT EXISTS kvazi;
