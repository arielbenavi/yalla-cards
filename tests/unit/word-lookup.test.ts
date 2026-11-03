/**
 * Run: npx tsx tests/unit/word-lookup.test.ts
 */
import { buildWordIndex, lookupWord, sentenceWords, translitKey } from "../../lib/word-lookup";
import assert from "node:assert";

const card = (id: string, translit_nikud: string, arabic_script: string | null = null) => ({
  card_id: id,
  translit_nikud,
  arabic_script,
  hebrew_meaning: id,
});
const index = buildWordIndex([
  card("clinic", "עִיַאדֶה", "عيادة"),
  card("girl", "בִּנְת"),
  card("party", "חַפְלֵה"),
  card("candor", "אִ(ל)צַּרַאחַה"),
  card("two-words", "בִּנְת חִלְוֵה"),
  card("house", "בֵּית", "بيت"),
]);
const find = (text: string, arabic: string | null = null, self = "") => lookupWord({ text, arabic }, index, self);

assert.equal(translitKey("(א)לְעִיַאדֶה"), "לעיאדה");
assert.equal(translitKey("זְ׳בַּרְגַ'ד"), "ז'ברג'ד");

assert.deepEqual(find("אִ(ל)צַּרַאחַה").cards.map((c) => c.card_id), ["candor"]);
assert.equal(find("אִ(ל)צַּרַאחַה").sure, true);
assert.deepEqual(find("בִּ(א)לְעִיַאדֶה").cards.map((c) => c.card_id), ["clinic"], "bi + the article");
assert.equal(find("בִּ(א)לְעִיַאדֶה").sure, false, "through a prefix is a maybe");
assert.deepEqual(find("בִּנְתוֹ").cards.map((c) => c.card_id), ["girl"], "possessive ending");
assert.deepEqual(find("חַפְלֵת").cards.map((c) => c.card_id), ["party"], "construct ת");
assert.deepEqual(find("לא-קיים").cards, []);
assert.deepEqual(find("xxx", "البيت").cards.map((c) => c.card_id), ["house"], "Arabic finds it when the spelling doesn't");
assert.deepEqual(find("בִּנְת", null, "girl").cards, [], "never the card you are on");

assert.deepEqual(sentenceWords("שֻפְת (א)לְבֵּית, יַא זַלַמֶה?", "شفت البيت يا زلمة؟").map((w) => w.text), ["שֻפְת", "(א)לְבֵּית", "יַא", "זַלַמֶה"]);
assert.equal(sentenceWords("שֻפְת (א)לְבֵּית", "شفت البيت")[1].arabic, "البيت");
assert.equal(sentenceWords("שֻפְת (א)לְבֵּית הון", "شفت البيت")[1].arabic, null, "uneven sides: no guessing which Arabic word");
assert.deepEqual(sentenceWords("מַא + פֹּעַל + ש", null).map((w) => w.text), ["מַא", "פֹּעַל", "ש"], "symbols are not words");

console.log("word-lookup: ok");
