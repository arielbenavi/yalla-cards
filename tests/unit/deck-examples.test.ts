/**
 * Run: npx tsx tests/unit/deck-examples.test.ts
 */
import { buildExampleIndex, exampleFor } from "../../lib/deck-examples";
import { clozeHint } from "../../lib/focused-practice";
import { heardScore, soundKey, soundSimilarity } from "../../lib/clip-match";
import assert from "node:assert";

const card = (id: string, item_type: string, arabic_script: string | null) => ({
  card_id: id,
  item_type,
  arabic_script,
  translit_nikud: id,
  hebrew_meaning: id,
});

const word = card("w", "word", "البيت");
const bare = card("b", "word", "بيت");
const sentence = card("s1", "sentence", "هادا البيت كبير كتير");
const other = card("s2", "phrase", "بيت جدي في القدس");
const short = card("s3", "phrase", "بيت كبير");
const index = buildExampleIndex([word, bare, sentence, other, short]);

assert.equal(exampleFor(bare, index, 0)?.card_id, "s1", "finds the word with its article attached");
assert.equal(exampleFor(bare, index, 1)?.card_id, "s2", "a different sentence on the next day");
assert.equal(exampleFor(card("x", "word", "شمس"), index, 0), null, "no sentence, no line");
assert.equal(exampleFor(sentence, index, 0), null, "only word cards get one");
assert.equal(exampleFor(card("y", "word", "في"), index, 0), null, "two-letter particles are everywhere");

assert.equal(clozeHint("מִן בַּרַא רְחַ'אם"), "מִן בַּרַא _____");
assert.equal(clozeHint("מַסַא (אל)נּוּר"), null, "two words have no middle rung");

// Whisper hears the same word in the other script
assert.ok(soundSimilarity(soundKey("קַהְוֶה"), soundKey("اهوه")) >= 0.7, "ق as a glottal stop");
assert.equal(soundKey("٤"), soundKey("أربعة"), "digits are spelled out");
assert.equal(soundKey("מַסַא (אל)נּוּר"), soundKey("מַסַא נּוּר"), "the bracketed article is dropped");
assert.equal(heardScore({ id: "c", translit_nikud: "כְּבִּיר", arabic_script: "كبير", hebrew_meaning: "גדול" }, "كبير ربيم اكبر"), 1);
assert.ok(heardScore({ id: "c", translit_nikud: "שַאיְ", arabic_script: "شاي", hebrew_meaning: "תה" }, "حمام") < 0.5);

console.log("deck-examples: ok");
