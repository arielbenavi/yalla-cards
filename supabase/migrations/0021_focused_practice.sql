-- Focused practice (note ac2ed4f2), per docs/research-2026-07-31-four-features.md.
--
-- A short drill over cards the learner has actually struggled with. It is a
-- practice layer, NOT a second scheduler: it reads FSRS state and never writes
-- it. Attempts land here instead of review_log, so the scheduler's model of the
-- learner stays exactly as the official reviews left it.
--
-- The research calls the resulting mismatch a model-reality gap rather than data
-- corruption, and prefers a small conservative gap over feeding non-standard
-- attempts to the scheduler. The 12-hour cooldown below is what bounds it.

create table if not exists focused_practice_log (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  card_srs_id uuid not null references card_srs(id) on delete cascade,
  -- 1=Again 2=Hard 3=Good 4=Easy, mirroring ts-fsrs Rating for readability only.
  -- Nothing here is ever fed to the scheduler.
  outcome smallint not null,
  attempt_index smallint not null default 1,
  latency_ms integer,
  hint_used boolean not null default false,
  practiced_at timestamptz not null default now()
);

create index focused_practice_log_card_idx on focused_practice_log (card_srs_id, practiced_at desc);
create index focused_practice_log_session_idx on focused_practice_log (session_id);

alter table focused_practice_log enable row level security;
