-- Verb conjugation tables for /inflections SRS feature

create table if not exists verb_conjugations (
  id uuid primary key default gen_random_uuid(),
  root text not null,           -- e.g. "كتب"
  meaning_he text not null,     -- e.g. "לכתוב"
  forms jsonb not null,         -- {ana, inta, inti, huwwe, hiyye, ihna, intu, hum}
  dialect text default 'palestinian',
  created_at timestamptz default now()
);

-- 3 separate SRS tracks per verb (recognition / production / audio)
create table if not exists conjugation_srs (
  id uuid primary key default gen_random_uuid(),
  verb_id uuid references verb_conjugations(id) on delete cascade,
  track text not null check (track in ('recognition','production','audio')),
  -- ts-fsrs Card fields (same layout as card_srs)
  due timestamptz default now(),
  stability float default 0,
  difficulty float default 0,
  elapsed_days int default 0,
  scheduled_days int default 0,
  learning_steps int default 0,
  reps int default 0,
  lapses int default 0,
  state smallint default 0,
  last_review timestamptz,
  unique(verb_id, track)
);

create index conjugation_srs_due_idx on conjugation_srs (due);

alter table verb_conjugations enable row level security;
alter table conjugation_srs enable row level security;
