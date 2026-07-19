@AGENTS.md

## Session start checklist

At the start of every session, before doing anything else:
1. Run: `SELECT id, body, tag, created_at FROM notes WHERE status = 'open' ORDER BY created_at DESC`
2. Address or triage each open משימה in your first reply — fix inline if straightforward, otherwise acknowledge and ask for priority.

---

## Playwright — mandatory for interactive flows

Before reporting any change to an interactive flow (inbox import, review, recordings) as done:

1. Ensure the dev server is running (`npm run dev`).
2. Run: `npx playwright test`
3. All tests must pass. Fix the code if they don't — never skip or comment out a test.

**Test fixture:** `tests/fixtures/wa-test.zip` is a minimal WhatsApp export with two WAV
silence clips and a `_chat.txt` that includes the `‎` LRM prefix on attachment lines.
Regenerate it with `npx tsx scripts/gen-wa-fixture.ts` if needed.

**Writing new tests:** when adding a new interactive flow, add a corresponding spec under
`tests/e2e/`. Use `login()` from `tests/e2e/helpers.ts` for auth; target FileDropZone file
inputs with `input[accept="..."]` and `setInputFiles()`.

---

## Migrations — your job, not the user's

Never ask the user to paste SQL into the Supabase dashboard.

After creating a new `.sql` file under `supabase/migrations/`:
1. Run: `npx tsx scripts/migrate.ts`
2. Confirm the output shows `apply 00XX_...sql` (or `already up to date` on a re-run).
3. Commit both the migration file and any code that depends on the new schema together.

**Setup (one-time, already done for existing migrations):**
`DATABASE_URL` must be set in `.env.local`. If it's missing:
- Supabase Dashboard → your project → **Project Settings → Database**
- Under **Connection string**, select the **Direct** tab (not Transaction/Session pooler)
- Copy the URI: `postgresql://postgres:[password]@db.tpksmcxysqjanxwvtbow.supabase.co:5432/postgres`
- Add to `.env.local`: `DATABASE_URL=postgresql://postgres:[your-db-password]@db.tpksmcxysqjanxwvtbow.supabase.co:5432/postgres`
- The DB password is separate from the service-role key — it's the password set when the project was created (or reset in Settings → Database → Reset database password).
