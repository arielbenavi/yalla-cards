-- Server-side helper for /inbox dedup: fuzzy-match a candidate transliteration
-- against existing cards using the same trigram index as translit_normalized.
create or replace function find_similar_cards(query text, threshold float default 0.4)
returns table (id uuid, hebrew_meaning text, translit_nikud text, similarity float)
language sql
stable
as $$
  select
    cards.id,
    cards.hebrew_meaning,
    cards.translit_nikud,
    similarity(cards.translit_normalized, trim(regexp_replace(regexp_replace(query, '[֑-ׇ]', '', 'g'), '\s+', ' ', 'g'))) as similarity
  from cards
  where similarity(cards.translit_normalized, trim(regexp_replace(regexp_replace(query, '[֑-ׇ]', '', 'g'), '\s+', ' ', 'g'))) > threshold
  order by similarity desc
  limit 5;
$$;
