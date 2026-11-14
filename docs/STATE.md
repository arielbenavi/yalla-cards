# yalla-cards: current state, plans and ideas

**The source of truth for a new session.** Updated 2026-11-07. Whoever finishes something updates this file in the same commit: move the item to "Done", or add a new one.

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
   - Write `supabase/migrations/00XX_*.sql`, then run `npx tsx scripts/migrate.ts`. The last one is 0036.
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
8. **Ideas:** every idea Ariel mentions becomes a row in `notes` with tag `idea`, in the same turn.
9. **Teachers:** only רונן counts as a teacher in class recordings. לנדי פרפט is a student.
10. **Cards:**
    - Singular and plural share one card.
    - New cards are not shuffled: order of insertion equals lesson order.
    - The daily queue takes 40 new cards a day.

## 3. Done (latest first)
- **11.11: oral meeting 11.11.26.** New lesson "מפגש בעל פה 11.11.26", 42 cards (`scripts/insert-oral-2026-11-11.ts`, data `scripts/data/oral-2026-11-11.ts`): his notes, the situation with נעמה (10 lines), and 14 items found in the recording's Groq transcript (the payment-delay sentence, אִסְתַתְ'מַר = invest, ע'רַאמֵה, נַיַּאלַכּ, שֻפְתַכּ צֻדְפֵה…). All chatifai_verified=false, pointing "משוער". The recording (61 min) and "הקלטת שיעור 8" (164 min) were imported and transcribed (`import-course-recordings.ts` now tags any file with "מפגש בעל פה" in its name). Tip added: יִחְ'רֵבּ בֵּיתַכּ. The song line from his screenshot stays out (lyrics). `auto-clip --write` then proposed clips for 33 of the 42 (on /recordings/auto).
- **10.11: אימון ממוקד left the תרגול tab** (Ariel); /focused still resolves. He says practice in general "doesn't work for him": open idea note, to talk through before rebuilding the tab.
- **10.11: meeting order.** The current meeting is now the highest book meeting number, not the newest lesson date (מפגש 8's lesson was dated before 7's). Inflection drill, translations and the practice status start from מפגש 8, then 7…1 (`lib/current-meeting.ts`).
- **10.11: navigation reorganised.** Ariel: hard to tell where things are. The tabs are now חזרה יומית · תרגול · פיד · תכנים · עוד (`lib/nav.ts`). The feed has its own tab. The general review left the bar: a link under the daily tip opens it, and the review tab stays marked. "עוד" holds חזרה כללית and אדמין. /today left the menu too (Ariel, same day): the site, login and the iPhone app open on the review; the route still resolves. The videos with transliteration are one component (`components/WatchList.tsx`), shared by /watch and the top of תכנים, with the songs beside them; they left תרגול and the scattered ▶ links. Test: `tests/e2e/content-watch.spec.ts`.
- **10.11: מפגש 8, השלמה.** 85 new cards in "מפגש 8" (`scripts/insert-meeting-8-more.ts`, data `scripts/data/meeting-8-more.ts`): the pp. 132–133 translation drill with the book's answers from pp. 311–312 (20 sentences, course_verified), 59 items from Ariel's oral notes (pointing from his Latin hints, "ניקוד משוער" where not in the book), and the p. 122 forms (בַּעַתְלִי…). 27 were already in the deck. 13 existing cards got the plural he gave (זֻמַלַא, טֻקוּס, תַזַאכֵּר…); backup `scripts/data/meeting-8-more-backup.json`. The p. 122 examples were read in August with a sheva; the page and Ronen's slide have the linking hiriq (רְגִ'עִלְהַא, רְגִ'עִלְכֹּם, כַּתַבִּלְהֹם), now fixed in the paradigm. The new cards' first review is dated 1.1.26 so the daily queue serves them first; the 185 older מפגש 8 cards (never reviewed) were moved right after them on Ariel's yes (`scripts/front-meeting-8-unseen.ts`, `due` only, backup `scripts/data/meeting-8-unseen-due-backup.json`). Tip added: הווה = פַאעֵל. Madrasa agrees with 11 of the new words and contradicts none. `auto-clip.ts` now falls back to curl when a big recording fails to download.
- **8.11**
  - **Feed MVP (`/feed`, its own tab since 10.11):** 59 dialect posts from 9 Gazan X accounts that Ariel follows. Arabic only by default; each post can show its transliteration (משוער) or Hebrew. Tapping a word shows its meaning and card, "+ המילה הבאה" makes a phrase, and admin adds an unverified card (same lesson as video words).
    - Table `feed_posts` (0035–0036). Per-word translit and meanings by Gemini (`lib/feed-annotate.ts`). Seed: `scripts/feed-seed.ts scripts/data/feed-seed-2026-11-08.json`.
    - Daily cron `/api/feed/fetch` (`vercel.json`) pulls new posts through the X API (`lib/feed-accounts.ts`). It does nothing until Ariel opens an X developer account, buys credit (about $15/month) and sets `X_BEARER_TOKEN` (+ `CRON_SECRET`) in Vercel.
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
- **iPhone (14.11): SideStore.** Installed with iloader (Apple ID pudabeats), plus LocalDevVPN; the phone renews the 7-day signature itself. The app is `mobile/build/YallaCards.ipa` from `mobile/build-ipa.sh` (unsigned; SideStore signs it), handed over through iCloud Drive → Files → SideStore. Rebuild only when native code changes, since content loads from Vercel. A free account allows 3 apps per device: SideStore, Yalla, Hindsight (Columbia Rec Check and a second Hindsight were removed). **Not switched yet:** importing into SideStore failed ("No wifi interface satisfied", Ariel was on a hotspot), so Yalla is installed from the Mac again and the launchd job is back on until the switch. The switch steps are in an open todo note. New icon: the site's (arielbenavi.com) two cards with يلا on green; old icons in `scripts/data/old-icons/`.

## 5. Next, in order
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
- **Missing tables:** the object-pronoun tables (פַחַצ, מִסֵכּ) are unreadable in the photo. There is no table of place words (פוֹק, תַחְת, קֻדַּאם…).
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
- **Practice beyond the daily review:** a red dot exists. A popup or "next practice" is still open.
