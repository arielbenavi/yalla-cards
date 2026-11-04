-- Videos and audio with subtitles that follow the player (Lingopie style, /watch/<slug>).
-- `verified` on a line: its Arabic and transliteration were edited by a person, not an
-- automatic transcript. Nothing here touches cards or FSRS.
--
-- Rollback:
--   drop table media_segments;
--   drop table media_items;

create table if not exists media_items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  storage_path text,
  source_url text,
  duration_sec numeric,
  lesson_id uuid references lessons (id) on delete set null,
  glosses jsonb not null default '{}',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists media_segments (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references media_items (id) on delete cascade,
  idx int not null,
  start_sec numeric not null,
  end_sec numeric not null,
  ar text,
  translit text,
  he text,
  verified boolean not null default false,
  source text,
  unique (item_id, idx)
);

alter table media_items enable row level security;
alter table media_segments enable row level security;
