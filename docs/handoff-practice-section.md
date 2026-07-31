# Handoff: תרגול section — picture naming + Arabic letter recognition

Build in stages. **Do not start a stage before the previous one is committed and verified.**
Each stage is independently shippable. If you disagree with a design decision here, say so
before implementing — do not silently substitute a different design.

---

## Context

Read `CLAUDE.md` and `AGENTS.md` first. Non-negotiables from them:

- Next.js version in `node_modules/next/dist/docs/` differs from training data — read the docs
  before writing route/page code.
- Migrations: create `supabase/migrations/00XX_*.sql`, then run `npx tsx scripts/migrate.ts`.
  Never ask the user to run SQL by hand. Commit migration + dependent code together.
- Scripts need `createClient(url, key, { auth: { persistSession: false }, realtime: { transport: class {} as any } })`
  and `SUPABASE_URL` (not `NEXT_PUBLIC_*`), with `config({ path: ".env.local" })`.
- `npx playwright test` must pass before any interactive flow is called done.

### Design rationale (so you don't "improve" these away)

Both features are deliberately **separate from the FSRS daily review** at `/review`:

- FSRS schedules one form-meaning pair. These drills measure different competencies
  (unprompted production; glyph decoding). One queue for three competencies measures nothing.
- Free enumeration produces partial, messy evidence that FSRS ratings can't represent.
- `/review` is the user's daily habit. A five-minute talking exercise inside it makes the whole
  thing skippable.

Evidence flows **one direction only, and it is read-only**: the drills *read* FSRS state and
`cards.self_score` to choose what to show. They **never write to either**. FSRS never schedules
the drills.

### Reversibility — a hard requirement

Everything in this spec must be **purely additive**. The user needs to be able to delete both
features and end up with today's database, byte for byte, in the columns that matter.

Concretely, that means:

- **No writes to `card_srs`, `review_log`, or `cards.self_score`** from either drill. Not one.
  If a design seems to need it, stop and ask — do not compromise.
- New tables only. No destructive alterations to existing tables.
- The one column added to an existing table (`picture_hotzones.card_id`) is nullable and
  additive.
- A full rollback is: `drop table allograph_srs, picture_attempts;`
  `alter table picture_hotzones drop column card_id;` plus deleting the new routes. Nothing else.

Write that rollback into the migration files as a comment so it stays true.

The drills should absolutely *use* every signal available — `cards.self_score`,
`card_srs.state`, `review_log` history are all fair game as **inputs**. Reading is encouraged.
Writing is forbidden.

---

## Stage 0 — data trust (prerequisite for Stage 3)

**Problem:** `supabase/migrations/0019_chatifai_verified.sql` added `cards.chatifai_verified`,
but nothing ever writes it. All 606 cards are `false`. Meanwhile `scripts/apply-arabic-batch.ts`
wrote 391 `arabic_script` values without ever setting the flag. There is currently no way to
know which Arabic spellings were checked.

Stage 3 teaches letter shapes *from* `arabic_script`. A wrong spelling teaches a wrong letter,
and the user cannot self-detect this — failing to recognize a glyph is the expected state.

**Scope: `item_type = 'word'` only.** Phrases and sentences are explicitly out of scope
(they are also only 17/124 and 2/91 covered — a separate project).

### Tasks

1. Fix `scripts/apply-arabic-batch.ts` to set `chatifai_verified: true` in the same
   `update()` as `arabic_script`. The flag must never again be settable independently of the work.
2. Write `scripts/find-dirty-arabic.ts` — report words whose `arabic_script`:
   - contains characters outside `[؀-ۿ\s]` (expect ~2)
   - contains harakat `[ً-ْٰ]` (expect ~2 — decide with the user: strip or keep)
   - is multi-word when `item_type = 'word'` (expect ~5)
3. Re-validate all 391 words through the **chatifai agent**, in batches of 25, setting
   `chatifai_verified = true` on confirmed rows. Where chatifai disagrees with the stored
   spelling, **do not auto-overwrite** — write the disagreements to a report file and stop for
   user review.

**Done when:** `select count(*) from cards where item_type='word' and chatifai_verified` returns
391, or the shortfall is an explicit list of rows the user has seen.

---

## Stage 1 — `/practice` hub

Small stage. Do it before Stages 2 and 3 so both have somewhere to live.

