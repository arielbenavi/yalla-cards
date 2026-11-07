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
   - Write `supabase/migrations/00XX_*.sql`, then run `npx tsx scripts/migrate.ts`. The last one is 0033.
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
- **7.11**
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
- **Class transcription** (`npx tsx scripts/auto-clip.ts --hear`) stopped when the old session ended. 3 of 14 were done.
  - Run it again in the background. Groq allows about 2 hours of audio per hour.
  - Then run:
    ```bash
    npx tsx scripts/auto-clip.ts --write
    ```
    ```bash
    npx tsx scripts/clip-speakers.ts --apply
    ```
  - Report how many cards got a clip.
- **Storage:** approved clips are WAV. Compress them to mp3/opus before Ariel approves many more, or the 1GB fills up.
- **iPhone:** renews by itself. The log is at `~/Library/Logs/yalla-reinstall.log`. Ariel is considering the Apple Developer Program ($99), which gives a 1-year signature or TestFlight. `mobile/release.sh` is ready for that.

## 5. Next, in order
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
5. **Restart the transcription** (section 4).
6. **chatifai checks when it is back:**
   - All the unverified cards: רים פרג', מפגש 7, oral meeting 4.11, pp. 87–98, 304–305, Preply Roa, the cards added from videos.
   - The situation "שיר שאני אוהב".
7. **Deck typos waiting for Ariel's approval:** אִלְחַאּ' מַעַכּ, גֹ'וֹז, דַפַעְת עַן חַאלי.

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
- **Playlists over 15 videos:** need a YouTube Data API key (ג'ארכ קריבכ, סלם ותעלם, תעלם ותכלם).
- **Offline:** done for review (service worker plus the iPhone app). Not done for the other screens.
- **Practice beyond the daily review:** a red dot exists. A popup or "next practice" is still open.
