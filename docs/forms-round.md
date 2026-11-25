# סבב צורות (beta): plurals of known words, outside FSRS, as an A/B test

Spec for the executor (Sonnet). Written 2026-11-25 by Opus; approved by Ariel ("כן, תכתוב אפיון").
Notes in `notes`: the two "forms" ideas of 22.11 (a card comes back as masculine / feminine / plural at random).

## Why

Ariel wants each card to come back in a random form. Two constraints:

1. **Not inside the daily review.** FSRS measures recall of one card. If פֻסְתַאן sometimes asks for פַסַאתִין, an "שוב" on the plural lowers the singular's schedule, and the schedule no longer tracks anything real. The project rule says new features may read FSRS state and never write it.
2. **Only forms we have a source for.** 673 of 1,692 word cards have a `plural_form` (from the book or MuFeed). Feminine forms barely exist in the data, and MuFeed has no feminine field. Generating them would mean making up Arabic, which is forbidden. **v1 is plural only.** Feminine waits for a source (chatifai or the book) and is out of scope here.

Ariel also asked whether it actually helps. So it ships as a beta with a control group, and a report answers that after 3 weeks.

## What to build

### 1. Who is eligible

A word is eligible when all of these hold (computed on the server, read-only):
- `cards.item_type = 'word'`, `plural_form` is not empty.
- The plural differs from the singular `translit_nikud` (compare without nikud).
- Its `card_srs` row (`direction = 'he_to_ar'`) has `state = 2` (Review) and `reps >= 2`, so the singular is already known. A word still being learned gets no plural yet.

### 2. The A/B split

- `lib/forms-round.ts` exports `formsGroup(cardId): "A" | "B"`: a stable hash of the card id (for example the first hex digit of the uuid: even → A, odd → B). Nothing is stored. The app and the report use the same function.
- **A** words can enter the forms round. **B** words never do. They are the control.
- `FORMS_ROUND_START = "2026-11-26"` (or the day it ships) in the same file. The report only counts reviews after it.

### 3. The round

- **Offer:** on the review's done screen, after the fix round button, when not already done today (localStorage key, same pattern as `FIX_ROUND_KEY` / `markFixRoundDone` in `mobile/src/App.tsx`): a button **"סבב צורות (בטא): 10 מילים"**. It opens `${store.API_BASE}/forms` exactly as the fix round opens `/focused`, so it works from the iPhone app too.
- **`GET /api/forms-round`:** returns up to 10 group-A eligible words. It prefers the ones never asked in the round, then the ones asked longest ago (from `learning_events`, below), with random tie-breaks. Fields: `card_id`, `translit_nikud`, `arabic_script`, `hebrew_meaning`, `plural_form`.
- **Page `/forms`,** one word at a time, in the review's look (`.tile.card`):
  - Front: the singular transliteration, the Hebrew meaning under it in muted text, and the prompt **"רבים?"**.
  - Ariel says the plural out loud, then taps "הצג תשובה" (space on a computer).
  - Back: the plural, large. Then two buttons, **"ידעתי"** and **"לא ידעתי"** (keys 1 / 2).
  - End screen: "סיימת ✓", N of 10 right, and a button back to the review.
- No audio in v1: the clips are of the singular.

### 4. Logging (no migration)

Use the existing `learning_events` table and `/api/learning-events`. Add these to its `EVENTS` whitelist:
- `forms_round_offered`: meta `{ size }`.
- `forms_round_started`: meta `{ size }`.
- `forms_answer`: `card_id` = the card, meta `{ form: "plural", correct: boolean, group: "A" }`.

The page writes only to `learning_events`, never to `card_srs`, `review_log` or `cards`.

### 5. The report: `scripts/forms-report.ts`

Read-only. It prints:
1. **Did the round help the word itself?** For eligible A words and eligible B words, take the `review_log` rows of their `he_to_ar` card since `FORMS_ROUND_START`. Print per group: the number of reviews, the share rated Again, and the mean stability now. Add a two-proportion z-test on the Again share, and say plainly if there are fewer than about 200 reviews per group: then the answer is "not enough data yet, run it 3 more weeks".
2. **Is he learning the plurals?** From `forms_answer`: accuracy per week, and accuracy on a word's first ask compared with its second ask and later.
3. How many A words were asked at least once, out of how many are eligible.

How to read it, written into the script's header:
- **A has clearly fewer Agains than B:** the extra minute also strengthens the base word. Keep the round, and consider adding feminine once there is a source.
- **No difference, but plural accuracy rises:** it teaches plurals without hurting anything. Keep it if Ariel likes it.
- **Neither:** remove the button and keep the report.

One honest caveat for the header: group A also gets extra exposure to the singular, so a win shows the round is worth its minutes, not that plurals as such are the cause. That is the question Ariel asked.

## Tests

- `tests/e2e/forms-round.spec.ts`: log in, open `/forms`, check that the singular and "רבים?" show, reveal shows the plural, "ידעתי" moves to the next word, and the end screen appears. Mock `/api/forms-round` with 2 words so the test does not depend on the deck.
- Add the forms page to `tests/e2e/reversibility.spec.ts`: a forms session leaves `card_srs` and `review_log` unchanged.
- A unit check that `formsGroup` is stable and splits roughly half and half over the real eligible ids (print the counts in the report too).
- `npx playwright test` passes in full (the review done screen changes).

## Not in v1

- Feminine forms, or present/past for verbs (verbs live in `verb_conjugations`, a later round).
- Hebrew plural prompts ("שמלות → ?"): `hebrew_meaning` is singular, and generating Hebrew plurals by model is a later step.
- Any change to the daily queue or FSRS.

## Done when

The button shows after the daily review, the round runs on the site and in the iPhone app, events land in `learning_events`, the report runs, the tests pass, STATE.md has a "Done" line and a "Next" line saying **run `scripts/forms-report.ts` on about 17.12 and show Ariel**.
