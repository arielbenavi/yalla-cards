-- A plain log of what the additions from the Speak review do, so they can be judged
-- on data (scripts/learning-report.ts). Fix-round attempts go to focused_practice_log
-- with source = 'fix_round'; neither table is ever read by the scheduler.
--
-- Rollback:
--   drop table learning_events;
--   alter table focused_practice_log drop column source;

alter table focused_practice_log add column if not exists source text;

create table if not exists learning_events (
  id uuid primary key default gen_random_uuid(),
  event text not null,
  card_id uuid references cards (id) on delete cascade,
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists learning_events_event_idx on learning_events (event, created_at desc);

alter table learning_events enable row level security;
alter table clip_suggestions enable row level security;
