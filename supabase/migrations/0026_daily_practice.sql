-- Daily practice checklist (Ariel, 2026-08-11).
--
-- "חייב להכניס יותר תרגול של הטיות ... ולהוסיף תזכורות יומיות לתרגל כאלה
--  (שיהיה מעין איזה צקליסט של תרגול חזרה יומית + הטיות, כי זה משהו מאוד קריטי
--  ואני מרגיש שאני לא מתרגל את זה כמעט)."
--
-- The daily review already has a natural completion signal — the queue empties —
-- so it needs no storage and none is added. **The daily review is not touched by
-- this table**, which matters: "חזרה יומית לא נוגעים", and every drill in this
-- app is barred from writing to card_srs, review_log or cards.self_score.
--
-- What has no signal is the drills: finishing an inflection table leaves no
-- trace anywhere, by design, so the checklist cannot tell today's practice from
-- last week's. This table is that trace and nothing more — a day, a task key,
-- and when it was ticked. It carries no scheduling, feeds no algorithm, and
-- deleting it costs nothing but the streak.
--
-- `day` is stored as a date rather than derived from `completed_at` so the
-- checklist rolls over at local midnight rather than at UTC midnight, which for
-- Israel would flip the day in the middle of the evening — the exact time he is
-- most likely to be practising.
--
-- Rollback: drop table daily_practice;

create table if not exists daily_practice (
  id uuid primary key default gen_random_uuid(),
  day date not null,
  task text not null,
  completed_at timestamptz not null default now(),
  unique (day, task)
);

create index if not exists daily_practice_day_idx on daily_practice (day desc);
