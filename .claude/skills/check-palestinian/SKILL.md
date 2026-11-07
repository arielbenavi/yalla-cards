---
name: check-palestinian
description: Check that a card's Arabic and nikud are spoken Palestinian, not literary (فصحى) or another dialect, against outside sources — Madrasa's spoken-Arabic dictionary and Wiktionary's South Levantine entries — separately from chatifai. Use whenever new cards are added from general knowledge, ChatGPT, a song or a video, when Ariel asks "is this really Palestinian?", and before choosing between two forms of a word. Update its Lessons after every use.
---

# Checking that a card is spoken Palestinian

chatifai (the course bot) is often down, and nikud from general knowledge
drifts toward literary Arabic: the first smoking cards had دخّن where
Palestinians mostly say شرب سيجارة, ג' in סיגארה, and تتن for tobacco.
This skill gives every card a second and third opinion.

## Sources, in order of trust

1. **Ronen (the teacher) and the course book.** The final word. A conflict
   between the sources below goes to Ariel as a note for Ronen.
2. **Madrasa** — https://milon.madrasafree.com, spoken Arabic for Hebrew
   speakers, Hebrew-letter nikud. Search: `/default.asp?searchString=<עברית>`.
   Broad coverage. **Ronen says it is sometimes imprecise**: treat it as one
   voice, not the judge. Its pointing conventions differ from ours (קמץ, ج as
   ג without geresh in loanwords such as סִיגַארַה) — translate to our
   convention in STATE.md §2.7, don't copy blindly.
3. **Wiktionary, South Levantine Arabic** (`ajp`) — the `==South Levantine
   Arabic==` section of the Arabic headword page
   (`https://en.wiktionary.org/w/index.php?title=<arabic>&action=raw`), and the
   `South Levantine Arabic:` line in English pages' translation tables. Small
   coverage, but when it has an entry it is Palestinian/Jordanian specifically,
   with Latin transcription. Also has a few proverbs
   (Category:South_Levantine_Arabic_proverbs).
4. Not usable automatically: Living Arabic (Levantine dictionary needs a
   login), Elihay's Palestinian dictionary (print only — a gold reference if
   Ariel has it).

## Procedure

1. Run the script on the new cards (dry run first):
   ```bash
   npx tsx scripts/check-palestinian.ts --lesson "<lesson title>"
   ```
   or `--ids a,b,c`. It searches Madrasa by each part of the Hebrew meaning and
   Wiktionary by each part of the Arabic, and prints ✓ / ✗ / – per card.
2. Read every line, not only the flags. Madrasa often lists **more than one
   form** (מצית: قدّاحة and ولّاعة; עישן: دخّن and شرب) — the everyday one may
   be the second. A ✓ on a literary form is still worth a note.
3. For ✗: fix a card that was created today (no reviews yet) when two
   sources agree against it; otherwise open a `notes` row for Ariel with what
   each source says. Never touch FSRS state. Back up before deleting.
4. Store the result: rerun with `--apply` (writes `cards.dialect_check`).
   Write "תואם מדרסה" in the card note where it matched.
5. Add what you learned to Lessons below.

## Lessons

- 2026-11-07 (smoking cards): Madrasa matched 5 of 7. It caught تتن (→ تبغ
  תַבַּע'; for nargila تمباك תֻמְבַּאכּ) and ג' in סיגארה. Wiktionary had a
  South Levantine entry only for دخّن (daḵḵan). Phrases (ممنوع التدخين)
  are not in either: they need Ronen or chatifai.
