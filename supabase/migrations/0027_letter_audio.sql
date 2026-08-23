-- Note 28e16a9b: a speaker button on the letter drill, sourced from the first
-- WhatsApp recordings — "להצמיד מההקלטות הראשונות בווצאפ בקבוצה איך הוגים".
--
-- A range into an existing recording rather than an extracted clip: the two
-- מפגש 1 alphabet recordings already sit in storage with word-level
-- timestamps, so the letter's moment is addressable and nothing is duplicated.
create table if not exists letter_audio (
  letter text primary key,
  recording_id uuid not null references recordings (id) on delete cascade,
  start_sec numeric not null,
  end_sec numeric not null,
  -- What the teacher actually says there, so a wrong range is visible in the
  -- data rather than only audible.
  note text,
  created_at timestamptz not null default now(),
  constraint letter_audio_range check (end_sec > start_sec)
);

create index if not exists letter_audio_recording_idx on letter_audio (recording_id);
