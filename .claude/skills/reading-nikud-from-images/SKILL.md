---
name: reading-nikud-from-images
description: Read pointed Hebrew-letter transliteration (nikud, geresh, dagesh) or Arabic off an image as exactly as possible — book pages, screenshots, photos of notes, video frames. Use whenever words or sentences are copied from an image into cards, notes or data, and update this skill after every use with what went wrong.
---

# Reading nikud from images

Cards are only as good as the pointing typed into them, and a misread mark
looks exactly like a correct one in the deck. A full-page read gets roughly
**one sentence in four** wrong somewhere: pp. 304–305 had 12 errors in 22
sentences and words, all caught by the zoomed second pass (2026-10-30). This
skill is the procedure that catches them. It is also a log: **every time you
use it, add what you found to "Lessons" at the bottom** and fix the procedure
if a step failed.

## The procedure

1. **Map the page.** Look at the whole image once to see which lines matter
   (e.g. the bold pointed lines, not the Hebrew instructions).

2. **Split into lines, upscaled.**
   ```
   python3 -I .claude/skills/reading-nikud-from-images/lines.py PAGE.png <scratchpad>/lines --scale 2
   ```
   On the course book, pointed lines come out ~44px tall and plain Hebrew
   instruction lines ~26px, which is how you tell them apart in the listing.
   For a doubtful word, crop it alone at 4×:
   `lines.py PAGE.png OUT --word X0 X1 Y0 Y1 --scale 4` (fractions of the page).
   Upscaling does not add detail (book pages are ~1600px wide), but it makes
   the dot geometry legible. If a mark is still ambiguous at 4×, say so rather
   than pick one.

3. **First read: letter by letter.** For each letter, write consonant, dagesh,
   vowel, geresh, in that order. Don't read words as words: a word you know
   pulls the eye toward its familiar pointing, and the book often points it
   differently (אֻסְבּוּע, not אִסְבּוּע).

4. **Second read: against the crop, not from memory.** Put the string you
   typed next to the line image and walk it mark by mark, checking the traps
   below. This pass found every one of the 12 errors on pp. 304–305.

5. **Cross-check the deck.** Query the same word's existing cards (by Arabic
   skeleton, as in `scripts/insert-book-p304-305.ts`). Agreement with an older
   card from the same book is strong evidence. Disagreement means look again,
   since the old card may be the wrong one.

6. **Lint the characters.**
   ```
   python3 -I .claude/skills/reading-nikud-from-images/lint.py "line" "line" …
   ```
   It catches typing errors that no amount of looking at the image will: an
   Arabic shadda (U+0651) in place of a Hebrew dagesh (U+05BC), two vowels on
   one letter, ׳ instead of ', and final letters mid-word.

7. **Mark what is still unverified.** Insert with `chatifai_verified = false`
   and keep an open note to run the batch through the chatifai agent when it
   works (it was down from 2026-10-28: Railway 404). For the course book, the
   page outranks chatifai. A disagreement sends you back to the image, not to
   chatifai's version.

8. **Update this skill.** Add a dated line to Lessons: page, how many errors
   the second pass caught, and which kind. If an error type is new, add it to
   the traps. If a step was useless or missing, change the procedure.

## The traps (by how often they happened)

| Looks like | Is often | How to tell |
|---|---|---|
| three dots, any | segol ֶ vs kubbutz ֻ | segol is a triangle (two on top, one under); kubbutz is a diagonal line of three |
| two dots | tsere ֵ vs sheva ְ | tsere is side by side, sheva is one above the other |
| one dot under | hiriq ִ vs a stray mark | hiriq sits under the letter's centre; check it isn't the next line's mark |
| a letter with a dot inside | dagesh vs nothing | compare with the same letter elsewhere on the line; the book also uses a shadda-like sign over letters (ّ) for doubling |
| וּ / וְ | shuruk vs vav + sheva | the dot is inside the vav for וּ, under it for וְ |
| אִלְּי | אִלְלִי | the book writes the doubled lamed as two letters |
| ב / בּ | dagesh missing | ב here is always ب, so always בּ: never leave it to read as v (Ariel, 2026-11-05) |
| ן / וְ | final nun vs vav + sheva | צַ'וְ read as צַ'ן: look for the sheva under a word-final stroke |
| ֵ under a low letter | tsere vs kubbutz | בַּכְּתֻבּ read as ֵ: three dots with one trailing can look like two at 2× |
| פ with a "dot" | the glyph's own curl | bold פ always looks dotted: not a dagesh unless the book's other פ differ |
| ח' / ח | geresh missing | خ is ח' in this deck; ض is צ' in the book, ד' in some older cards |

## Course book conventions (המדרשה)

- Definite article as (א)ל / (אל) in parentheses; keep the parentheses.
- First person singular past ends in -ֵת: דַח'לֵת, חַלַקֵת. Third person
  feminine is -ַת: טַלְבַּת, דַפְעַת.
- אֻסְבּוּע, חֻ'טְבֵּה, מֻמְתַאז, אִנְתֶ, הֶנַאכּ, אִלְלִי, וַצֵ'ע, צַעֵבּ, חִ'לַאל.
- The book gives no Arabic script for its sentences. Arabic we write ourselves
  is the least certain part of a card, so say so in the note to chatifai.

