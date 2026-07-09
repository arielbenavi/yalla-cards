-- Adds batch_id FK to cards so each card knows which import batch created it.
-- ON DELETE SET NULL so deleting a batch doesn't cascade-wipe cards.
alter table cards
  add column if not exists batch_id uuid references import_batches(id) on delete set null;

create index if not exists cards_batch_id_idx on cards (batch_id);
