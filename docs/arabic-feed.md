# Arabic feed (`/feed`): practice reading social media in Arabic

Status: design draft (2026-10-26). Not built. Each stage below is a separate,
reversible, additive step.

## The idea

A feed that looks like reels and tweets, where every item is in spoken
Palestinian Arabic. The point is the skill of following real social content:
short, fast, slangy, with no subtitles. Each item is one practice round:

1. **Watch or read cold.** Only the Arabic is shown: no Hebrew and no
   transliteration.
2. **"מה הבנת?"** Ariel writes in Hebrew what he thinks was said. One line is
   enough, and "לא הבנתי כלום" is a valid answer.
3. **Reveal.** Show the transliteration in Hebrew letters (the usual card
   convention), the Hebrew translation, and a short score on how close the
   answer was.
4. **Self-rate.** הבנתי / חלקית / לא הבנתי.
5. **Take words.** Tapping a word or chunk he didn't know sends it to the
   inbox as a candidate card. It does not go straight into the deck.

### Why it works this way (so the build doesn't "improve" it away)

- **Answer in Hebrew, not in Arabic.** The skill being trained is
  comprehension. The answer is a gist, not a literal translation, so it is
  graded for meaning: did he get who, what and the tone. That is why
  `translation-match` (letter-skeleton matching) can't grade it. It needs a
  model: Claude, with the translation and the answer as input, returning
  0–3 plus one line on what was missed.
- **Hebrew stays hidden until the answer is in.** Otherwise it is reading a
  translation, not practice.
- **Words go to the inbox, not straight to FSRS.** The inbox already has
  dedupe and review, and a card from a reel needs checked pointing like every
  other card. Per the project rule, the feed reads FSRS state and never writes
  it.

## Subtitles and questions (decided with Ariel, 2026-10-27)

There are both, in layers. The item starts with no help at all, and each
layer is turned on separately:

