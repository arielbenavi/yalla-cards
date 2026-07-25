@AGENTS.md

## Session start

Run this first, address open items before anything else:
```sql
SELECT id, body, tag, created_at FROM notes WHERE status = 'open' ORDER BY created_at DESC
```

---

## Testing — mandatory for interactive flows

Before marking any change to inbox import, review, or recordings as done:
```
npx playwright test   # all must pass; never skip/comment out
```
Fixture: `tests/fixtures/wa-test.zip`. Regenerate: `npx tsx scripts/gen-wa-fixture.ts`.

---

## FSRS review queue (`app/api/review/queue/route.ts`)

- **Daily (default):** due cards + new cards up to `newCardsPerDay` (12)
- **`mode=all`:** everything, `ORDER BY due ASC`
- **`mode=selected`:** specific IDs, shuffled

**Don't randomize new cards.** `ORDER BY due ASC` = insertion order = lesson progression. This is intentional.

**Easy-today filter:** exclude `card_srs_id`s where `review_log.rating = Rating.Easy AND reviewed_at >= today`. Prevents same-day re-review of cards already called Easy (in any mode).

---

## Scripts (`scripts/*.ts`)

Node 20 + supabase-js requires:
```ts
createClient(url, key, { auth: { persistSession: false }, realtime: { transport: class {} as any } })
```
Use `SUPABASE_URL` (not `NEXT_PUBLIC_...`). Load env: `config({ path: ".env.local" })`.

---

## PostgREST `.or()` with spaces

Spaces in LIKE patterns break PostgREST when passed as one `.or()` string. Fix: split query on whitespace, chain multiple `.or()` calls. See `app/api/browse/route.ts`.

---

## Migrations

Never ask the user to run SQL manually. After creating `supabase/migrations/00XX_....sql`:
```
npx tsx scripts/migrate.ts
```
Commit migration + dependent code together.
