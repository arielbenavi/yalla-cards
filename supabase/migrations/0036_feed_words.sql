-- feed_posts keeps one entry per word, [{ar, t, he}] (Arabic, transliteration, meaning here), not a gloss map.
-- Rollback: alter table feed_posts rename column words to glosses;
do $$ begin
  if exists (select 1 from information_schema.columns where table_name = 'feed_posts' and column_name = 'glosses') then
    alter table feed_posts rename column glosses to words;
  end if;
end $$;
