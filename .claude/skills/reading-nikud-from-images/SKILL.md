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
