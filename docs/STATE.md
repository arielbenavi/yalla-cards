# yalla-cards: current state, plans and ideas

**The source of truth for a new session.** Updated 2026-11-25. Whoever finishes something updates this file in the same commit: move the item to "Done", or add a new one.

More detail, only when needed:
- [handoff-2026-11-05.md](handoff-2026-11-05.md): table of commits since November.
- [handoff-2026-11-07-addendum.md](handoff-2026-11-07-addendum.md): the fixes of 7.11.
- [watch-plan.md](watch-plan.md): the video plan.
- [learning-plan-2026-11.md](learning-plan-2026-11.md): learning plan and research.
- [ios-app.md](ios-app.md): the iPhone app.

---

## 1. Who and what
- **Ariel** learns spoken Palestinian Arabic (Jerusalem/Jaffa) through Hebrew transliteration with nikud.
  - Courses: המדרשה with רונן (the book plus מפגשים בעל פה), a spoken class with רים פרג', and Preply.
  - **Always answer him in Hebrew.** He has few credits: short reports, write the plan before doing the work.
- **The app** is personal, one user and admin.
  - Stack: Next.js 16 on Vercel (yalla-cards.vercel.app), Supabase on the free plan (eu-west-2, about 860MB of 1GB storage), ts-fsrs, Playwright.
  - There is also an iPhone app in Capacitor that loads the website.
- **The menu:**
  - חזרה יומית, חזרה כללית, תרגול (all practice and games), תכנים.
  - "עוד" holds היום, שירים, אדמין and sign-out.
  - אדמין holds ייבוא, שיוך אוטומטי, הקלטות, סטטיסטיקה, משימות.

## 2. Rules that do not change (also in CLAUDE.md)
1. **Reversible, additive changes only.** Never write FSRS state (`card_srs`, `review_log`), except the `card_srs` row (`direction: "he_to_ar"`) of a new card.
   - Before deleting a card, back it up to `scripts/data/*.json`.
2. **Migrations:**
   - Write `supabase/migrations/00XX_*.sql`, then run `npx tsx scripts/migrate.ts`. The last one is 0037 (`cards.mufeed_verified`).
   - Never ask Ariel to run SQL.
3. **Tests:** a change to review, inbox or recordings needs `npx playwright test` to pass in full.
   - Do not skip tests.
   - `dialogue-tab.spec.ts` is sometimes flaky on login and passes when run alone.
4. **Scripts:**
   - Node 20 for scripts:
     ```bash
     export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 20
     ```
   - Supabase client: `createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {auth:{persistSession:false}, realtime:{transport: class {} as any}})` and `config({path:".env.local"})`.
   - Capacitor needs Node 22 or newer. `mobile/reinstall-daily.sh` runs Node 24.
5. **Pushing:** `git push` runs `next build` in a pre-push hook. Vercel deploys from main.
6. **Content:**
   - chatifai, the course bot that checks nikud, is down. Everything new goes in with `chatifai_verified=false`.
   - Never copy song lyrics from the web.
   - Never make up nikud or Arabic from general knowledge. Mark it "משוער" or open a note.
7. **Transliteration convention:**
   - Every ב takes a dagesh (`fixBet` in `lib/word-lookup.ts`).
   - Geresh is written `'`.
   - ض → צ', ص → צ, ظ → ט', ج → ג', خ → ח', غ → ע'. ق in Palestinian is mostly א.
   - Latin pronunciation in his notes decides the nikud, but is never stored as a card note.
   - Reading text from an image: always use the skill `.claude/skills/reading-nikud-from-images`, then update its Lessons.
   - **MuFeed** (the dictionary app on the Mac) is the second source for nikud, after the course book: `python3 -I scripts/mufeed/dump.py` downloads its whole dictionary with Ariel's login (gitignored `scripts/mufeed/dict.json`, 3,285 entries with plurals and present tense), `local_lookup.py` + `cmp.py` compare the deck. Take a form only when Arabic, transliteration and a word of the meaning all match. Its conventions differ from the book's (ֵ for ֶ, no helping vowel); the book wins. Mark exact matches `mufeed_verified=true`.
   - **Class recordings → notes:** ffmpeg into 30-min mono mp3 chunks, then gemini-4-argon with a prompt holding Ariel's own questions, giving Hebrew notes per chunk (about 40KB for 2.5h); then MuFeed for the pointing. Clips the teacher shows inside the Zoom share: crop the player region with ffmpeg, find when it plays by frame difference, then `scripts/subtitle-media.ts --file … --slug … --apply` puts it on /watch.
   - Tips are code, in `lib/tips.ts`. A card note containing "מאומת" skips the "ניקוד משוער" suffix (`scripts/insert-roa-5-lesson-2026-11-22.ts`).