- New route `/practice`. Hebrew label **תרגול** (add `strings.nav.practice`).
- Hub page: a card grid linking to `/picture-game`, `/letters`, `/numbers`.
  Each card: title, one-line description, and a progress line where cheap to compute.
- `components/NavBar.tsx`: replace the `/picture-game` entry with `/practice`.
  Do not add `/letters` or `/numbers` to the nav — they are reached via the hub.

**Do not move or rename existing routes.** `/picture-game` and `/numbers` stay where they are.
Renaming is churn with no user benefit.

Note: `/numbers` exists and works but is currently unreachable from the nav. The hub fixes that.

---

## Stage 2 — picture game rewrite ("אנא שאיֵף" mode)

### What exists

- `app/picture-game/page.tsx` — scene list. Keep.
- `app/picture-game/[id]/page.tsx` — **the game. Rewrite this.**
- `app/picture-game/admin/` — scene + hotzone editor. Extend.
- `supabase/migrations/0015_picture_game.sql` — `picture_scenes`, `picture_hotzones`.
  Schema is good; one column to add.

### The problem with the current game

It shows a word and asks the user to click the matching region. That is recognition with a
spatial answer — the easiest and least durable format. The research the user and I reviewed is
consistent that unprompted recall beats recognition, and that speaking aloud produces the
largest memory gains of any response mode.

### The correct format

Modeled on how the user's actual teacher runs this exercise: show the picture, and the learner
free-associates aloud in a sentence frame — *"אנא שאיֵף... ולדֵין, בֵּית, סַיַּארַה, דַלוּ..."* —
naming everything they can, unprompted.

The hotzones stop being click targets and become the **answer key**.

### Flow

1. Show the scene image. Frame prompt at top: **אנא שאיֵף…** No word list, no hints, no timer.
2. User speaks aloud freely. The app does not listen — no speech recognition, no microphone.
   This is deliberate: self-report is sufficient and STT for dialect Arabic is not viable here.
3. Button: **סיימתי**.
4. Reveal: every hotzone pinned on the image at its `x_pct`/`y_pct`, each showing
   `translit` + `label_he` (+ `label_ar`).
5. User taps the ones they **did not say or did not know**. Default state is "I said it" —
   marking is for misses only, so a good round needs zero taps.
6. Submit → persist misses (below), then a summary: `named X of Y`.

### Schema change

New migration, two additive changes:

1. Add `card_id uuid references cards(id) on delete set null` to `picture_hotzones` (nullable).
   Today the labels are free text with no link to the 546 cards. This link is **read-only** —
   it exists so the reveal screen can show the card's `notes`/`plural_form`, and so a future
   feature could use it. Nothing in this spec writes to the linked card.

2. New table `picture_attempts`:

```sql
create table picture_attempts (
  id            uuid primary key default gen_random_uuid(),
  scene_id      uuid references picture_scenes(id) on delete cascade,
  played_at     timestamptz default now(),
  total_count   int not null,
  named_count   int not null,
  missed_ids    jsonb not null default '[]'::jsonb  -- array of picture_hotzones.id
);
```

### Persistence and progress

On submit, insert one `picture_attempts` row. That is the only write.

This gives between-session memory without touching FSRS at all. Use it for:

- **Scene list** (`app/picture-game/page.tsx`): per scene, show last played and best
  `named_count / total_count`.
- **Reveal screen**: mark hotzones the user missed on their *previous* attempt at this scene, so
  repeat misses are visible. Query the most recent `picture_attempts` row for the scene.
- **Hub card**: total scenes played, best score trend.

Do **not** write `self_score`, `card_srs`, or `review_log`. The linked card is never modified.

### Admin

Extend `app/picture-game/admin/PictureGameAdmin.tsx`: when editing a hotzone, allow searching
cards (reuse `/api/cards/search`) and linking one, setting `card_id`. Show clearly when a
hotzone is unlinked.

### Content

The user has a car-wash scene image (family washing a car outside a house). Ask them for it,
upload via the existing admin flow, and author hotzones for it as the first scene —
including `ولاد` (וְלַאד, ילדים) and `بيت` (בֵּית, בית), which already exist as cards and should
be linked via `card_id`.

Concrete, everyday, visually busy scenes are the right content type. Abstract vocabulary does
not picturize and should not be forced into this feature.

---

## Stage 3 — letter recognition drill (`/letters`)

The largest stage. Consider splitting the commit: segmentation lib + tests first, then schema,
then UI.

### Core idea: the SRS unit is the *allograph*, not the letter

