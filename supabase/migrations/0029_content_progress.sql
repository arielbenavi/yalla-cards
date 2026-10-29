-- How far Ariel got in each video on /content (2026-10-29).
--
-- It used to live in the browser's localStorage, so the phone and the computer
-- each had their own idea of what he had watched ("הכל צריך להיות בסנכרון").
-- One row per video URL, the last write wins. Nothing here touches FSRS.
create table if not exists content_progress (
  url text primary key,
  sec real not null default 0,
  dur real not null default 0,
  updated_at timestamptz not null default now()
);

alter table content_progress enable row level security;
