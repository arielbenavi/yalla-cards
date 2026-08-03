/**
 * The minimal-pair rule is the single most important constraint in the
 * possessive drill: if anything other than the suffix distinguishes the two
 * options, the learner solves it without ever processing the morpheme and the
 * exercise silently teaches nothing.
 *
 * Run: npx tsx tests/unit/possessives.test.ts
 */
import assert from "node:assert";
import {
  checkMinimalPair,
  nextContrast,
  CONTRAST_ORDER,
  type ContrastMastery,
  buildMastery,
  solidContrasts,
  gradeProduction,
} from "../../lib/possessives";

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`✅ ${name}`);
}

test("a proper minimal pair passes", () => {
  const r = checkMinimalPair("בֵּיתוֹ כְּבִּיר", "בֵּיתְהַא כְּבִּיר", "בֵּיתוֹ", "בֵּיתְהַא");
  assert.equal(r.ok, true);
});

test("two differing words are rejected", () => {
  const r = checkMinimalPair("בֵּיתוֹ כְּבִּיר", "בֵּיתְהַא זְעִ'יר", "בֵּיתוֹ", "בֵּיתְהַא");
  assert.equal(r.ok, false);
  assert.match(r.reason!, /נבדלות/);
});

test("different lengths are rejected", () => {
  const r = checkMinimalPair("בֵּיתוֹ כְּבִּיר", "בֵּיתְהַא כְּבִּיר כְּתִיר", "בֵּיתוֹ", "בֵּיתְהַא");
  assert.equal(r.ok, false);
});

test("an independent pronoun leaks the answer and is rejected", () => {
  // "הו בֵּיתוֹ כְּבִּיר" — הו gives away the person for free, so the learner
  // never has to read the suffix. This is the Lexical Preference failure.
  const r = checkMinimalPair(
    "הו בֵּיתוֹ כְּבִּיר",
    "הו בֵּיתְהַא כְּבִּיר",
    "בֵּיתוֹ",
    "בֵּיתְהַא"
  );
  assert.equal(r.ok, false);
  assert.match(r.reason!, /רמז חופשי/);
});

test("the תבע possessive particle also leaks and is rejected", () => {
  const r = checkMinimalPair(
    "אִלְבֵּית תַבַּעוֹ כְּבִּיר",
    "אִלְבֵּית תַבַּעַהַא כְּבִּיר",
    "תַבַּעוֹ",
    "תַבַּעַהַא"
  );
  assert.equal(r.ok, false);
});

test("identical forms are rejected", () => {
  const r = checkMinimalPair("בֵּיתוֹ כְּבִּיר", "בֵּיתוֹ כְּבִּיר", "בֵּיתוֹ", "בֵּיתוֹ");
  assert.equal(r.ok, false);
});

test("the differing word must be the inflected form itself", () => {
  // Sentences differ in one word, but not the one under test
  const r = checkMinimalPair("בֵּיתוֹ כְּבִּיר", "בֵּיתוֹ זְעִ'יר", "בֵּיתוֹ", "בֵּיתְהַא");
  assert.equal(r.ok, false);
});

test("progression starts at his/her and stays until solid", () => {
  const mastery = new Map<string, ContrastMastery>();
  assert.deepEqual(nextContrast(mastery), ["his", "her"]);

  // Not enough trials yet — stay put
  mastery.set("his>her", { trials: 5, correct: 5 });
  assert.deepEqual(nextContrast(mastery), ["his", "her"]);

  // Enough trials but below threshold — still stay put
  mastery.set("his>her", { trials: 10, correct: 7 });
  assert.deepEqual(nextContrast(mastery), ["his", "her"]);

  // Solid — move on to the next contrast, not to the full paradigm
  mastery.set("his>her", { trials: 10, correct: 10 });
  assert.deepEqual(nextContrast(mastery), CONTRAST_ORDER[1]);
});


test("buildMastery counts his>her and her>his as one contrast", () => {
  // Attempts store whichever feature happened to be the target. Counting them
  // as two contrasts halves every total and pins the learner on contrast one.
  const m = buildMastery([
    { target_feature: "his", contrast_with: "her", correct: true },
    { target_feature: "her", contrast_with: "his", correct: true },
    { target_feature: "her", contrast_with: "his", correct: false },
  ]);
  assert.deepEqual(m.get("his>her"), { trials: 3, correct: 2 });
});

test("buildMastery ignores attempts with no contrast recorded", () => {
  const m = buildMastery([{ target_feature: "his", contrast_with: null, correct: true }]);
  assert.equal(m.size, 0);
});

test("stage 3 unlocks nothing until a contrast is solid", () => {
  assert.deepEqual(solidContrasts(new Map()), []);
  const m = new Map<string, ContrastMastery>([["his>her", { trials: 10, correct: 7 }]]);
  assert.deepEqual(solidContrasts(m), []);
});

test("stage 3 unlocks exactly the contrasts that are solid", () => {
  const m = new Map<string, ContrastMastery>([
    ["his>her", { trials: 10, correct: 10 }],
    ["my>our", { trials: 10, correct: 6 }],
  ]);
  assert.deepEqual(solidContrasts(m), [["his", "her"]]);
});

test("typed production grades on consonants, not on nikud", () => {
  assert.equal(gradeProduction("ביתהא", "בֵּיתְהַא"), true);
  assert.equal(gradeProduction("בֵּיתְהַא", "בֵּיתְהַא"), true);
  assert.equal(gradeProduction("  ביתהא  ", "בֵּיתְהַא"), true);
});

test("typed production still rejects the wrong suffix", () => {
  // The whole point of the drill — ביתו and ביתהא differ only in the morpheme.
  assert.equal(gradeProduction("ביתו", "בֵּיתְהַא"), false);
});

test("an empty answer is never correct", () => {
  assert.equal(gradeProduction("", "בֵּיתְהַא"), false);
  assert.equal(gradeProduction("   ", "בֵּיתְהַא"), false);
});

console.log(`\n${passed} passed`);
