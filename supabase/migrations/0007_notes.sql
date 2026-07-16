-- Quick notes for jotting bugs/ideas mid-use (from phone or desktop).
-- tag is a free-text screen/context hint (e.g. "inbox", "review").
-- status: open → done/dismissed once actioned.
do $$ begin
  create type note_status as enum ('open', 'done', 'dismissed');
exception when duplicate_object then null;
end $$;

create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  body text not null,
  tag text,
  status note_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table notes enable row level security;
