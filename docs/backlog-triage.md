# Backlog triage — open משימות notes

Written by the Opus planning session, 2026-07-26. Updated 2026-07-31.
Covers every open note not already handled by
`docs/handoff-practice-section.md` or `docs/handoff-inflections-rebuild.md`.

## ✅ Done as of 2026-07-31

- **`0000ac3d` daily tip** — implemented. `lib/tips.ts` has 16 tips; shown on `/review`.
  Updated 2026-07-31: added `id:"yaani"` (יַעְנִי as main Palestinian filler) and corrected
  `id:"walla"` (وَالله is a real oath, NOT a casual filler like in Israeli Hebrew).
- **Recordings page** — rewritten: title input on upload, "בתהליך תמלול" badge during
  transcription only, "תמלל הכל (N)" admin button.
- **מפגש בעפ 2** — created (lesson ID `1ec690db-bde3-463b-9c27-888150347a75`), 74 cards
  moved from שיעור 2, 8 missing cards inserted (chatifai_verified=true).
- **Dialogues 3 & 4** — 20+11 Hebrew→Arabic sentences stored in `paradigms` table,
  slugs `translation_sentences`, meetings 3 and 4.

## 🆕 New — verb conjugations schema (added 2026-07-31)

User request: verbs need a separate object with all inflected forms, like the paradigms table.
Proposed table: `verb_paradigms(root_translit, root_arabic, meaning_he, lesson_id, forms jsonb, chatifai_verified)`.
First verb: רוח (הלך) — past tense already partially in cards, needs consolidation.
See `docs/handoff-2026-07-31.md` for full schema design.

---

Sizes: **XS** = under an hour · **S** = a session · **M** = a project · **L** = multi-session.

---

## Already covered by existing specs — close these on delivery

| note | covered by |
|---|---|
| `23486a6b` letter recognition | practice spec, Stage 3 |
| `04cff308` inflections spec | inflections rebuild spec |
| `5774ff07` demonstratives | inflections rebuild spec, second content set |
| `5e4b20e5` "נטיות לא טוב ומשחק תמונות צריך תמונות" | both specs together |

---

## `fe756110` — daily-situation simulations · **XS, not M**

The note asks for buying shawarma, buying food, arriving at someone's house.

**Most of this already exists.** `app/api/simulate/route.ts` has five working scenarios —
`market`, `taxi`, `restaurant`, `street`, `cafe` — streaming Claude Haiku, responding in
Hebrew-transliterated Palestinian Arabic with a translation line. Food buying is covered twice over.

What's actually missing is the *visiting* scenario, which is culturally the richest one (greeting
the host, the tea/coffee ritual, refusal-and-insistence, leaving politely) and genuinely absent.

**Do:** add 2–3 entries to `SCENARIO_LABELS` and the picker UI — `visit` (arriving at someone's
home), `shawarma` (street-food stand, faster and more transactional than `restaurant`), maybe
`doctor` or `pharmacy`. Each is one line of scenario description.

Validate the scenario descriptions with the **chatifai agent** for cultural accuracy on the
visiting etiquette — that one has real conventions and getting it wrong teaches bad manners.

---

## `8ef42245` — "real conversation" phrases · **XS**

Wants phrases like "אני לומד ערבית" — how to talk about *yourself* as a learner.

This isn't roleplay, it's a phrasebook. Two options, and I'd take the second:

