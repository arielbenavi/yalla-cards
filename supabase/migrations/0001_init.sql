-- Yalla Cards initial schema

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create table lessons (
  id uuid primary key default gen_random_uuid(),
  date date not null default current_date,
  title text,
  notes text,
  created_at timestamptz not null default now()
);

create table recordings (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references lessons(id) on delete set null,
  storage_path text not null,
  duration_sec numeric,
  transcript_json jsonb,
  created_at timestamptz not null default now()
);

create type item_type as enum ('word', 'phrase', 'sentence');

create table cards (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references lessons(id) on delete set null,
  hebrew_meaning text not null,
  translit_nikud text not null,
  -- nikkud/cantillation marks vary between entries of the same word;
  -- dedup must compare stripped form, not raw translit_nikud.
  translit_normalized text generated always as (
    trim(regexp_replace(regexp_replace(translit_nikud, '[֑-ׇ]', '', 'g'), '\s+', ' ', 'g'))
  ) stored,
  arabic_script text,
  item_type item_type not null default 'phrase',
  recording_id uuid references recordings(id) on delete set null,
  audio_start_sec numeric,
  audio_end_sec numeric,
  notes text,
  created_at timestamptz not null default now()
);

create index cards_translit_normalized_trgm on cards using gin (translit_normalized gin_trgm_ops);
create index cards_lesson_id_idx on cards (lesson_id);

create type review_direction as enum ('he_to_ar', 'ar_to_he');

create table card_srs (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references cards(id) on delete cascade,
  direction review_direction not null,
  -- ts-fsrs Card fields, stored flat (numeric State/Rating enums, matches ts-fsrs directly)
  due timestamptz not null default now(),
  stability numeric not null default 0,
  difficulty numeric not null default 0,
  elapsed_days integer not null default 0,
  scheduled_days integer not null default 0,
  learning_steps integer not null default 0,
  reps integer not null default 0,
  lapses integer not null default 0,
  state smallint not null default 0,
  last_review timestamptz,
  unique (card_id, direction)
);

create index card_srs_due_idx on card_srs (due);

create table review_log (
  id uuid primary key default gen_random_uuid(),
  card_srs_id uuid not null references card_srs(id) on delete cascade,
  rating smallint not null,
  state smallint not null,
  due timestamptz not null,
  stability numeric,
  difficulty numeric,
  elapsed_days integer,
  last_elapsed_days integer,
  scheduled_days integer,
  learning_steps integer,
  reviewed_at timestamptz not null default now()
);

create index review_log_reviewed_at_idx on review_log (reviewed_at);

-- Storage bucket for lesson recordings (audio only, private; served via signed URLs)
insert into storage.buckets (id, name, public)
values ('recordings', 'recordings', false)
on conflict (id) do nothing;

-- Single-user app: all reads/writes happen server-side via the service role key
-- (which bypasses RLS). RLS is enabled with no policies so the anon key,
-- if ever leaked to the client, cannot touch these tables directly.
alter table lessons enable row level security;
alter table recordings enable row level security;
alter table cards enable row level security;
alter table card_srs enable row level security;
alter table review_log enable row level security;

