# Handoff: `/inflections` rebuild — possessive suffixes via Processing Instruction

Status: **spec only, not yet started.** Do not begin until the תרגול section
(`docs/handoff-practice-section.md`) is merged — both touch `components/NavBar.tsx`,
`lib/strings.ts`, and the migration sequence.

Same ground rules as the practice spec: read `CLAUDE.md` and `AGENTS.md`; read
`node_modules/next/dist/docs/` before route code; migrations via `npx tsx scripts/migrate.ts`;
`npx playwright test` must pass. Additive and reversible — rollback stated at the bottom.

---

## Why this is a rebuild and not a fix

The screen exists (`app/inflections/page.tsx`, 407 lines, 70 verbs, 210 `conjugation_srs` rows)
and the user's verdict is "לא טוב." Five concrete reasons, found by reading the code:

1. **It's not about the same grammar as the user's spec.** The screen drills *verb conjugation*
   (بكتب / بتكتب / بيكتب). The user's design note `04cff308` describes *possessive suffixes on
   nouns* — بيته vs بيتها, "his house" vs "her house". Different structure entirely.

2. **Everything is in Arabic script with no transliteration.** `forms` holds only Arabic, and
   `PRONOUN_AR` renders pronouns as أنا / إنت / هو. The entire rest of the app is
   Hebrew-transliteration-mediated, and the user is only now learning to decode the script (see
   the `/letters` drill). **This alone likely explains most of the "לא טוב".** He is being shown
   content he cannot read.

3. **The recognition track doesn't test inflection.** `buildRecognitionChoices()` builds
   distractors from *other verbs'* `meaning_he`. So the question is "which verb is this?", not
   "which person?" It's a vocabulary quiz wearing an inflection costume.

4. **The audio track has no audio.** `buildAudioChoices()` builds text options; nothing in
   `app/api/inflections/queue/route.ts` returns a clip path or TTS. The "שמע" track is a text
   task with a misleading label.

5. **`pickPronoun()` is uniform random**, so there's no progression and no contrast structure —
   the learner never sees the same minimal pair twice in a row, which is the one thing that
   would teach the distinction.

Also worth knowing: the `paradigms` table (migration `0017`) holds good reference material —
prepositions, dual, feminine endings, رشمبا, أخو-inflection — and **nothing reads it.** It is
dead data today. This rebuild should surface it.

---

## The pedagogy: Processing Instruction (VanPatten)

The user's note specifies a three-stage design. It maps onto a real, well-supported SLA
methodology, and the research adds design constraints worth honouring.

**The Lexical Preference Principle:** learners process lexical items for meaning *before* they
process grammatical markers. If a sentence contains any other cue to the meaning, the learner
uses that cue and never processes the morpheme. Structured input must therefore **raise the
communicative value** of the target form by stripping redundant cues.

The user already wrote this into his note — *"בלי רמז מגדר אחר במשפט!"* — before knowing the
term. Honour it strictly; it is the single most important rule here.

Other design rules from the literature:

- **Progress non-paradigmatically.** Do not show or drill the full eight-person paradigm at
  once. One contrast at a time.
- **Sentences before connected discourse.** Start with isolated sentences, graduate to short
  descriptions.
- **Two activity types:** *referential* (one correct interpretation, gradeable) and *affective*
  (learner reacts — is this true of you? — not gradeable, but keeps meaning in focus).
- **Input stages must stay input.** No production in stages 1 and 2.

One moderating finding, so this isn't oversold: well-designed **output** activities that also
raise communicative value produce gains comparable to PI. So the user's stage 3 (typed
production) is legitimate and should not be dropped in favour of pure input. The order is what
matters.

---

## Content scope

**Possessive suffixes on nouns, first.** Not verbs. Leave `verb_conjugations` and
`conjugation_srs` in place and untouched — the old drill can stay reachable during the
transition, and deleting it is a separate decision for the user.

The core paradigm (from `paradigms` meeting 3, `akh_inflection`, plus standard forms):

| person | suffix | example (بيت / בֵּית, house) |
|---|---|---|
| my | ־ִי | בֵּיתִי |
| your (m) | ־ַכּ | בֵּיתַכּ |
| your (f) | ־ֵכּ | בֵּיתֵכּ |
| his | ־וֹ | בֵּיתוֹ |
| her | ־ְהַא | בֵּיתְהַא |
| our | ־נַא | בֵּיתְנַא |
| your (pl) | ־כֹּם | בֵּיתְכֹּם |
| their | ־הֹם | בֵּיתְהֹם |

Special base classes already documented in `paradigms`:
- Nouns ending in a vowel take the أخو- pattern: أب→أبو-, أخ→أخو-, على→علي-.
- Feminine ة becomes ت before a suffix (شقة → شقتي).

**Every form must carry Hebrew transliteration with nikud as the primary display**, with Arabic
script secondary. This is the fix for problem #2 above and is non-negotiable.

Source the noun set from `cards` where `item_type = 'word'` — the user already knows these words,
which keeps the vocabulary free and the attention on the morpheme. Validate all generated forms
through the **chatifai agent** before seeding; do not invent inflected forms.

### Second content set: demonstratives (note `5774ff07`)

Open note `5774ff07` asks for practice on هاي / هاد / هاداك / هاذيك / هدول
(האי / האד / האדאכ / האדיכ / הדול) — this/that/these, by gender and distance.