1. A sixth simulate scenario — weak fit, since the need is a fixed set of phrases, not a dialogue.
2. **A card set.** These are exactly what `cards` with `item_type = 'phrase'` is for. Source ~20
   from chatifai (I'm learning Arabic / I don't understand / say it slowly / how do you say X /
   I'm still a beginner / correct me please), insert as cards, and they flow into the existing
   FSRS review with zero new code.

Option 2 closes the note with a script and no UI work. Do that.

---

## `0000ac3d` — daily tip · **S**

The note wants surfaced facts like "לא הוגים את ה-אל ב־סרטן זללן צד רשת ג׳" (the sun letters),
"דהאן = צבעי", and similar pronunciation/vocabulary observations.

Nice feature, genuinely cheap, and it fits the app's habit loop — it should appear on `/review`,
which is the screen he actually opens daily.

**Shape:**

```sql
create table tips (
  id uuid primary key default gen_random_uuid(),
  body text not null,
  category text,               -- pronunciation | vocabulary | grammar | culture
  shown_count int default 0,
  last_shown_at timestamptz
);
```

- A card at the top of `/review` (collapsible, remembers dismissal for the day via localStorage).
- Selection: least-recently-shown, tie-broken by lowest `shown_count`. Not random — random
  repeats and feels broken.
- Admin-only add form, reusing the notes-page pattern.
- Seed with the sun letters rule (`سرطان زللان صد رشت ج` — the ~14 letters that assimilate the
  `ال`), since that's the example he gave and it's the highest-value single fact in the set.

**Prerequisite:** must not collide with the practice section's NavBar/strings edits. Queue it
after that merges.

---

## `6a3d8964` — Offline / PWA with IndexedDB · **L. Recommend deferring.**

The stated use case is reviewing on the train without signal.

Real work: service worker, IndexedDB cache of the card set, signed-URL audio caching (they
**expire in 10 minutes** — see `app/api/review/queue/route.ts`, so audio offline needs a
different storage strategy entirely), and a write queue to replay grades on reconnect. That last
part is where offline SRS projects usually break: replayed grades arrive with wrong timestamps
and corrupt FSRS scheduling.

Given the reversibility constraint he's stated twice, an offline write queue is the single
riskiest thing in this backlog for FSRS integrity.

**Recommendation:** defer. If train review matters sooner, ship a **read-only offline mode** —
cache the card set and let him self-test with no grading at all, like `/browse` without scoring.
That's maybe a fifth of the work and carries none of the scheduling risk.

---

## `5e76460f` — YouTube playlists over 15 videos · **XS, blocked on you**

RSS caps at 15 items; the three named playlists need the YouTube Data API.

**Blocked on a human step:** create a project in Google Cloud Console, enable YouTube Data API
v3, generate an API key, add `YOUTUBE_API_KEY` to `.env.local` and to Vercel's env vars.
Free tier is 10,000 units/day; a playlist fetch costs 1 unit, so quota is a non-issue.

Once the key exists the code change is small and confined to `app/api/content/playlist/route.ts`
— swap the RSS fetch for `playlistItems.list` with pagination. Fully parallel-safe, touches one file.

---

## `5a28521e` — Arabic social media / reels feed · **Recommend not building.**

The instinct — immersion in real casual dialect — is good. Building it in-app is not.

- Instagram and Facebook have no public API for fetching another account's reels. This needs
  either scraping (breaks constantly, against ToS) or the Graph API (business account review,
  and it still won't give you arbitrary public accounts' content).
- Embedding is possible but yields an iframe you don't control, no transcript, no vocabulary
  extraction — meaning it's a link list with extra steps.
- Any value the feature has comes from *comprehension support* (transcript, vocabulary,
  clipping), which is exactly what the existing `/recordings` pipeline already does — Groq
  transcription, word timestamps, clip-to-card.

**Better version of the same idea:** he saves reels he likes, downloads the audio, and drops it
into `/recordings`. He gets a transcript, word-level timestamps, and can cut clips straight onto
cards. That's the feature he actually wants, and it exists.

Suggest replacing this note with a smaller one: "make it easy to get audio from a saved reel
into /recordings."

---

## `092491e9` — immer song transliteration

The `yama` song already demonstrates the target format (`songs.lyrics_parsed` as `LyricLine[]`
with `ar` / `he` / `translit` per word), so there is no app work here at all — it is purely a
content-entry task.

I'm not going to generate the transliterated lyric text myself. Get the transliteration from
chatifai or enter it directly; the shape it needs to land in is documented in `README.md`, and
`scripts/update-yama-lyrics.ts` is a working template for the write.

---

## `ff0c99b4` — new words (מַרִן / טַרִי / מְלַאכֵּה) · **XS, sequenced**

Straightforward card inserts, content already written in the note with nikud from a chatifai
conversation.

**Do not run this while the practice spec's Stage 0 is in flight.** Stage 0 counts and verifies
"the 391 words"; inserting new unverified words mid-run moves the target and will confuse its
completion check. Queue it immediately after Stage 0 reports done, then let the new words go
through the same chatifai verification path so they land with `chatifai_verified` set.

---

## `f1a00ef8` — read-only משימות/recordings for non-admin

Reported complete in the 2026-07-25 session summary, and commit `cac8642` matches
("read-only notes/recordings for non-admin"). **The note is still marked open.** Verify against
the running app and close it — or it will keep resurfacing at every session start.

Worth a wider check: the open-notes count dropped from 15 to 13 during this session, so notes
are being closed, but at least this one has drifted out of sync with reality.

---

## Suggested order once the practice section merges

1. `8ef42245` phrases + `ff0c99b4` new words — one content script, both closed (XS)
2. `fe756110` simulate scenarios (XS)
3. `5e76460f` YouTube — as soon as the API key exists (XS)
4. Inflections rebuild (L, spec ready)
5. `0000ac3d` daily tip (S)
6. `5a28521e` → rewrite the note; `6a3d8964` → defer
