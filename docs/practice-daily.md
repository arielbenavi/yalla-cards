# תרגול יומי: one button, about 10 minutes

Spec for the executor (Sonnet). Written 2026-11-11 by Opus; approved by Ariel ("כן, תכתוב").

## Why

Ariel, 10.11: "בכללי משהו בתרגול לא עובד לי". Asked what, he said "גם וגם":
1. **He doesn't know what to practise.** The תרגול tab is a list of eight drills and games, so every visit starts with a choice.
2. **The drills are boring.** Each drill is one long run of a single kind of question (20 inflection cells, then 20 sentences).

The daily review works because it is one button that decides for him and then ends. This copies that shape.

## What to build

### 1. A "תרגול יומי" card at the top of `/practice`

- It is a large card above everything else, with a subtitle like "10 דק' · מפגש 8".
- Once today's session is done, it shows "✓ סיימת להיום" and the streak ("4 ימים ברצף"). Tapping it again starts a fresh session.
- The current list stays below it under the heading **"תרגול חופשי"**. The existing status cards (🔁 / 💬, "לפני N ימים") are replaced by this one card, since it covers both.

### 2. The session: `/practice/daily`

A session is a sequence of **short rounds**, each one kind, ≤ 2 minutes. They alternate:

| # | Round | Source (existing API) | Size |
|---|---|---|---|
| 1 | Inflection: one table from the current meeting | `/api/inflection-drill`, group `מפגש {current}` | 1 table |
| 2 | Translate he→ar | `/api/translation-drill`, current meeting, else the newest meeting that has sentences | 3 sentences |
| 3 | Inflection: a table from an earlier meeting | same, random older group, or a verb topic | 1 table |
| 4 | Translate ar→he | same | 3 sentences |
| 5 | Dialogue: one short stored dialogue | `/api/dialogues` (verified only) | 1 |

- **Choosing items:** prefer the ones not seen for the longest. Keep a light log (below) and pick the least-recently-practised table or sentence. Ties go random.
- **Progress:** a thin bar on top showing rounds done out of 5. Between rounds, show a one-line card ("עכשיו: תרגום לערבית") for about 1 second, or until tapped.
- **End screen:** "סיימת ✓", the streak, how many were right, and two buttons: "עוד סבב" and "סיום". "עוד סבב" adds rounds 1–2 again with new items.
- **Leaving mid-session** keeps nothing to resume. It is short enough to start over.

### 3. Less boring, inside the rounds

- **Say it before you see it (translation rounds):** show the prompt, and Ariel says the answer out loud. "הצג תשובה" reveals it, then he grades himself with "ידעתי" or "לא ידעתי". There is no typing and no speech recognition in v1.
- **Hear the answer:** after the reveal, play audio if there is any:
  - a card whose `arabic_script` equals the sentence has a `clip_path` from class (Ronen), or
  - an existing TTS route, if one exists. Check before adding one, and don't build TTS in this task.
  - With neither, show no speaker button.
- **Inflection rounds:** reuse the existing drill component in a "single table" mode if it has one; otherwise add a prop. Don't fork it.
- **Dialogue round:** reuse `/simulate`'s dialogue walker, embedded, ending on its last line.

## Data

New table, new migration (`supabase/migrations/00XX_practice_daily.sql`, then `npx tsx scripts/migrate.ts`):

```sql
-- Rollback: drop table practice_daily_log;
create table if not exists practice_daily_log (
  id uuid primary key default gen_random_uuid(),
  day date not null,                 -- Asia/Jerusalem day, like daily_practice
  round text not null,               -- 'inflection' | 'translate_he_ar' | 'translate_ar_he' | 'dialogue'
  item_id text not null,             -- drill set id / sentence key / dialogue key
  correct boolean,                   -- self-grade; null for inflection tables and dialogues
  created_at timestamptz not null default now()
);
create index if not exists practice_daily_log_item_idx on practice_daily_log (item_id, created_at desc);
alter table practice_daily_log enable row level security;
```

- When the session ends, also write the existing `daily_practice` marks (`inflections`, `conversation`), so the red dot on the tab and `/api/practice-status` keep working unchanged.
- The streak = consecutive days with at least one completed session (`round = 'session_done'` row, `item_id = ''`).

## Hard rules

- **Never write to `card_srs`, `review_log`, or `cards`.** This reads cards only, for their audio.
- New table only; no change to existing tables.
- Hebrew UI, RTL, and the same look as `/practice`: rounded-2xl borders, phone first, 390px wide.
- Don't randomise inside a table; the drill already shuffles tiles.

## Tests (`tests/e2e/practice-daily.spec.ts`), must pass with `npx playwright test`

1. `/practice` shows the תרגול יומי card first, and "תרגול חופשי" below it with the old list.
2. A full session with mocked APIs (`page.route`) walks 5 rounds in order, shows the progress bar, and ends on "סיימת". Check that the end posts to the log endpoint and that `daily_practice` gets both marks.
3. After a finished session, `/practice` shows "סיימת להיום" and a streak ≥ 1.
4. A translation round: the answer is hidden until "הצג תשובה", the speaker shows only when the mock gives a clip, and the self-grade is logged.
5. No request in the session goes to `/api/card-srs` or `/api/review` (assert with `page.on("request")`).

Don't use `waitForLoadState("networkidle")`. Login lands on the review, whose deck download keeps the network busy, so wait for elements instead.

## Done when

- The tests above pass along with the whole suite.
- `docs/STATE.md` has a Done line, and the open idea note about practice ("בכללי משהו בתרגול…") is closed with a pointer here.
- The work is committed and pushed (Node 20; the pre-push hook runs `next build`).

## Not in v1 (ideas for later, don't build)

- Speech recognition grading.
- Adding cards from inside a session.
- Picture game, numbers or letters as rounds. They stay in תרגול חופשי.
- A per-day time budget setting.
