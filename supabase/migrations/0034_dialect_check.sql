-- What outside sources say about a card's Palestinian Arabic (Madrasa, Wiktionary South Levantine),
-- written by scripts/check-palestinian.ts. Separate from chatifai_verified. Rollback: alter table cards drop column dialect_check;
alter table cards add column if not exists dialect_check jsonb;
