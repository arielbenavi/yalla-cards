-- Checkpoints every inbox import (paste/photo/whatsapp/pdf) so a batch can be
-- reopened, re-parsed after a prompt fix, and committed incrementally without
-- re-uploading the original input. raw_input/parsed_rows shapes are defined
-- in lib/batches.ts; parsed_rows tracks per-row committed state + card_id so
-- "commit remaining rows" only touches what wasn't already committed.
create type import_source as enum ('paste', 'photo', 'whatsapp', 'pdf');

create table import_batches (
  id uuid primary key default gen_random_uuid(),
  source import_source not null,
  lesson_id uuid references lessons(id) on delete set null,
  raw_input jsonb not null default '{}'::jsonb,
  parsed_rows jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index import_batches_lesson_id_idx on import_batches (lesson_id);

alter table import_batches enable row level security;

-- Stores photo uploads and rendered PDF page images so reopening a batch to
-- re-parse never requires re-uploading the source file.
insert into storage.buckets (id, name, public)
values ('imports', 'imports', false)
on conflict (id) do nothing;
