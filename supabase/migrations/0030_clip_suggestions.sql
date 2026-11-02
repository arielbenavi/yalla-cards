-- The queue behind /recordings/auto: a range in a lesson recording proposed for a
-- card that has no clip. A row never changes the card by itself; the clip reaches
-- cards.clip_path only when Ariel approves it. Keeps every decision and the final
-- edges, so how good the guesses were can be measured later.
--
-- transcript_ar_json is a second hearing of the whole recording with the language
-- forced to Arabic. transcript_json stays as it was (the transcript view reads it).
--
-- Rollback:
--   drop table clip_suggestions;
--   alter table recordings drop column transcript_ar_json;

alter table recordings add column if not exists transcript_ar_json jsonb;

create table if not exists clip_suggestions (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references cards (id) on delete cascade,
  recording_id uuid not null references recordings (id) on delete cascade,
  start_sec numeric not null,
  end_sec numeric not null,
  confidence numeric not null,
  signals jsonb not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'superseded')),
  final_start_sec numeric,
  final_end_sec numeric,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  unique (card_id, recording_id, start_sec)
);

create index if not exists clip_suggestions_queue_idx on clip_suggestions (status, confidence desc);
create index if not exists clip_suggestions_card_idx on clip_suggestions (card_id);
