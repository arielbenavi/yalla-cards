/**
 * These tests exist because song_word_srs.word_index is positional, so a wrong
 * remap does not throw — it silently shows the learner a word they never
 * reviewed and records the answer against a different one. That failure is
 * invisible in the UI, which is exactly why it needs a test.
 *
 * Run: npx tsx tests/unit/song-words.test.ts
 */
import { remapWordIndices, orderedMoves, flattenWords, type LyricWord } from "../../lib/song-words";
import assert from "node:assert";

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`✅ ${name}`);
}

const w = (ar: string): LyricWord => ({ ar, he: "", translit: "" });

test("an unchanged list moves nothing", () => {
  const words = [w("كل"), w("ليلة"), w("عم")];
  const r = remapWordIndices(words, words);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.added, 0);
  assert.deepEqual(orderedMoves(r.moves), []);
});

test("a word inserted at the front shifts everything after it", () => {
  const before = [w("ليلة"), w("عم")];
  const after = [w("كل"), w("ليلة"), w("عم")];
  const r = remapWordIndices(before, after);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.added, 1);
  assert.equal(r.moves.get(0), 1);
  assert.equal(r.moves.get(1), 2);
});

test("moves are ordered highest-target-first so rows never collide", () => {
  const before = [w("ليلة"), w("عم")];
  const after = [w("كل"), w("ليلة"), w("عم")];
  const r = remapWordIndices(before, after);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  // 1→2 must be written before 0→1, or the second write lands on a live row.
  assert.deepEqual(orderedMoves(r.moves), [
    [1, 2],
    [0, 1],
  ]);
});

test("appending at the end moves nothing — the cheap safe edit", () => {
  const before = [w("كل"), w("ليلة")];
  const after = [w("كل"), w("ليلة"), w("عم")];
  const r = remapWordIndices(before, after);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.deepEqual(orderedMoves(r.moves), []);
  assert.equal(r.added, 1);
});

test("diacritics and punctuation do not break the match", () => {
  const before = [w("مَرَّة"), w("بَعْد")];
  const after = [w("مرة"), w("بعد،")];
  const r = remapWordIndices(before, after);
  assert.equal(r.ok, true);
});

test("a deleted word refuses the whole remap", () => {
  const before = [w("كل"), w("ليلة"), w("عم")];
  const after = [w("كل"), w("عم")];
  const r = remapWordIndices(before, after);
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.match(r.reason, /ليلة/);
});

test("a reorder refuses too, rather than remapping to the wrong word", () => {
  const before = [w("كل"), w("ليلة")];
  const after = [w("ليلة"), w("كل")];
  const r = remapWordIndices(before, after);
  // كل matches at 1, then ليلة can no longer be found after it.
  assert.equal(r.ok, false);
});

test("flattenWords walks lines in order", () => {
  const lines = [
    { line: "א", words: [w("كل"), w("ليلة")] },
    { line: "ב", words: [w("عم")] },
  ];
  assert.deepEqual(
    flattenWords(lines).map((x) => x.ar),
    ["كل", "ليلة", "عم"]
  );
});

test("a line with no words array is skipped, not crashed on", () => {
  assert.deepEqual(flattenWords([{ line: "א" }, { line: "ב", words: [w("عم")] }]).length, 1);
});

console.log(`\n${passed} passed`);