## Lessons

- 2026-10-30, pp. 304–305 (20 sentences + words): 12 errors caught by the
  second pass. Six were segol/kubbutz read as hiriq or shewa (אֻסְבּוּע ×3,
  חֻ'טְבֵּה, מֻמְתַאז, אִנְתֶ ×2, הֶנַאכּ ×2), two were tsere/sheva (חַלַקֵת,
  וַצֵ'ע, צַעֵבּ), plus אִלְלִי ×2, וְ for וּ, חִ'לַאל and a dagesh the page
  doesn't have (נְּהַאר). The first read was from a full page at ~1×, so the
  per-line split (step 2) is now mandatory.
- 2026-11-01, pp. 103–108 (מפגש 7: 33 table pairs, 24 sentences): stacked
  three 2× lines per image (`mont_*` in the scratchpad) — 16 reads instead of
  45, legible enough for everything except four spots, which got 4× crops.
  Two traps: the crop cut off the right-hand column of the table (crop the
  margins only on the left, or read the column from a separate crop), and an
  Arabic string picked up a Hebrew letter while typing (أكيד) — the linter only
  checks the Hebrew side, so a mixed-script check now runs on the Arabic too.
  New book forms seen: יַחִ'י (with geresh), אִלִּי with a shadda here vs אִלְלִי
  on p. 304 (the book is not consistent: copy each occurrence as printed),
  וֻמַחְ'לִצְתֶש (the conjunction as וֻ).
- 2026-11-01, pp. 105 and 108, second pass (14 sentences): the halves of a
  stacked 2× montage (right/left, ~1450px each) were legible enough; 4× crops
  settled seven marks. Two things to remember: `lines.py` did not create its
  output folder (now it does), and **guessing crop coordinates from a scaled
  preview misses the word**: crop by fractions of the line image instead. Book
  forms: p. 105 writes the preposition as בִּ(א)ל / בִּ(אל) with a hiriq, p. 108
  as בְּ(א)ל: copy each page as printed. Also (א)לִבְּצַ'אעַה (hiriq under the
  lamed), דֹכְּתוֹר (holam), הֻםֵּ, מַדְרַסַתֵש.
- 2026-11-03, pp. 104, 107, 110–112 (68-item word list, 32 table cells): the
  scratchpad had been cleared, so re-split from the book folder
  (`CUNI/CUNI/ARAVIT/המדרשה_ספר_מחולק_לתמונות/N.png`) and never rely on old crops.
  The 2× montage changed nothing on the list pages; a further 2× crop of the
  table column fixed one guess: הֻוֵּ is מַמְסִכֵּש (sheva on the second mem) but
  הִיֵּ and הֵםּ are מַמִסְכַּתֵש, מַמִסְכּוּש (hiriq). Similar cells are not parallel,
  so don't copy one row's pointing to the next. The book's word lists carry
  printed plurals: check them before writing any plural from memory.
- 2026-11-04, Ariel's handwritten class notes (two tablet images, ~1300px): lines.py
  is not for handwriting, so fixed crops at 3-4× instead. The zoom changed four reads:
  the "now" list is אִסַּא and אַסַּה (his handwritten א looks like ע or ה at 1×), and
  the sentence has גִ'יבְּתִלַכּ with a ב that his typed version (ג׳יתלכ) omits. Handwriting
  outranks his typing of the same word. In handwriting the marks drift off their letter,
  so compare the same letter across the page before assigning a dot.
- 2026-11-04, burned-in subtitles of a 720p video (מינרוה, "המזל הרע", 31 lines): one crop
  per subtitle, found by scene changes in the text band (`ffmpeg select='gt(scene,0.02)'`),
  each line split into right and left halves at 2.5×. Minerva's letters are not ours: ס with
  a tilde is ص, ד with a tilde is ض, ז with a tilde is ظ, and bold marks stress. Take the
  consonants from the printed Arabic and only the vowels from the Hebrew line. It often leaves
  a letter unpointed where we would write a sheva, so don't add one as if it were printed.
- 2026-11-05, pp. 306–310 (12 verbs × 12 cells, 20 sentences): crops of half a table missed the
  column between them and the top rows, so crop by column too. A 3× crop of the פִעֵל verbs settled
  הֻוֵּ, printed with two hiriqs (מַפִשִלֵש), unlike the p. 107 מַמְסִכֵּש. The dots under מ in the
  participle rows run diagonally, so it is מֻש, not the מֵש I typed from p. 108 (7b); those older
  cards are worth a look. One cell is printed מַש: copied as is, and flagged.
- 2026-11-05, blind test (train.md), 100 chatifai-verified entries on clean print at 2.4×: 90 exact
  with one careful read, no second pass. Of the 10 differences, 3 were typos in the deck (a dagesh on
  א, two vowels on one letter, a missing hiriq) and 7 mine: hiriq/sheva and tsere/segol once each,
  tsere/kubbutz, kubbutz/sheva, patach/sheva, a missed dagesh on ס, ן for וְ. So about 1 word in 14
  is wrong before the second read, always a single mark and mostly a vowel under a narrow letter:
  zoom further on those. Clean print is a ceiling; book scans are harder. Knowing a word pulls the
  reading: אִסַּהֵל lost its dagesh that way.