**Do not build a separate screen for it.** It is structurally identical to possessive suffixes:
a small closed set of forms distinguished by gender and one other dimension (here proximity
rather than person), where the learner's failure mode is exactly the Lexical Preference
Principle — using context to guess instead of processing the form.

It drops into the same three stages with no schema change beyond widening the `person` column to
a generic `feature` (e.g. `this_m`, `that_f`, `these`). Contrast progression:
`near/far same gender` → `m/f at same distance` → `singular/plural`.

Ship possessives first, demonstratives second, same machinery. Closing two notes with one build.

---

## The three stages

### Stage 1 — identification (referential structured input, **graded**)

Two short sentences differing **only** in the possessive suffix. Learner picks which one matches
a given meaning. No other gender or number cue anywhere in either sentence.

> Which one means *her house is big*?
> א) בֵּיתוֹ כְּבִּיר   ב) בֵּיתְהַא כְּבִּיר

Rules:
- Exactly one morpheme differs between options.
- No pronoun, no name, no adjective agreement, nothing else that leaks the answer. If a
  distractor sentence would be disambiguated by anything but the suffix, it's invalid — assert
  this in a test.
- Two options early; three or four only once the contrast is stable.
- Contrast pairs progress in a fixed order, hardest-confusable first:
  `his/her` → `your-m/your-f` → `my/our` → `your-pl/their`.

This is the stage that carries the SRS.

### Stage 2 — assembly (explicit information, **not graded**)

Drag a base noun and a suffix together to build a form; the app shows the result and any base
change (شقة → شقت + ي). One-time discovery per pattern class, exactly as the user's note says
("שלב גילוי חד-פעמי, לא נמדד כשליטה").

Do not schedule it, do not put it in the SRS, do not let failure here affect anything. Track a
simple `seen` boolean per pattern class so it isn't shown repeatedly.

### Stage 3 — production (**graded**, the real SRS)

A sentence with a gap plus the base noun; the learner types the full inflected form.

> ___ כְּבִּיר. (בֵּית — שלה)  →  expects בֵּיתְהַא

Per the user's note, prompt him to **say it aloud before typing** — speaking aloud produces the
largest memory gains of any response mode, and it costs one line of UI text.

Grading: compare on a normalised form — strip nikud, collapse whitespace — so a missing dot
doesn't fail a correct answer. Show the fully-vocalised expected form on reveal regardless.

**Stage 3 is only unlocked for a contrast pair once its Stage 1 row reaches FSRS state Review.**
That ordering is the whole point of the method; enforce it in the queue, not just the UI.

---

## Schema

New migration, additive:

```sql
create table inflection_items (
  id          uuid primary key default gen_random_uuid(),
  base_card_id uuid references cards(id) on delete set null,  -- the noun, read-only link
  base_translit text not null,        -- בֵּית
  base_arabic   text,                 -- بيت
  person      text not null,          -- my | your_m | your_f | his | her | our | your_pl | their
  form_translit text not null,        -- בֵּיתְהַא
  form_arabic   text,                 -- بيتها
  pattern_class text not null,        -- regular | vowel_final | ta_marbuta
  chatifai_verified boolean default false
);

create table inflection_srs (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid references inflection_items(id) on delete cascade,
  stage       text not null check (stage in ('identify','produce')),
  -- FSRS columns, same layout as card_srs
  due timestamptz default now(), stability float default 0, difficulty float default 0,
  elapsed_days int default 0, scheduled_days int default 0, learning_steps int default 0,
  reps int default 0, lapses int default 0, state smallint default 0, last_review timestamptz,
  unique (item_id, stage)
);

create table inflection_patterns_seen (
  pattern_class text primary key,
  seen_at timestamptz default now()
);
```

Reuse `lib/fsrs.ts`. Two stages per item, mirroring how `conjugation_srs` uses tracks — that
part of the old design was sound.

Rollback: `drop table inflection_items, inflection_srs, inflection_patterns_seen;` plus reverting
the routes. Nothing existing is modified.

---

## Routes

- `app/api/inflections/v2/queue/route.ts` — returns identify items due, plus produce items whose
  identify row is in state Review. Ordered by contrast-pair progression, not random.
- `app/api/inflections/v2/review/route.ts` — grades via `scheduleReview` from `lib/fsrs.ts`.
- `app/inflections/page.tsx` — rebuild. Keep the old routes intact until the user confirms the
  new one is better.

Surface the `paradigms` table as a reference tab on this screen — it's good content that
currently nothing reads.

---

## Testing

- **Minimal-pair validity:** for every generated Stage 1 question, assert the two option
  sentences differ in exactly one token and that the differing token is the target morpheme.
  This is the test that protects the pedagogy.
- Stage 3 does not appear for a contrast pair whose Stage 1 row is not yet in state Review.
- Normalisation: `בֵּיתְהַא` and `ביתהא` both grade correct.
- Stage 2 never writes to `inflection_srs`.

---

## Non-goals

- Do not delete or migrate `verb_conjugations` / `conjugation_srs`. Separate decision.
- Do not add verb conjugation to the new system yet — nouns first, per the user's note
  ("בניין ראשון במלואו לפני בניינים אחרים" — one paradigm fully before the next).
- No audio track until there is actual audio. If an audio stage is wanted later, it needs real
  clips, not text options labelled "שמע".
- No writes to `cards`, `card_srs`, or `review_log`.