8. **Ideas:** every idea Ariel mentions becomes a row in `notes` with tag `idea`, in the same turn.
9. **Teachers:** only רונן counts as a teacher in class recordings. לנדי פרפט is a student.
10. **Cards:**
    - Singular and plural share one card.
    - New cards are not shuffled: order of insertion equals lesson order.
    - The daily queue takes 40 new cards a day.

## 3. Done (latest first)
- **25.11: סבב צורות, beta** (spec [forms-round.md](forms-round.md)). After the daily review, once a day, a button opens `/forms`: 10 known words ask for their plural, ידעתי / לא ידעתי. Group A only (`formsGroup` in `lib/forms-round.ts`, by the card id), B is the control; `GET /api/forms-round` is read-only, answers go to `learning_events` only (no migration). Eligible today: 168 (A 81, B 87). `scripts/forms-report.ts` also counts Relearning words (state 3), or a word just rated שוב would drop out of the comparison, and it counts from New York midnight of `FORMS_ROUND_START` (26.11). Expect it to say "not enough data" on 17.12: the 168 had 210 reviews in the last 21 days, both groups together, and it wants about 200 per group. Tests: `tests/e2e/forms-round.spec.ts` (events are intercepted so tests never write A/B data) and a forms case in `reversibility.spec.ts`. Full suite (Node 24): 70 passed, 2 flaky (passed on retry: content-watch, inflection-drill); an earlier run had 8 failures in other specs (login timeouts, API errors) that passed when rerun. Not tried on the iPhone.
- **25.11: שלג and יונים** (`scripts/insert-words-2026-11-25b.ts`): new card תַלְג' / ثلج = שלג, קרח (MuFeed has תַ'לְג' = קרח; spoken ת). The existing חַמַאם = יונים got "(יונה: חַמַאמֵה)" and a note against חַמַּאם = שירותים (the shadda), backup `scripts/data/hamam-pigeons-backup-2026-11-25.json`.
- **25.11: 5 words from Ariel** (lesson "מילים 25.11.26", `scripts/insert-words-2026-11-25.ts`): בַּדְרִי, רִסַאלֵה / רַסַאיֵל, פֻסְתַאן / פַסַאתִין, נַתִיגֵ'ה / נַתַאיֵג' (MuFeed, mufeed_verified) and חַדִיקַה (not in MuFeed, estimated; spoken is גְ'נֵינֵה, already a card). Skipped as already in the deck: אכיאס (כִּיס has the plural) and סאחה (אִסַּאחַה = החצר).
- **25.11: review plays the recording on flip.** "הצג תשובה" (or space) on a card with a clip plays it, called inside the tap so the iPhone WebView allows it (`reveal()` in `mobile/src/App.tsx`). Same day: a ת→ע card with a recording shows its transliteration on the front, not a lone speaker. Test: `tests/e2e/review-audio-prompt.spec.ts`. Full suite: 66 passed; `inflection-drill.spec.ts` "a correct placement sticks" fails on its own too (times out on a tile; the drill does not use the review code), open.
- **22.11: Roa lesson 5 cards** (`scripts/insert-roa-5-lesson-2026-11-22.ts`, same lesson): her tense board (לַאקַא, גַ'אוַבּ, שִרֵבּ, טַבַּח': present · past · future, one card per verb) and the lesson words (סַרִיע, אֻסְבּוּעִי מַרַק בְּסֻרְעַה, מֻגַ'רַּד, מְקַסַּמֵה, צַרַח', עַנְגַ'ד = ברצינות, checked in MuFeed). 10 new, 2 duplicates skipped. Nikud from MuFeed stems where it has them, the rest estimated. New idea note: cards that come back in a random gender/number.
- **22.11: 17 classroom cards for Roa** (lesson "Preply Roa K. 5", `scripts/insert-roa-classroom-2026-11-22.ts`): feminine forms (אִשְרַחִילִי, חֻ'דִי וַקְתִכּ, בִּתִפְהַמִינִי…) derived from MuFeed's verb stems (MuFeed has no conjugated forms), plus מְעַלְּמֵה / אֻסְתַאד'ֵה / חֻ'צוּצִי. Nikud estimated, chatifai_verified=false, open todo note to check them. Two skipped as duplicates of the masculine cards (they differ only in a vowel).
- **15.11: tip כִּיף removed** (Ariel: what does אוצר have to do with it, and the tip is weak). It also wrongly treated كيف "how" and كيف "fun" as two different words.
- **15.11: MuFeed check (replaces chatifai for words).** MuFeed's dictionary is searched through its own API (`scripts/mufeed/`: `mf.py` takes the session from the MuFeed app on the Mac, `run.py` looks up every Arabic part of `cards.json`, `cmp.py` compares; MuFeed writes ّ instead of dagesh and ׳ before the vowel, normalized). 1130 unverified words and phrases: 330 found, 205 identical, now `mufeed_verified=true` (new column, migration 0037; `chatifai_verified` untouched). 125 differing parts read by hand: most are conventions (אֵ- for the article, אַלַّה, ת for ث) or a different word, kept. 8 fixed: מְעַקַּד, מְתַעַלֵּם, בַּיַּאע, דַ'בַּח, טַבַּח', מַרִיצ', מַרַצ', מֻגְ'תַמַע, and צֻ'הֻר for צֻּהֹר at Ariel's word (old values in `scripts/data/mufeed-apply-2026-11-15.json`, full comparison in `mufeed-check-2026-11-15.json`). 800 not in its dictionary; sentences not checked. Migration 0036 made idempotent (it had run untracked).
- **15.11: Preply Roa K. 4.** 26 cards from Ariel's notes of today's lesson (`scripts/insert-preply-roa-4.ts`, data `scripts/data/preply-roa-4.ts`): weekdays and parts of the week, dates said as day + month, birthday words (cake כֵּיכֵּה / כַּעְכֵּה / גַאתוֹ with a hard g, his request), frequency words, sentences about going out and studying. 10 were already in the deck. Arabic written by me from his Hebrew letters; pointing משוער.
- **15.11: Preply Roa K. 3 (9.11).** 21 cards from Ariel's chat log (`scripts/insert-preply-roa-3.ts`, data `scripts/data/preply-roa-3.ts`): four I/we × present/past tables for רוח, שוף, שרב, אכל, נאם, לעב; the dinner sentence; כיתות; verbs in the first-person form (אַנַצִּ'ף, אַסַאעֵד, אַסְתַח'דֵם, אַחֻטּ). 7 were already in the deck. Pointing משוער, unverified.
- **24.11: meeting 10 recording notes.** 22 cards in "מפגש 10" (`scripts/insert-meeting-10-oral.ts`, data `meeting-10-oral.ts`): שַחַן / יִשְחַן (הטעין), שַעְר, מַא תִקְלַקִי, מְנִשְתְרִי, מַא בַּטַוֵּל, קַבֵּל מַא / בַּעֵד מַא, אַצְלַן, נַשַר, נִשֵף רִיקִי, פַאיְדֵה, מַשְרוּע, מַתְחַף, קַאנוּן, blessings without ב', sentences 3 and 5. Ariel's questions answered from the two recordings (Gemini notes per 30-min chunk, then MuFeed). Card בַּרְכַּן עַלֵיכִּי fixed to בַּרְכֵּן / بركن (backup `scripts/data/meeting-10-oral-backup.json`). 4 tips (rhyme אִנְתִי עַרַפְתִי, עִיד/עַאדֵה, בַּקְדַר vs בְּקַדֵּר, no ב' in blessings). Notes: 2 ideas (particles more often, the game show + TikTok, link missing), todos for אִשְתַרַא in verb_conjugations and chatifai. The two clips the teacher played were cut from the recording (the zoom share, cropped) and put on /watch with automatic subtitles: `m10-tiktok-maaz` (מעאז, 8 s) and `m10-yalla-show` ("יאללה נח'טט'הא", מכאן 2018, 6 s). The full episodes were not found online.
- **22.11: meeting 9 recording notes + daily tip/proverb.** 44 cards in "מפגש 9" from Ariel's notes (`scripts/insert-meeting-9-oral.ts`, data `meeting-9-oral.ts`): words and phrases (רַפַעְת קַצִ'יֶּה, שַכְוֵה, (אל)צַּ'רִיבֶּה (א)לְעַאמֶּה = ארנונה, מֻחַ'אלַפֶה, חַרַס (א)לְחֻדוּד, כִּיס = שקית…) and sentences 11, 13, 14, 15 of p. 138; book pointing where the book has it, else MuFeed, else משוער. קַצִ'יֶּה += תלונה, חִ'לַאל got sentence 6 of p. 137 as its example, צַבֵּר += איפוק (a duplicate צַבְּר was removed, backup `scripts/data/dup-sabr-2026-11-22.json`). New tips: וַאלְדֶה, זַמַאן וּמֻדֶּה וֵינַכּ, כִּיס/גֵ'יבֶּה. **Daily popup** (`components/DailyTip.tsx`): a tip and a proverb every day, on different app opens (the first open shows one, a later open the other; which goes first alternates daily), each from its own random queue in localStorage so every tip/proverb is shown once before any repeats. Before, one item per day alternated tip/proverb by day number, so half the days had no proverb.
- **20.11: homework of meetings 9 and 10 on /translate.** The book's he→ar translation sentences, 20 each: meeting 9 pp. 151–152 (answers 318–319), meeting 10 pp. 167–168 (answers 322–323), as paradigms rows `book_translation_p151` / `book_translation_p167` (`scripts/insert-homework-9-10.ts`, data `scripts/data/homework-9-10.ts`). Then the conjugation homework went into the inflection drill as 8 paradigms (`hw9_*`: עִרֵף + object, שַרַח + indirect object, both with negation, עַאגֵ'בּ and פַאחֵץ participles, pp. 313–317; `hw10_present(_neg)`: 8 verbs in the present, pp. 320–321; `scripts/insert-homework-grids-9-10.ts`, data `homework-9-10-grids.ts`; negatives are generated by the book's rule and match the printed ones). Meeting 10 vocabulary pp. 162–164 (74 items, `meeting-10-vocab.ts`): 45 new cards in lesson "מפגש 10" (source book, meeting 10, so it is now the current meeting), the rest already existed.
- **20.11: MuFeed, second pass, from its whole dictionary.** The app's JS bundle (`/Applications/MuFeed.app/.../main.jsbundle`) names its tables; with Ariel's login PostgREST serves `dictionary_entries` (3,285: arabic_text, transliteration, *_plural, *_present, word_type, verb_form…) and `translations` (12,409 Hebrew glosses) directly, so `scripts/mufeed/dump.py` downloads both (gitignored `dict.json`) and `local_lookup.py` replaces the per-word RPC. Of 1,927 unverified words/phrases: 352 identical → mufeed_verified; 15 that only lacked a dagesh MuFeed has were fixed (נַגַּ'אר, אִסַּא, בִּסֵּה, אֻםּ…); 55 verbs got "הווה: … (מופיד)" in their notes; 4 more plurals. A form is taken only when the Arabic, the transliteration (ignoring ֶ/ֵ and dagesh) and a word of the Hebrew meaning all match, since Arabic alone mixes nouns and verbs (צַפּ class / to line up). The 250 remaining differences are listed in `docs/mufeed-review-2026-11-20.md`, unchanged (mostly the book's conventions). MuFeed has no feminine field (only 142 "m / f" entries, mostly not adjectives), so no feminine column was added. Script: `scripts/apply-mufeed-check-2026-11-20.ts`, backup `scripts/data/mufeed-check-2026-11-20-backup.json`. Ariel and I went through the 68 letter differences: the rest are spoken pronunciation (ق as א, ذ/ث as ז/ס), our conventions, or MuFeed matching another word; six were real mistakes and were fixed (כַּרַאג', מַטְבַּח', חַ'מְסְתַעְש, אַרִיבּ, אַזְרַק, אַמִין), and פרצוף is now וִשּ / וִגֵ'ה as MuFeed has it (`scripts/fix-mufeed-letters-2026-11-20.ts`). The duplicate כחול and אמין cards were merged into the reviewed ones (`scripts/merge-duplicates-2026-11-20.ts`, backup `scripts/data/merged-duplicates-2026-11-20.json`).
- **20.11: מפגש 9 from the book + meeting 8 practice + his typed words.** `scripts/insert-meeting-8-9-2026-11-20.ts` (data `scripts/data/meeting-9-book.ts`, `meeting-8-practice.ts`, `meeting-8-9-typed.ts`). New lesson "מפגש 9" (source book, meeting 9, so it is now the current meeting): vocabulary pp. 144–146 (69 items, with plurals), sentences 3–8 and the end of 9 from p. 137–138 (translations p. 139), the words those sentences teach (רַפַע קַצִ'יֶּה, וַעַד, נַקַל, טִלֵע…), and five paradigms for the inflection drill: וַגַ'ד/קִבֵּל + object suffix (p. 134), the negative קַטַע/סִמֵע (135), participle עַארֵף (136), the full grids of פַחַץ (140–141) and מִסֵכּ (142–143). Meeting 8 practice answers (pp. 311–312): 12 of the 14 were already in the deck. His typed words (תַסְגִ'יל, תַאְמִין…, אִסְעַאף, פִיש עֵיבּ עַלֵיכּ, the proverb בִּאלְאַמְוַאל וַלַא בִּאלְאַרְוַאח) with MuFeed pointing. 84 new cards; duplicates are skipped only when the unpointed form and a word of the meaning both match (קִבֵּל ≠ קַבֵּל). Existing cards got the book's plural where they had none (13), and אַללַּה וַכִּילַכּ gained "תאמין לי". The existing מַוְצוּל card was already there, so nothing was promoted. Plurals: of 1,115 word cards without one, MuFeed had an exact match with a plural for 152 (nouns and adjectives); filled by `scripts/apply-mufeed-plurals.ts` from `scripts/data/mufeed-plurals-2026-11-20.json` (`scripts/mufeed/plurals.py` makes it). The rest are verbs, particles or words MuFeed lacks.
- **17.11: oral meeting 17.11.26.** New lesson "מפגש בעל פה 17.11.26", 17 cards (`scripts/insert-oral-2026-11-17.ts`, data `scripts/data/oral-2026-11-17.ts`) from his handwritten notes and typed list: לַמְבֵּה, נַצַּ'ף (he heard נדף), רַאגֵ'ל/רְגַ'אל, מַע'ארַה, נַפַק, וַגְ'בֵּה, מֻעַאלְגֵ'ה נַפְסִיֵּה… 7 already existed (שַאיֵף, כַּמַאן מַרַּה, עַצִיר…). Pointing from MuFeed where it had the word, otherwise "משוער"; all chatifai_verified=false. Meanings added: חַשִיש += עשב, טַאוְלֶה += שש בש (old values in `scripts/data/meanings-before-2026-11-17.json`). His two photos (backgammon, cave meal) are picture-game scenes "אַנַא שַאיֵף: …" with 3 hotzones each. `scripts/mufeed/mf.py` now renews the expired JWT with the app's refresh token.
- **11.11: oral meeting 11.11.26.** New lesson "מפגש בעל פה 11.11.26", 42 cards (`scripts/insert-oral-2026-11-11.ts`, data `scripts/data/oral-2026-11-11.ts`): his notes, the situation with נעמה (10 lines), and 14 items found in the recording's Groq transcript (the payment-delay sentence, אִסְתַתְ'מַר = invest, ע'רַאמֵה, נַיַּאלַכּ, שֻפְתַכּ צֻדְפֵה…). All chatifai_verified=false, pointing "משוער". The recording (61 min) and "הקלטת שיעור 8" (164 min) were imported and transcribed (`import-course-recordings.ts` now tags any file with "מפגש בעל פה" in its name). Tip added: יִחְ'רֵבּ בֵּיתַכּ. The song line from his screenshot stays out (lyrics). `auto-clip --write` then proposed clips for 33 of the 42 (on /recordings/auto).
- **10.11: אימון ממוקד left the תרגול tab** (Ariel); /focused still resolves. He says practice in general "doesn't work for him": open idea note, to talk through before rebuilding the tab.
- **10.11: meeting order.** The current meeting is now the highest book meeting number, not the newest lesson date (מפגש 8's lesson was dated before 7's). Inflection drill, translations and the practice status start from מפגש 8, then 7…1 (`lib/current-meeting.ts`).
- **10.11: navigation reorganised.** Ariel: hard to tell where things are. The tabs are now חזרה יומית · תרגול · פיד · תכנים · עוד (`lib/nav.ts`). The feed has its own tab. The general review left the bar: a link under the daily tip opens it, and the review tab stays marked. "עוד" holds חזרה כללית and אדמין. /today left the menu too (Ariel, same day): the site, login and the iPhone app open on the review; the route still resolves. The videos with transliteration are one component (`components/WatchList.tsx`), shared by /watch and the top of תכנים, with the songs beside them; they left תרגול and the scattered ▶ links. Test: `tests/e2e/content-watch.spec.ts`.
- **10.11: מפגש 8, השלמה.** 85 new cards in "מפגש 8" (`scripts/insert-meeting-8-more.ts`, data `scripts/data/meeting-8-more.ts`): the pp. 132–133 translation drill with the book's answers from pp. 311–312 (20 sentences, course_verified), 59 items from Ariel's oral notes (pointing from his Latin hints, "ניקוד משוער" where not in the book), and the p. 122 forms (בַּעַתְלִי…). 27 were already in the deck. 13 existing cards got the plural he gave (זֻמַלַא, טֻקוּס, תַזַאכֵּר…); backup `scripts/data/meeting-8-more-backup.json`. The p. 122 examples were read in August with a sheva; the page and Ronen's slide have the linking hiriq (רְגִ'עִלְהַא, רְגִ'עִלְכֹּם, כַּתַבִּלְהֹם), now fixed in the paradigm. The new cards' first review is dated 1.1.26 so the daily queue serves them first; the 185 older מפגש 8 cards (never reviewed) were moved right after them on Ariel's yes (`scripts/front-meeting-8-unseen.ts`, `due` only, backup `scripts/data/meeting-8-unseen-due-backup.json`). Tip added: הווה = פַאעֵל. Madrasa agrees with 11 of the new words and contradicts none. `auto-clip.ts` now falls back to curl when a big recording fails to download.
- **8.11**
  - **Feed MVP (`/feed`, its own tab since 10.11):** 59 dialect posts from 9 Gazan X accounts that Ariel follows. Arabic only by default; each post can show its transliteration (משוער) or Hebrew. Tapping a word shows its meaning and card, "+ המילה הבאה" makes a phrase, and admin adds an unverified card (same lesson as video words).
    - Table `feed_posts` (0035–0036). Per-word translit and meanings by Gemini (`lib/feed-annotate.ts`). Seed: `scripts/feed-seed.ts scripts/data/feed-seed-2026-11-08.json`.
    - Daily cron `/api/feed/fetch` (`vercel.json`) pulls new posts through the X API (`lib/feed-accounts.ts`). It does nothing until Ariel opens an X developer account, buys credit (about $15/month) and sets `X_BEARER_TOKEN` (+ `CRON_SECRET`) in Vercel.
    - It also needs `GEMINI_API_KEY` in Vercel (not checked). It has never run. Each run searches only the last 7 days, so if it is off for more than a week, that gap is never fetched. Vercel's free plan allows one run a day (06:00 UTC).
    - Gemini hides posts it judges literary (فصحى); `/api/feed?all=1` shows them (2 of the 59 seed posts). `lib/feed-accounts.ts` lists 10 accounts but the seed has none from @Xgazag. Until the API is on, more posts can be added by hand by reading his logged-in X in Chrome, as the seed was.
    - Watch's add-card sheets moved to `app/watch/sheets.tsx` (shared). Test: `tests/e2e/feed.spec.ts`.
- **8.11**
  - **Preply Roa K. 2:** 31 cards from Ariel's lesson notes (`scripts/insert-preply-roa-2.ts`, data in `scripts/data/preply-roa-2.ts`), base forms with all their forms, unverified. 8 already in the deck were skipped. Madrasa agreed with 9; the ✗s only list other words. The second block he sent was Roa 1, already in. The duplicate check by unvocalized Arabic gives false hits (بكره ≠ بكرة, مثل, هادي), so those were forced in.
- **7.11**
  - **Adding a word from a video:** "הוסף ככרטיס" now opens a sheet with the base form (no ל/ה/ו/ב, no suffixes) and all its forms (m / f / pl, or past / present), suggested by Gemini (`/api/watch/base-form`) and checked against Madrasa (`lib/dialect-sources.ts`), every field editable. The card gets the line's audio cut from the video (`clip_path`). Not yet tried on the iPhone.
  - **The 47 word cards from videos** were moved to their base form with all forms (`scripts/fix-video-cards-base-forms.ts`, backup `scripts/data/video-cards-backup-2026-11-07.json`), noted "צורות משוערות". The duplicate (אל)צַּבִּיַּה was deleted on Ariel's request (8.11; it is in the backup).
  - **Palestinian check, separate from chatifai:** skill `.claude/skills/check-palestinian` + `scripts/check-palestinian.ts` compare cards with Madrasa's spoken dictionary and Wiktionary South Levantine, and store the result in `cards.dialect_check` (migration 0034). Ronen says Madrasa is sometimes imprecise, so it is one voice of several. First run fixed the smoking cards: סִיגַארַה / סַגַאיֵר (ג without geresh), تتن → تبغ תַבַּע', and noted that Palestinians say شرب سيجارة.
  - **Minerva in the player:** העכבר והדלעת (2 scenes), דברי האדמה, אסיפת הורים, למען הדורות הבאים on `/watch` (series "סיפורים של מינרוה"), linked from תכנים. `watch-scenes.ts` now keeps a cache folder per slug (a shared one mixed up episodes).
  - **Daily proverb:** from the deck's own proverbs and expressions (`/api/proverbs`: cards whose meaning or note says פתגם, or non-word cards whose note says ביטוי), plus אִטְלַע פִלְמַכּ (`lib/proverbs.ts`). Ariel rejected the rest of the Madrasa list. Even days show the tip, odd days a proverb, in a fixed random order with no repeats.
  - **Cards, smoking (unverified, משוער):** תַדְחִ'ין עישון, דַחַּ'ן / בִּדַחֵּ'ן, סִיגַ'ארַה / סַגַ'איֵר, וַלַּאעַה מצית, תֻתֻן טבק, מַנְפַצַ'ה מאפרה, מַמְנוּע (א)תַּדְחִ'ין (`scripts/insert-smoking-words.ts`).
  - **תכנים → אוכל:** a new first button "▶ תפצ'לו ע(א)לעשא, נגן עם כתוביות לחיצות" opens `/watch` in the same window (internal links no longer open a new tab). The YouTube playlists stay below it. Test: `tests/e2e/content-watch.spec.ts`.
  - **iPhone renewal fixed:** it now runs at 08:30, 13:30 and 20:30, warns before expiry, and the app is installed until 14/11.
    - It had been failing since 31/10: `node` was not found, Node 20 was too old for Capacitor, and it exited silently on days the iPhone was unreachable.
  - **Watch:** a phrase can be selected (+ המילה הקודמת / הבאה) with an editable meaning and added as an unverified `phrase` card. The player now scrolls on a phone.
  - **Review:** a sentence longer than 12 words is never shown as a card's example.
  - **Sign-out** moved to the bottom of "עוד" on the phone.
  - **Cards:** צַבַּאח=בוקר removed (he says צֻבֵּח). Added מִתְאַחֵּ'ר, 3 sentences about the late teacher, and اخوت אַחְ'וַת = טיפש/מטורף.
- **5.11**
  - 100 cards from the spoken class with רים פרג' (`scripts/insert-reem-class-1.ts`).
  - The watch trial on תפצ'לו ע(א)לעשא: 2 scenes, tappable transliteration, "הוסף ככרטיס" to the lesson "נוסף מסרטונים (לא מאומת)". Ariel checked it on the iPhone: it works well.
- **4.11 – 5.11**
  - Menu: תרגול / אדמין. Red dot on תרגול when practice is stale. Practice ordered by meeting.
  - מפגש 7, pp. 306–310: negation drills and translation sentences. The situation "שיר שאני אוהב" is a draft.
  - 26 plural cards merged onto their singular.
  - Dagesh in every ב. Latin pronunciation notes removed.
  - Video and audio player with subtitles (`/watch`). `scripts/subtitle-media.ts` makes automatic subtitles (gemini-4-argon, much better than Whisper).
  - 14 class recordings imported (about 24 hours). auto-clip reads who is speaking off the video.
  - Blind nikud test: 90/100.
  - "תכנים": missing playlists added, plus food and series sections.

## 4. Running / waiting
- **Class clips:** transcription done 10.11 (77/77 recordings), `auto-clip.ts --write` done: 4015 clips proposed, 3120 still pending review. `clip-speakers.ts --apply` (who speaks, from the video) stopped on a network timeout (fetch failed) on 10.11. It is safe to rerun and skips what it already read:
    ```bash
    npx tsx scripts/clip-speakers.ts --apply
    ```
  Takes over 10 minutes, so run it in the background. Then report to Ariel how many cards got a clip.
- **Storage:** approved clips are WAV. Compress them to mp3/opus before Ariel approves many more, or the 1GB fills up.
- **iPhone (26.11):** SideStore signs in again: Apple's 503 is bypassed with client info `<MacBookPro13,3> <Mac OS X;26.6;25F84> …`, server `mac-ani.jkcoxson.com` with rotation off, On-Device Anisette off, then Reset adi.pb (keep headers) and sign-in. Yalla and Rec Check are now installed through SideStore (Yalla had been installed by iloader, so SideStore's Refresh All failed on it with "Invalid parameters"), so **Refresh All renews all of them**; everything is valid until 3.12, same certificate 60FA. Nightly automation set 26.11 (Shortcuts reinstalled): every day 4:46 AM → LiveContainer "Refresh All Apps", Run Immediately; tested, it renews Yalla and Rec Check. **It does not renew LiveContainer itself** ("FetchProvisioningProfilesOperation: context.targetAppBundle is nil"; the old `com.SideStore.SideStore` entry fails with "Could not locate signing certificate"): LiveContainer is renewed when SideStore shows "Resign SideStore" → Resign Now → Keep App Extensions (Use Main Profile). LiveContainer valid until 3.12, open item before then. Details and every error: skill `~/.claude/skills/iphone-sideload` (REFERENCE.md).

## 5. Next, in order
- **Meeting 9 recording:** Ariel is about halfway through; add what he sends to lesson "מפגש 9" (`scripts/insert-meeting-9-oral.ts` pattern).
- **Open notes from 24.11:** a chatifai-checked paradigm for אִשְתַרַא / יִשְתְרִי (verbs live in `verb_conjugations`, not cards); chatifai check of meeting 10's 22 cards; idea: particles (בַּעֵד מַא, קַבֵּל מַא, עַשַאן…) should recur more often.
- **MuFeed differences:** `docs/mufeed-review-2026-11-20.md` (250 left unchanged, mostly conventions; the 68 letter ones were reviewed with Ariel).
- **About 17.12: run `npx tsx scripts/forms-report.ts` and show Ariel** (סבב צורות beta; how to read it is in the script's header). If it says not enough data, run it again 3 weeks later.
- **תרגול יומי** (spec [practice-daily.md](practice-daily.md), approved 11.11): one button at the top of תרגול, a 10-minute session of short mixed rounds from the current meeting (inflections, translation both ways, a dialogue), say-then-reveal, audio from class clips, streak. Ready for Sonnet.
1. **Cut the rest of the תפצ'לו episodes into scenes:**
   ```bash
   npx tsx scripts/watch-scenes.ts --file <mp4> --series "תפצ'לו ע(א)לעשא" --slug tafaddalu-<name> --cache <dir> --apply
   ```
   The files are in `ARAVIT/תכנים/תפצ'לו ע(א)לעשא/`.
2. **Single-word translation in a scene** sometimes translates the whole sentence (חַ'לְצוּנַא). Improve the per-word prompt in `scripts/watch-scenes.ts`.
3. **Burned-in subtitles:** classify each playlist in "תכנים" as colloquial, literary or none, and reorder. Start with colloquial.
   - Look for Palestinian or Levantine series that can be downloaded with no burned-in subtitles.
   - Burned-in Hebrew ruins practice.
4. **Watch, stage 4:**
   - A bar that hides burned-in subtitles.
   - YouTube playback.
   - Import 10–20 short clips from videosinarabic (permission given; embedding is blocked, so download).
   - "קטע היום" at the end of the daily review.
   - Attach the video clip to the card it came from.
5. **chatifai checks when it is back:**
   - All the unverified cards: רים פרג', מפגש 7, oral meeting 4.11, pp. 87–98, 304–305, Preply Roa (1 and 2), the cards added from videos, the 7 smoking cards (7.11).
   - The situation "שיר שאני אוהב".
6. **Deck typos waiting for Ariel's approval:** אִלְחַאּ' מַעַכּ, גֹ'וֹז, דַפַעְת עַן חַאלי.

## 6. Open questions for Ariel (from notes, status open)
- **מפגש 4.11:** ביזבט ושתייה, מחל פי, the past of "הוא אהב", "אבא שלי רוצה שתבואו למסעדה שלו", (זבן), תנקיד.
- **מפגש 6:** 'רח יעפיכ', 'ואדא חכמי ל-מות', 'אלי כנת'. Find the video "חכמת המדבר". Words from after he left the meeting.
- **מפגש בעפ 5:** ביג'נם, 'שאבן עילו ליחייה', 'ווז' היא ליח'יה'.
- **מפגש 8:** يوم الثلاثاء (literary or spoken). The past form of אִנְתִי on p. 124. Gaps between what he heard and what chatifai pointed.
- **Cards:**
  - בִּדִי is listed as "התחיל" but means "אני רוצה".
  - הַ(א)לְוַלַד/הַ(א)לְבִּנְת needs splitting.
  - 5 cards have broken transliteration (שוּ אִקְצַתַכ and others).
- **Missing tables:** there is no table of place words (פוֹק, תַחְת, קֻדַּאם…). (פַחַץ and מִסֵכּ are in the drill since 20.11, from the book.)
- **Songs:**
  - New songs in the playlist need their lyrics pasted (Inez, TUL8TE and others).
  - The 11 existing songs hold Latin transliteration instead of Hebrew.
- **מפגש בעל פה 11.11:** צ'לַּתְלְנַא חַ'מֵס דַּקַאיֵק ("דלתנא"): ضلتلנא or ضل إلنا? יִחְ'רֵבּ בֵּיתַכּ: he wrote יוחרוב, Ronen says yikhrib; which does he hear?
- **מפגש 8 (10.11):** what is אלי ביראיתכ? "עשאן טרוד עלה" = so that I (אַרֻדּ) or you (תְרֻדּ) answer him? ארה"ב: he wrote אלאומאם אלמותחידה, which is the UN; the US is (א)לְוִלַאיַאת (א)לְמֻתַּחִדֵה. "באיש מהמת..." was cut off. None of these went in.
- **Roa 2:** what is חַפְלֵת בְּלַאיְז (حفلة بلايز)? And שַחְטַה (شحطة) came with no meaning.
- **Words for the translation list** (tag "מילה לתרגום"): טַיַרַאן, מֻבַּאשַר, אִיזַא, וְאַחְיַאנַן, תוּצַל, לִף.

## 7. Ariel's ideas (not built yet; full text in `notes`)
- **Video player in Lingopie style, for all content:**
  - Videos, recordings, songs, and series without subtitles: automatic subtitles from an episode file.
  - A saved word becomes a card together with its video clip.
  - Compare Soniox and ElevenLabs.
- **Bridge / anchor experiment:** new cards split half and half with statistics collected (docs/learning-plan-2026-11.md).
- **Semantic fields from daily life:** pull purchases from email or Amazon and build word groups by place (kitchen: kettle, microwave…). Mindset: name everything you see. (docs/semantic-fields.md)
- **AI phone calls:** the app calls as if it were mother or a friend and talks in Arabic. For the final app, not now.
- **Notifications for new features:** "האם התאמנת על שיחה היום?" with a button that opens 3 random situations.
- **Conversation simulations built from all the cards:** a strong model derives building blocks for several kinds of conversations.
- **Social feed:** reels in Arabic (Instagram/Facebook, for example the girl who cooks).
  - **Twitter/X research (7.11):** [twitter-feed-research.md](twitter-feed-research.md). The X API on pay-per-use costs about $15/month for 3,000 posts. His following list adds 10 Gazan dialect accounts (Jerusalem/Jaffa voices still missing); most dialect content is on Instagram/Facebook, not X. MVP built 8.11 (see Done), Ariel approved importing from X. Waiting for his feedback and an `X_BEARER_TOKEN`.
- **Playlists over 15 videos:** need a YouTube Data API key (ג'ארכ קריבכ, סלם ותעלם, תעלם ותכלם).
- **Offline:** done for review (service worker plus the iPhone app). Not done for the other screens.
- **Forms round (22.11):** beta built 25.11, plural only ([forms-round.md](forms-round.md)); feminine waits for a source.
- **Practice beyond the daily review:** a red dot exists. A popup or "next practice" is still open.