An Arabic letter renders differently by position — `ع` is `عـ` initially, `ـعـ` medially,
`ـع` finally. For letters like `ع` and `ه` the medial form barely resembles the isolated one.
Knowing all 28 isolated letters does not let you read a single word.

So each schedulable unit is a `(letter, position)` pair — roughly 100 units:
- 22 connecting letters × 4 positions = 88
- 6 non-connectors × 2 positions = 12

Units are **not** drilled in isolation. The user is shown a real word from their own vocabulary
and taps the glyphs they could not identify; every glyph in the word yields one graded data
point. One word ≈ 5–7 data points.

### 3a. Segmentation library — `lib/arabic-letters.ts`

**Get this exactly right. Everything downstream is garbage if it's wrong. Unit-test it.**

Letters that do **not** connect to the following letter:

```
ا أ إ آ د ذ ر ز و ؤ ة ى ء
```

Everything else connects forward.

For each letter at index `i` in a word (after stripping harakat, tatweel `ـ`, and non-Arabic):

```
prevJoins = i > 0 && connectsForward(letters[i-1])
hasNext   = i < letters.length - 1

if (!connectsForward(letters[i])) {
  // this letter itself never joins leftward, so only two forms are possible
  position = prevJoins ? "final" : "isolated"
} else if (prevJoins  && hasNext)  position = "medial"
  else if (prevJoins  && !hasNext) position = "final"
  else if (!prevJoins && hasNext)  position = "initial"
  else                             position = "isolated"
```

Notes:
- The inventory must cover **34 glyphs**, not 28 — the base alphabet plus `ة ى أ إ ؤ ئ`.
  Real data uses all of them. `ئ` is a normal connector (all four forms); `ة` and `ى` are
  final/isolated only.
- `لا` (lam-alef) renders as a ligature. Treat it as two letters (`ل` then `ا`) for grading.
  Acceptable simplification; note it in a comment.
- Export the rendered glyph for a `(letter, position)` pair so the UI can display units.

Test against real values from the DB: `كلب` `بيت` `مرحبا` `ولاد` `حكومة` `عالي` `قميص`.

### 3b. Schema

New migration `allograph_srs`: `letter` (text), `position` (text, one of
isolated/initial/medial/final), FSRS columns mirroring `card_srs` (`due`, `stability`,
`difficulty`, `elapsed_days`, `scheduled_days`, `learning_steps`, `reps`, `lapses`, `state`,
`last_review`), unique on `(letter, position)`.

Seed all valid pairs (~100) in the migration, generated from the same non-connector list.

Reuse `lib/fsrs.ts` — do not write a second scheduler.

### 3c. Queue — `app/api/letters/queue/route.ts`

1. Load `allograph_srs` rows with `due <= now`, weakest first.
2. Candidate words: `cards` where `item_type = 'word'` **and `chatifai_verified = true`**
   and `arabic_script` is not null. (This is why Stage 0 comes first. If Stage 0 is incomplete,
   fall back to `arabic_script is not null` but log a warning — do not silently drill unverified
   spellings.)
3. Segment each candidate, then greedily pick words covering the most due allographs —
   a simple set-cover. Return ~20 words per session with their segmentations.

Do not randomize beyond tie-breaking.

#### Word familiarity — the secondary sort

Allograph coverage is the primary ranking. **Familiarity is the tie-breaker**, and it matters
because of a confound: if the user doesn't know the word, a failure is ambiguous — did they fail
to decode the glyph, or fail to recall the word? Only well-known words give a clean read on the
glyph.

Compute a familiarity tier per candidate word, read-only, from data that already exists:

| tier | condition |
|---|---|
| `known` | `card_srs.state = 2` (Review) **or** `cards.self_score` in (3, 4) |
| `neutral` | `cards.self_score is null` and card is New |
| `weak` | `cards.self_score = 1` ("שוב" in `/browse`) or `= 2`, or `card_srs.lapses > 2` |

Then bias selection by how well the drill is going overall — call it the mastery ratio
(allographs in FSRS state Review ÷ total allographs):

- **ratio < 0.3 (early):** prefer `known` words heavily. The user is learning glyphs; the
  vocabulary should be free.
- **ratio 0.3–0.7:** `known` and `neutral` equally.
- **ratio > 0.7 (late):** allow `weak` words in. At this point decoding is solid enough that a
  failure is attributable, and the drill doubles as vocabulary exposure — which is what the user
  explicitly wants ("learn the letters through words I marked שוב, or haven't labeled yet").

