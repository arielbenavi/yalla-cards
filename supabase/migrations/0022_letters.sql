-- Arabic script module (note 23486a6b), per docs/research-2026-07-31-four-features.md.
--
-- Like focused practice, this is a practice layer: it never touches card_srs,
-- review_log or cards.self_score. The reversibility spec already exercises
-- /letters and asserts exactly that.
--
-- Rollback: drop table letter_attempts, letter_progress;

-- One row per trial. The research's point is that recording only "incorrect"
-- throws away the diagnosis — which letter was chosen instead, and in which
-- positional form, is what separates "does not know غ at all" from "knows غ
-- isolated but not word-medially".
create table if not exists letter_attempts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  target_letter text not null,
  positional_form text not null check (positional_form in ('isolated','initial','medial','final')),
  task_type text not null check (task_type in ('choose_sound','choose_letter','in_word','decode')),
  correct boolean not null,
  -- The letter actually chosen when wrong. This builds the confusion matrix.
  selected_letter text,
  card_id uuid references cards(id) on delete set null,
  latency_ms integer,
  attempted_at timestamptz not null default now()
);

create index letter_attempts_target_idx on letter_attempts (target_letter, attempted_at desc);
create index letter_attempts_session_idx on letter_attempts (session_id);

-- Which letters have been introduced, and when. Mastery itself is derived from
-- letter_attempts rather than stored, so changing the mastery rule does not
-- require a migration or a backfill.
create table if not exists letter_progress (
  letter text primary key,
  introduced_at timestamptz not null default now()
);

alter table letter_attempts enable row level security;
alter table letter_progress enable row level security;
