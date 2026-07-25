-- Homework assignments extracted from the book "לדבר בגובה העיניים"
-- Each row is one exercise (word_practice | conjugation_table | translation)
create table homework (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references lessons(id) on delete set null,
  mifgash int not null check (mifgash >= 1),
  type text not null check (type in ('word_practice', 'conjugation_table', 'translation')),
  title text not null,
  instructions text,
  content jsonb not null default '{}'::jsonb,  -- the exercise (questions)
  answer_key jsonb,                              -- filled-in answers
  created_at timestamptz default now()
);

create index homework_lesson_id_idx on homework (lesson_id);
create index homework_mifgash_idx on homework (mifgash);

alter table homework enable row level security;
create policy "authenticated users can read homework" on homework
  for select to authenticated using (true);