Expose this as a simple UI toggle too — **מילים שאני יודע** / **הכל** — defaulting to whatever
the ratio implies. If the user disagrees with the automatic bias they can override it per session.

This is a read-only use of `self_score` and `card_srs`. Nothing is written back.

### 3d. Grading — `app/api/letters/review/route.ts`

Request: word's `card_id` plus the indices of glyphs the user tapped.
- tapped → `Rating.Again` for that allograph
- untapped → `Rating.Good`

Apply FSRS per allograph. One word submit updates 5–7 rows.

### 3e. UI — `app/letters/page.tsx`

- Show the word large in Arabic script, glyphs individually tappable, plus `translit_nikud`
  and `hebrew_meaning` underneath (the user already knows these words — this drill is about
  the script, not the meaning).
- Tapping a glyph marks it "didn't recognize" (visually distinct, toggleable).
- Submit → per-glyph reveal: which letter each glyph is, its name, and its Hebrew equivalent.
- Session summary listing weakest allographs.

#### Progress view — `/letters/progress`

The user specifically asked to see progress across sessions. The ~100 allographs are a small
enough set to show all at once:

- A grid of all allographs, grouped by letter (rows) × position (columns), each cell rendering
  the actual glyph shape.
- Colour each cell by FSRS state: New (grey), Learning/Relearning (orange), Review (green),
  shaded by `stability` so "barely known" and "solid" are distinguishable.
- Headline number: mastered ÷ total. This is the same mastery ratio the queue uses for
  familiarity biasing — compute it once, share it.

This is the payoff of allographs being the unit: "I know 61 of 100 letter shapes" is a
legible, finite goal in a way "I know 391 words" never is.

**Dialect handling — do not skip this.** Four letters have no single Hebrew equivalent in
Jerusalem/Jaffa dialect:

| letter | Hebrew equivalent |
|---|---|
| ث | ס (urban) / ת דגושה / ת רפויה (rural, Bedouin) |
| ذ | ד / ז / ד רפויה (rural, Bedouin) |
| ظ | ז נחצית / צ׳ |
| ق | ק (rural) / א (urban) / ג (Bedouin) |

The drill grades **letter identification only** ("which letter is this glyph?"), never
sound-mapping. On reveal, show all variants for these four. Grading a single "correct" sound
would teach the user something false about how the dialect is actually spoken.

Also worth surfacing on reveal: `ج` is `ג׳` in this dialect (as in מַגְ׳נוּן), not `ז`.

### Confusable clusters

Useful for the reveal screen and for tie-breaking word selection — these are the pairs that
actually get confused, differing only in dots or dot count:

```
ب ت ث ن ي   ج ح خ   د ذ   ر ز   س ش   ص ض   ط ظ   ع غ   ف ق
```

---

## Testing

Per `CLAUDE.md`, `npx playwright test` must pass. Add coverage for:

- **Segmentation unit tests** (Stage 3a) — the highest-value tests here. Assert exact
  `(letter, position)` sequences for the real words listed above, including the non-connector
  cases (`ولاد`: `و` is isolated, `ل` is **initial** not medial because `و` doesn't join forward,
  `ا` is final, `د` is final).
- Picture game: reveal shows all hotzones; submitting writes exactly one `picture_attempts` row
  with the correct `missed_ids`; a second attempt at the same scene surfaces the previous
  attempt's misses.
- **Reversibility guard:** assert that a full picture-game session and a full letters session
  leave `cards.self_score`, `card_srs`, and `review_log` completely unchanged. This is the test
  that protects the constraint — write it first and make it fail before the features exist.
- `/practice` hub renders and links resolve.

---

## Explicit non-goals

Do not build these. If they seem necessary, stop and ask.

- Speech recognition / microphone input of any kind.
- **Any write to `card_srs`, `review_log`, or `cards.self_score` from either drill.** Reading
  them is required; writing them is forbidden. See the reversibility section.
- Destructive migrations. Additive only.
- Handwriting or letter-tracing practice.
- Moving or renaming `/picture-game`, `/numbers`, or `/inflections`.
- Extending Arabic script coverage to phrases or sentences.
- Touching the `/inflections` rebuild — separate project, separate spec.
- Auto-overwriting any `arabic_script` value on chatifai disagreement (Stage 0). Report and stop.
