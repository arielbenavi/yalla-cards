-- Stage 2 of the possessive drill (note 04cff308): assembly.
--
-- The stage is explicitly a one-time discovery step and explicitly not graded —
-- "שלב גילוי חד-פעמי, לא נמדד כשליטה". So it needs somewhere to record that a
-- pattern class has been shown, and that place must not be possessive_attempts:
-- that table means "a trial the learner was scored on", and stage 2 is not one.
-- Mixing them would quietly pollute the stage-1 mastery numbers that decide
-- which contrast gets drilled and when stage 3 unlocks.
--
-- Additive. Rollback: drop table possessive_patterns_seen;

create table if not exists possessive_patterns_seen (
  pattern_class text primary key,
  seen_at timestamptz not null default now()
);

alter table possessive_patterns_seen enable row level security;
