-- Social posts in spoken Palestinian Arabic for /feed (X first). Text only, small.
-- translit, he and glosses are automatic (Gemini), never verified nikud.
-- Rollback: drop table feed_posts;
create table if not exists feed_posts (
  id uuid primary key default gen_random_uuid(),
  platform text not null default 'x',
  post_id text not null,
  author text not null,
  author_name text,
  url text,
  posted_at timestamptz,
  ar text not null,
  translit text,
  he text,
  glosses jsonb not null default '{}'::jsonb,
  source text,
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  unique (platform, post_id)
);
create index if not exists feed_posts_posted_at on feed_posts (posted_at desc);
alter table feed_posts enable row level security;
