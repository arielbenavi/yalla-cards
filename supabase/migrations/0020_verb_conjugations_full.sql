-- Extends verb_conjugations for real Palestinian data, and repairs the seed.
--
-- Two problems with what is in the table today:
--
-- 1. The 0013 seed has no ON CONFLICT and was applied seven times, so the table
--    holds 70 rows for 10 verbs, with 210 conjugation_srs rows hanging off them.
-- 2. The seeded forms are Modern Standard Arabic (بتقريئي and friends), present
--    tense only, with no Hebrew transliteration — while the rest of the app works
--    in vocalised Hebrew transliteration.
--
-- This migration fixes (1) and adds the columns needed to fix (2).
--
-- `forms` keeps its flat {person: arabic} shape so the current /inflections screen
-- keeps working; the rebuild (docs/handoff-inflections-rebuild.md) moves to
-- forms_full.
--
-- forms_full shape:
--   {
--     "past":       {"ana": {"translit": "רֻחֵת", "arabic": "رحت"}, ...},
--     "present":    {"ana": {"translit": "בַּרוּח", "arabic": "بروح"}, ...},
--     "imperative": {"inta": {...}, "inti": {...}, "intu": {...}},
--     "participle": {"m": {...}, "f": {...}, "pl": {...}}   -- optional
--   }
-- Person keys: ana, inta, inti, huwwe, hiyye, ihna, intu, hum.

alter table verb_conjugations add column if not exists root_translit text;
alter table verb_conjugations add column if not exists forms_full jsonb;
alter table verb_conjugations add column if not exists chatifai_verified boolean default false;
alter table verb_conjugations add column if not exists lesson_id uuid references lessons(id) on delete set null;
alter table verb_conjugations add column if not exists notes text;

-- ---------------------------------------------------------------------------
-- Dedupe. Canonical row per root = the one carrying SRS review history if there
-- is one, otherwise the oldest. Ordering by "has history" first guarantees no
-- reviewed row is ever the one deleted.
-- ---------------------------------------------------------------------------
with canonical as (
  select distinct on (root) id, root
  from (
    select
      v.id,
      v.root,
      v.created_at,
      exists (
        select 1 from conjugation_srs s
        where s.verb_id = v.id and (s.reps > 0 or s.state <> 0)
      ) as has_history
    from verb_conjugations v
  ) t
  order by root, has_history desc, created_at asc, id asc
)
-- Drop only SRS rows that hang off a non-canonical duplicate AND have never been
-- reviewed. A reviewed row cannot match: its verb is canonical by construction.
delete from conjugation_srs s
using verb_conjugations v
where s.verb_id = v.id
  and v.id not in (select id from canonical)
  and s.reps = 0
  and s.state = 0;

with canonical as (
  select distinct on (root) id, root
  from (
    select
      v.id,
      v.root,
      v.created_at,
      exists (
        select 1 from conjugation_srs s
        where s.verb_id = v.id and (s.reps > 0 or s.state <> 0)
      ) as has_history
    from verb_conjugations v
  ) t
  order by root, has_history desc, created_at asc, id asc
)
delete from verb_conjugations v
where v.id not in (select id from canonical);

create unique index if not exists verb_conjugations_root_idx on verb_conjugations (root);