1. **A guiding question before watching** ("על מה הוא מדבר?" or "מה היא
   מבקשת?"). It focuses listening the way a teacher does. Claude generates
   it from the translation, 1–2 questions per item.
2. **Subtitles in three separate toggles:** Arabic script, Hebrew-letter
   transliteration, Hebrew translation. Ariel turns on only what he needs,
   usually transliteration first and Hebrew last.
3. **Per-line playback:** tapping a line plays only it, with a loop and
   0.75x speed.

Avoid clips with Hebrew subtitles burned into the picture, since they can't
be hidden. Burned-in Arabic subtitles are fine.

**Technical consequence: the clip is stored with us.** Synced subtitles,
per-line looping and slow playback need control of the player. YouTube
allows that (IFrame API: `getCurrentTime`, `setPlaybackRate`). An embedded
Instagram or Facebook reel does not: it's a closed iframe. So for a reel,
Ariel saves the clip himself and uploads it, the way recordings work today.
The clip is kept in Supabase Storage (private bucket, Ariel's personal use
only), goes through Groq Whisper with timestamps into `segments`, and the
link to the original is kept for attribution. Without an upload, the item
falls back to an embed plus a transcript under it with the same toggles,
but not synced.

## Content

**Curated by hand. No scraping, no automatic import.** Instagram and TikTok
don't allow downloading, and an automatic feed would bring in content that is
too hard or in other dialects.

| Type | How it's shown | Where the text comes from |
|---|---|---|
| YouTube Shorts | Ordinary embed (iframe) | Whisper (Groq, as in recordings) on audio Ariel uploads, or a pasted transcript |
| TikTok | `tiktok.com/embed/v2/<id>` | Pasted transcript, or audio Ariel saves himself and uploads |
| Instagram Reel | `instagram.com/reel/<id>/embed` | Same as TikTok |
| Tweet or post | The text itself, stored in the DB, plus a link to the original | The text itself |

Whatever the source, the stored text is passed through Claude to produce
Hebrew-letter transliteration and a translation. The transliteration is
checked with chatifai, as with the cards, before an item is marked
`verified`.

**The first two items, from Ariel (2026-10-27):**
- Instagram reel by @moamenjaberofficial (elections and voting):
  https://www.instagram.com/reel/De_0J_FN7e-/
- Facebook reel: https://www.facebook.com/reel/1178373095150482/
  (needs a login to view, so it has to be saved and uploaded).

**Minerva stories (from oral meeting 6, 2026-10-28).** The channel "מינרוה המרכז
לשפה ותרבות ערבית" has ~20 folk tales in spoken Arabic, 0:41–13:14 long, all on
YouTube, so the player can be controlled. They are the best stage-0 material
found so far: slow, clear narration, pictures that carry the plot, and a
story every time. They burn in Arabic script and Hebrew-letter
transliteration (not Hebrew translation), so the transliteration toggle can't
be turned off for them; the guiding question and the Hebrew layer still work.
The full list, short to long, is in the "סיפורים של מינרוה" section of
`/content`. "המזל הרע" (6QubRNusq_g) already has its cards (lesson "מפגש בעל פה 6"),
so it is the natural first item. Still to find: "חכמת המדבר", which Tomer
mentioned; it didn't come up in a YouTube search.

**How to find more.** Searching the web for lists of creators came up empty
(it mostly returns war and politics coverage). The practical approach is a
**separate Instagram/TikTok account just for Arabic**. Follow the creators we
already know, the ones on `/content` plus the two above, then search hashtags
such as `#طبخ_فلسطيني`, `#لهجة_فلسطينية` and `#نكت_فلسطينية`, and let the
Explore tab fill up on its own. Ariel saves whatever he likes; it doesn't
have to be uploaded right away. Order of difficulty, easiest first:
Palestinian cooking (the picture explains, vocabulary repeats), daily-life
vlogs, street interviews, comedy skits (fast and full of slang, so later).

**Starting with items that aren't too hard.** The first 15–20 items come from
channels already on `/content` (סליחה על השאלה, בלא מאאח'ד'ה, אחכי ללכמירא,
which have Shorts in Palestinian dialect) plus tweets with short text.
Choosing creators together with Ariel is the first task of stage 0. We are
not inventing a list of accounts.

## Difficulty: known-word coverage

When an item is saved, compute the share of its words that already have a
card Ariel has seen (`card_srs.reps > 0`). This is a read of FSRS state, not
a write.

- **≥ 85%:** easy. A good level to start with.
- **70–85%:** the sweet spot ("i+1"): enough is understood to work out the
  rest.
- **< 70%:** hard. Kept back until coverage rises.

The feed order is coverage descending, among items not yet done, with a light
mix so that it isn't always the same creator. Coverage is recomputed whenever
the deck grows, so a hard item turns easy by itself over time. That is the
progress Ariel sees.

## Schema (one new migration, nothing in existing tables)

```
feed_items(id, platform, url, embed_id, author, text_ar, translit, he,
           segments jsonb,          -- for video: [{start,end,ar,translit,he}]
           level_override int null, verified bool, created_at)
feed_attempts(id, item_id, answer_he, score int,          -- 0–3, from Claude
              self_rating text, words_sent int, created_at)
```

Coverage is not stored. It is computed in `/api/feed/queue` against cards,
the same way the review queue is computed.

## Stages

- **Stage 0 (content):** choose sources with Ariel, enter 15–20 items through
  a small admin form (URL plus text or audio), check them with chatifai.
- **Stage 1 (feed):** a `/feed` page with vertical swipe and one item per
  screen, the flow above (watch, answer, reveal, rate), and `feed_attempts`.
  Mobile first. Link it from the menu.
- **Stage 2 (words and ordering):** tap a word or chunk to send it to the
  inbox; order the feed by coverage.
- **Stage 3 (progress):** on `/stats`, items done per week, average score,
  and the coverage of the items he understood over time.

## Explicitly out of scope

- No scraping, API keys or automatic import from Instagram, TikTok or X.
- No writes to `card_srs` or `review_log`.
- No social features (likes, comments, sharing).
- Not literary or news Arabic at the start. Spoken dialect only, as with the
  cards.
- No offline mode for the feed (embeds need a network anyway).
