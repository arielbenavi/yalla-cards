-- feed_posts keeps one entry per word, [{ar, t, he}] (Arabic, transliteration, meaning here), not a gloss map.
-- Rollback: alter table feed_posts rename column words to glosses;
alter table feed_posts rename column glosses to words;
