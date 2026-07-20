create table if not exists songs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text not null,
  lyrics_raw text not null,           -- raw pasted lyrics
  lyrics_parsed jsonb,                -- [{line: string, words: [{ar, he, translit}]}]
  youtube_url text,
  cover_url text,
  created_at timestamptz default now()
);

create table if not exists song_word_srs (
  id uuid primary key default gen_random_uuid(),
  song_id uuid references songs(id) on delete cascade,
  word_index int not null,            -- flat index into lyrics_parsed words array
  due timestamptz default now(),
  stability float default 0,
  difficulty float default 0,
  elapsed_days int default 0,
  scheduled_days int default 0,
  learning_steps int default 0,
  reps int default 0,
  lapses int default 0,
  state int default 0,
  last_review timestamptz,
  unique(song_id, word_index)
);

alter table songs enable row level security;
alter table song_word_srs enable row level security;
