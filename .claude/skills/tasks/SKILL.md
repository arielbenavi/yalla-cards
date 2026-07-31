---
name: tasks
description: How to work through the yalla-cards משימות (notes table) — survey all open notes together before picking one, close what you finish, and respect the project's content and safety rules. Use at session start, whenever the user asks what is open or what to work on next, and before marking anything done.
---

# Working the משימות list

Ariel should not have to repeat these. They are the standing rules.

## 1. Never look at one note in isolation

Before proposing or starting anything, pull **every** open note and group them by
the feature they touch. Notes written weeks apart routinely describe the same
screen, and several are already done but still open.

```bash
npx tsx scripts/list-open-notes.ts
```

For full bodies (the list script truncates at 80 chars), query directly — see
`scripts/get-note.ts`. Then group by feature, not by date. The last full triage
is `docs/task-inventory-2026-07-31.md`; update it rather than starting a new one.

For each note, work out three things before saying anything:

- **What already exists.** Check the DB and the code first. This repo repeatedly
  turns out to have the feature built already — 15 conversation dialogues sat in
  `paradigms` unused; the recording range editor was built and only needed
  exposing; three notes were closed by work done in earlier sessions.
- **Can it be done without asking?** If yes, do it. Don't present a menu.
- **Is a real decision needed?** Then either research it or write Ariel a
  deep-research prompt he can run — don't ask him a question he'd have to guess at.

## 2. Close what you finish

A finished note gets marked done in the same session, in the same commit as the
work. An open note that is actually done resurfaces at every session start and
wastes the first ten minutes.

```ts
// LIKE against the uuid column does not match in PostgREST.
// Fetch open notes and prefix-match in JS instead.
const { data: open } = await sb.from("notes").select("id").eq("status", "open");
const hit = (open ?? []).find((n) => n.id.startsWith(prefix));
await sb.from("notes").update({ status: "done" }).eq("id", hit.id);
```

`scripts/close-notes-fast-track.ts` is the template. Name the closed notes in the
commit message.

**Read the whole note before closing it.** They often ask for two things and only
one gets built — `c87bcd44` asked for a "תמלל הכל" button *and* for it to run on
every upload; only the button existed, and the note was nearly closed early.

## 3. Verify before you claim

Nothing is done because the code looks right.

- Touching inbox import, review, or recordings → `npx playwright test`, all green.
  This is in CLAUDE.md and it is not optional.
- Changed something visible → screenshot it and look. The verb paradigms loaded
  correctly and the screen still showed pure Arabic script; only a screenshot
  caught that.
- Changed data → query it back and show the before/after.

## 4. Content rules that override convenience

**chatifai is the only authority on Arabic.** Never invent, correct, or "fix"
vocalisation from general Arabic knowledge, and never substitute another model.
Doubtful cells go in a `flags` field with `chatifai_verified = false` until
chatifai rules on them. Composing a scenario or picking which words to ask about
is fine — inventing the Arabic is not. Use the `chatifai` agent.

If chatifai is not logged in, **stop and ask Ariel to log in.** Do not run the
email-verification-code flow in the agent file.

**The chatifai agent has no Bash tool** — only the Chrome tools. Never send it a
script to run or tell it to query the database; it cannot, and the round trip is
wasted. Dump the rows yourself and paste the actual text into the message. Give
it both the transliteration and the Arabic when both need checking, and ask about
transliteration as its own explicit question — left implicit, chatifai answers
only about naturalness and silently alters vocalisation without flagging it.

It also tends to mark a line תקין and then quietly rewrite it in its "polished"
version. Ask for the per-line verdict and the rewrite, and diff them.

**Don't generate study sentences from his vocabulary.** Standing boundary, see
the `project-yalla-cards-scope` memory.

**Drills never write to `card_srs`, `review_log`, or `cards.self_score`.** New
features may read FSRS state, never write it. Tests run against the real
database, so a test must never press a rating button — see
`tests/e2e/review-admin-range.spec.ts` for how to exercise the review screen
without grading.

## 5. Known data hazards

Check these before trusting any count:

- **Card inserts and `card_srs` inserts are separate statements.** A card with no
  `card_srs` row never appears in review, silently. 199 of 820 cards were in that
  state. Same gap for `verb_conjugations` → `conjugation_srs`. When inserting
  content, create the SRS row too, then verify.
- **Seed migrations without `ON CONFLICT` get re-applied.** `0013_seed_verbs.sql`
  ran seven times. `scripts/migrate.ts` now tracks applied migrations.
- **Data in the DB is not necessarily chatifai's.** `paradigms` has no
  verification column, and its dialogues transliterate ض inconsistently while the
  cards table is uniform. Check provenance before putting content in front of the
  learner.

## 6. Writing to the database

Every content script takes a dry run first and `--apply` to write, validates
before touching anything, and prints what it will do. `scripts/write-verb-paradigms.ts`
is the template. Validate that Arabic columns contain no Hebrew characters — that
check has caught corrupted chatifai output three times.

Deletions: check for `review_log` history first and refuse if any exists. Record
what was written so it can be reverted.

Scripts need this client config (Node 20 + supabase-js), and `SUPABASE_URL`, not
`NEXT_PUBLIC_`:

```ts
createClient(url, key, { auth: { persistSession: false }, realtime: { transport: class {} as any } })
```

## 7. Reporting back

Lead with what changed for him and what he has to do himself. Name notes by id.
Say plainly when something is unverified or when you were wrong — he acts on this,
so a hedged claim is worse than no claim. Answer in Hebrew.
