# Pull a dialect X feed, cheaply and legally

Research date: 2026-11-07. Sources: two research notes (accounts, access). Status: research only, nothing built.

The plumbing is easy, but the content is not there yet. The official X API now runs on pay-per-use, and reading about **3,000 posts a month costs about $15** with no ToS risk, so a Vercel cron plus a `since_id` poll is the recommended route. The account list is the weak part. Only **three handles could be verified**, because search engines don't index X profiles and browsing x.com directly was not possible in this session. The more important finding is that **spoken Palestinian text mostly doesn't live on X**. X reaches about 10% of Palestinians, against about 40% for Facebook and about 30% for Instagram ([DataReportal 2024](https://datareportal.com/reports/digital-2024-palestine)). The large Palestinian X accounts are news and activism written in فصحى or English. An X feed is therefore worth building only once Ariel has confirmed about 15 live, dialect-heavy accounts himself. Until then, the Instagram/TikTok track already planned in `docs/arabic-feed.md` is the better source of dialect.

## X carries news, while the dialect is on Facebook, Instagram and TikTok

The audience numbers explain the gap. In early 2024 X reached 548k people in Palestine, Facebook 2.2M and Instagram 1.6M ([DataReportal](https://datareportal.com/reports/digital-2024-palestine)), and Meta was still dominant in 2026 ([NapoleonCat](https://stats.napoleoncat.com/social-media-users-in-state_of_palestine/2026/)). The colloquial voices the research did find posted elsewhere. Rahat satirist Anas Abudaabes posted on **Facebook** ([+972](https://www.972mag.com/meet-the-palestinian-man-arrested-for-being-sarcastic/123420/)), and Gaza comedian Ali Nassman's main channel was **Instagram** ([Gulf News](https://gulfnews.com/world/mena/palestinian-actor-and-activist-ali-nisman-killed-in-gaza-raid-evoking-social-mourning-1.98781234)). The biggest Palestine account on X, Eye on Palestine, is an activist news feed ([TRT World](https://www.trtworld.com/magazine/how-the-internet-s-leading-account-on-palestine-maintains-its-message-53741)), and the best-known Palestinian Twitter humor was in English ([Global Voices](https://globalvoices.org/2013/11/05/palestinian-pick-up-lines/)). On X, dialect shows up mostly in replies and on ordinary personal accounts, which is exactly the content no web search can find. Several of the best-known Gaza voices have been killed, so their accounts are archives and not live feeds.

The dialect shares below are judgment, not measurement: no source measured dialect against فصحى for any account, and 2025–2026 activity could not be checked.

### Verified handles (3)

| Handle | Who | Dialect vs فصحى | Region | Activity |
|---|---|---|---|---|
| Instagram `@ali_nassman` (no X handle found) | Ali Nassman, satirist and actor ([Airwars](https://airwars.org/?p=96081)) | Dialect-heavy (Gazan sketches) | Gaza | Killed Oct 2023, so an archive of mostly video |
| X `@WaelDahdouh` | Wael Dahdouh, Al Jazeera Gaza bureau chief ([Indie Media Awards](https://indiemediaawards.substack.com/p/wael-dahdouh?open=false)) | Mostly فصحى | Gaza | Active public figure in 2026 ([Dzair Tube](https://www.dzair-tube.dz/en/algerian-ambassador-extends-condolences-solidarity-to-palestinian-journalist-wael-dahdouh)) |
| X `anasalsharif0` | Anas al-Sharif, Al Jazeera correspondent ([Airwars record](https://airwars.org/source/x-com-anasalsharif0-1743931749015359518-2024-01-07-094504/)) | فصحى with some dialect | Gaza | Reported killed Aug 2025 (not re-confirmed), so dormant |

None of the three is a Jerusalem/Jaffa dialect source that is still posting on X.

### Dialect-heavy people with no handle found

| Person | Who | Region | Where they actually post |
|---|---|---|---|
| Imad Farajin / عماد فراجين | Comedian, cast of the dialect satire show وطن ع وتر ([elcinema](https://elcinema.com/en/person/2153903)) | al-Arroub, Hebron | Unknown, TV/YouTube |
| Nidal Badarny / نضال بدارنة | Stand-up comedian and playwright, touring Haifa and Akka in 2025 ([tzkrti](https://tzkrti.com/en/events/902)) | Arraba, Galilee (48) | On stage |
| Mohammad Naameh / محمد نعمة | Stand-up comedian, plays largely to Hebrew audiences ([Kan/Makan](https://www.kan.org.il/makan/content/news/makan-news/p-11254/452790/)) | Deir al-Asad (48) | On stage |
| Alaa Abu Diab / علاء أبو دياب | Stand-up comedian ([tzkrti](https://tzkrti.com/alaa-abu-diab)) | Unknown | Unknown |
| Anas Abudaabes | Journalist and satirist ([+972](https://www.972mag.com/meet-the-palestinian-man-arrested-for-being-sarcastic/123420/)) | Rahat, Negev (48) | Facebook |
| Saleh Aljafarawi / صالح الجعفراوي | Influencer narrating video in Gazan dialect, 250k+ on X, reported killed 2025 ([Siasat](https://www.siasat.com/instagram-removes-slain-journalist-saleh-al-jafarawis-account-3283047/amp/)) | Gaza | Instagram (removed), X archive |

### Handles from memory, unverified (check on x.com before use)

| Possible handle | Who | Language | Region |
|---|---|---|---|
| `@Ahmad_tibi` | Ahmad Tibi, MK, very active on Twitter ([+972](https://www.972mag.com/mk-ahmad-tibi-ex-settler-leader-dayan-duke-it-out-on-twitter/)) | فصحى with dialect quips, plus a lot of Hebrew | Taybeh (48) |
| `@AyOdeh` | Ayman Odeh, Hadash leader ([Maki](https://maki.org.il/en/?p=32469)) | Arabic and Hebrew | Haifa (48) |
| `@muna_kurd`, `@m7mdkurd` | Muna and Mohammed El-Kurd ([Hespress](https://en.hespress.com/26601-palestines-el-kurd-twins-feature-in-times-magazine-most-influential-list.html)) | Muna: Jerusalem-dialect video, mainly on Instagram. Mohammed: English | Sheikh Jarrah, Jerusalem |
| `@TamerNafar` | Tamer Nafar, rapper (DAM) | Dialect, Hebrew and English | Lod (48) |
| `azaizamotaz9` | Motaz Azaiza, photojournalist | English and Arabic, mostly images | Gaza |

The research also dropped some accounts as poor fits. These are mostly-English journalists (Hind Khoudary, Plestia Alaqad, Mariam Barghouti, Basel Adra, Bisan Owda) and فصحى news accounts (Tamer Almisshal, QudsN, Shehab). The target of 20–40 verified dialect accounts was **not reached**.

**Next step to finish the list:** Ariel spends 10 minutes on x.com building one **public X List**. He can start from the names above, open each profile to check that it is live and how much of it is dialect, and add accounts that show up in their replies. He then sends the list URL. The List is also the input that the fetch step polls. A later session with browser access could do the same check instead.

### Update 7.11: Ariel's own following list (@PudaBeats)

Ariel's account follows 317 accounts. The ambiguous accounts were rechecked on 8.11 after he turned translation off. 33 of them are Arab, Palestinian or Israeli Arabic-speakers. About 6 recent posts from each were read in his logged-in Chrome (read-only).

The account has Grok auto-translation on, so many Arabic posts showed up in English. The Arabic share below is therefore a lower bound. "Last" is the newest post on the profile and may be a pinned post. Almost all of these accounts are Gazan, and Gazan dialect differs from Jerusalem/Jaffa (for example ق, and some vocabulary), so the cards still need a Jerusalem check.

**Dialect-heavy (candidates for the List):**

| Handle | Who | Sample | Arabic share seen | Last |
|---|---|---|---|---|
| `@Suliman_y0unis` | Gaza, computer engineer | دخلت فترة بعدت عن كل اشي… انو اركز… وهيك | 4/6 | 2026-10-28 |
| `@aya_megahed12` | Gaza, everyday life | عرايس ثوب الفرح بيجننوا نيالكم / ظلو مفهمينا | 6/6 | 2026-11-06 |
| `@DimaAbuuMousa` | Gaza | من ثلاث سنين وإحنا بنقول: يومين وراجعين… ولسا | 2/4, plus religious فصحى | 2026-11-05 |
| `@YazanEzzedin` | Copywriter (Arabic marketing) | مش فاضي لمنصة x… قبل لا تستخدم هالأداة | 5/6 | 2026-04 |
| `@MysaraGaza` | Gazan expat, "Gazan content" creator, satirical | اصبر شوية احتمال يلومونا احنا / محتارين يلوموا… | 6/6 | 2025-12 |
| `@kamelshiakh22` | Gaza, designer | هادا رابط… الخاص فيا / لما عيط هو مقامش يحضنه ليه | 6/6 | 2025-05 |
| `@Ahmed_marzouq19` | Palestinian, medicine | صباح الخييير يا اهل الخير ردو الصباح علينا | 2/6 | 2026-09 |
| `@ibrahimzaeem23` | Palestinian | فهموني بس كيف بتسافروا؟؟ / هداك الوقت | 6/6 | unclear (2023 pinned?) |
| `@Gazabibliophile` | Gaza, reader | معلش لازم نفرح عشان… | 3/6, mixed | unclear |
| `@Xgazag` | Gaza | short, mostly quote-posts | 6/6 | 2025-11 |

**Mostly فصحى, news, English or not Palestinian:**
- **News or فصحى:** `@WaelAboOmer` (Gaza journalist, posts daily, news), `@NajiS1911`, `@Muhanned27027`, `@mohabusaif` (فصحى and religious, some dialect).
- **English:** `@motazazaiza9` (confirmed; it corrects `azaizamotaz9` above), `@Almeqdad`, `@HowidyHamza`, `@afalkhatib`.
- **Rechecked 8.11 with translation off:** `@Almeqdad` (Arabic, mostly فصحى with dialect asides like الله يلعن العالم), `@HasanDorr` (political writer, mixed, Levantine; region unconfirmed), `@WaelAboOmer` (short Arabic news captions), `@Hanzpal2` (news updates), `@ustafa_ad` and `@ahmedhijazee` (فصحى), `@HowidyHamza` and `@henoouda_` (English).
- **Not Palestinian dialect:** `@7anaf22` writes Egyptian (ده، احا، هحاول).
- **Dormant:** `@hassan1sms` (2014), `@AnasAlSharif0`, `@HossamShabat` (both killed).
- **Confirmed handle:** `@AyOdeh` is followed.

**Result:** 10 dialect candidates, all ordinary Gazan accounts. Jerusalem/Jaffa/48 voices are still missing.

## The official API wins on fragility, and the scrapers win on price

| Option | Cost for ~3,000 posts/month | Fragility | Verdict |
|---|---|---|---|
| **Official X API, pay-per-use** | **~$15**. Post read is $0.005, a re-read on the same UTC day is free, and the cap is 3M posts/month ([docs.x.com](https://docs.x.com/x-api/getting-started/pricing)). Sign-up credits of up to ~$70 may cover the first months ([OpenTweet](https://opentweet.io/x-api-pricing), third-party) | Low, and ToS-compliant | **Recommended** |
| List and profile embeds | $0 | Often render "Nothing to see here" when logged out or on Safari/iOS ([HEPData #777](https://github.com/HEPData/hepdata/issues/777)). They are cross-origin iframes, so words can't be made tappable | Unusable |
| oEmbed, one post at a time | $0, with no auth and no rate limit ([docs.x.com oEmbed](https://docs.x.com/x-for-websites/oembed-api)) | It can't list an account's posts, so the IDs have to come from somewhere else | Good for pasting a single post by hand |
| Nitter / RSSHub | $0 plus a server | X sent Nitter a cease-and-desist and the repo was archived in 2026 ([zedeus/nitter](https://github.com/zedeus/nitter)). Both need X session tokens that X can ban | Avoid |
| RSS.app | ~$17 (Developer plan, 100 feeds) ([rss.app](https://rss.app/pricing)) | X support per plan not confirmed | Costs more than the API |
| twitterapi.io / SocialData | ~$0.50–5. $0.15 and $0.20 per 1K tweets ([twitterapi.io](https://twitterapi.io/pricing), [SocialData](https://socialdata.tools/)) | Unofficial scrapers that break X's ToS and can vanish | Fallback only |

**Recommendation:** use the official API. Poll `GET /2/users/{id}/tweets` for each account with `since_id` and `exclude=retweets,replies`, or poll Ariel's List with `GET /2/lists/{id}/tweets`. Cap spend in the X Developer Console at **$20/month**. The real cost will probably be well under $15, because a short list of dialect accounts posts far fewer than 3,000 times a month. Two points are unconfirmed: whether an empty poll is billed $0, and the rate limits for 2026. Put the fetcher behind a small interface so twitterapi.io can be swapped in if the price becomes a problem.

## It fits the app as one table, one cron and the watch page's word sheet

This plan reverses one decision. `docs/arabic-feed.md` (2026-10-26) ruled out "API keys or automatic import from … X" and sends tapped words to the inbox. Ariel should confirm the reversal. If the earlier design is still the plan, store posts as `feed_items` rows with `platform='x'` instead of adding a second table.

**Storage.** A `feed_posts` table holds `x_id`, `author`, `text_ar`, `posted_at`, `words jsonb`, `seen_at` and `verified=false`, added in a new migration and applied with `npx tsx scripts/migrate.ts`. It stores text only. Supabase is at about 860MB of its 1GB, so keep only posts that are mostly Arabic, and prune unopened posts after 30 days. At a few KB per post this stays in the low tens of MB.

**Fetch.** A Vercel cron runs 1–3 times a day, reads the newest `since_id` per account, fetches new posts and inserts them.

**Transliteration.** Each new post then goes through one LLM call (Gemini, as in `scripts/watch-scenes.ts`). For every word it returns Hebrew transliteration with nikud plus a short Hebrew gloss, stored in `words`. All of it is labeled **משוער** in the UI and is never treated as verified nikud; only chatifai or Ariel can verify it. At this volume the call costs cents per month (an estimate; it was not priced in this research).

**Page.** A "פיד" page under תכנים reuses the `Line`/`PhraseSheet` pattern from `app/watch/[slug]/page.tsx`. `buildWordIndex`/`lookupWord`/`sentenceWords` from `lib/word-lookup.ts` match each tapped word to an existing card.

**Adding words.** An unknown word goes to the existing `POST /api/watch/add-card`, which creates an unverified card in lesson "נוסף מסרטונים (לא מאומת)" with `chatifai_verified=false`. Alternatively, it goes to the inbox, as the feed design specified.

**Rules.** Changes are additive only. The feed reads FSRS state and never writes it, except for the `card_srs` row of a newly added card.

**Running cost.** About $15/month for X at most (likely less), cents for the LLM, and $0 extra on Vercel and Supabase.

## Conclusion

The cheap, stable pipe exists. The scarce resource is a verified list of accounts that post spoken Jerusalem/Jaffa or 48 dialect on X, and the evidence suggests there are few of them. Ariel's 10-minute List is the go/no-go test. If he finds fewer than about 10 live dialect accounts, skip X and put the effort into the Instagram/TikTok item flow, where the dialect actually lives. Most of the same transliteration and word-tap code serves both.
