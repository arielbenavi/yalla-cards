-- Where a lesson came from, so cards can be tagged and filtered by it
-- (Ariel, 2026-10-23: private Preply lessons alongside the course).
--
--   source  'book'   המדרשה — numbered meetings (מפגש N / שיעור N)
--           'oral'   מפגש בעל פה N
--           'preply' private lessons on Preply — with teacher and meeting no.
--           'other'  everything else (songs, words I asked for, …)
--
-- Additive: titles stay as they are; the backfill only reads them.
alter table lessons add column if not exists source text not null default 'other'
  check (source in ('book', 'oral', 'preply', 'other'));
alter table lessons add column if not exists teacher text;
alter table lessons add column if not exists meeting int;

update lessons set source = 'oral', meeting = substring(title from '([0-9]+)')::int
  where source = 'other' and (title like 'מפגש בעפ%' or title like 'מפגש בעל פה%');

update lessons set source = 'book', meeting = substring(title from '([0-9]+)')::int
  where source = 'other' and (title ~ '^מפגש [0-9]' or title ~ '^שיעור [0-9]');
