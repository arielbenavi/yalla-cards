-- A card can be verified by the course, by chatifai, by both, or by neither.
--
-- Until now `chatifai_verified` was the only signal, which made a chatbot the
-- final word on forms Ariel heard a teacher say out loud in a מפגש בעל פה. That
-- is the wrong ordering for spoken Palestinian: the lesson is first-hand
-- evidence and chatifai is a preference.
--
-- The two columns are independent on purpose. A card marked course_verified but
-- not chatifai_verified is not a defect waiting to be reconciled — it means the
-- teacher said one thing and chatifai prefers another, and the disagreement
-- itself is worth keeping. Reconciling them by overwriting would destroy the
-- only record that there was ever a difference.
--
-- Additive, defaults false, no existing row changes meaning.
-- Rollback: alter table cards drop column course_verified, drop column course_note;

alter table cards
  add column if not exists course_verified boolean not null default false;

-- What the lesson said, when it differs from what chatifai says. Kept beside the
-- card rather than in `notes` so it survives note rewrites and can be queried.
alter table cards
  add column if not exists course_note text;

create index if not exists cards_course_verified_idx
  on cards (course_verified)
  where course_verified;
