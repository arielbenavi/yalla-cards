/**
 * The song schema check exists because two real songs landed broken in two
 * different ways. Both are pinned here as fixtures so the checker cannot quietly
 * stop catching them.
 *
 * Run: npx tsx tests/unit/song-schema.test.ts
 */
import { checkSong, isSongClean, type LyricLine } from "../../lib/song-schema";
import assert from "node:assert";

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`✅ ${name}`);
}

test("a well-formed line passes", () => {
  const lines: LyricLine[] = [
    {
      line: "כֻּלּוֹ בִּיִסְאַל: שׁוּ בִּדַּכּ?",
      words: [
        { ar: "كلو", he: "כולם", translit: "kullo" },
        { ar: "بيسأل", he: "שואלים", translit: "byis'al" },
      ],
    },
  ];
  assert.deepEqual(checkSong(lines), []);
  assert.equal(isSongClean(lines), true);
});

test("Arabic in the transliteration field is caught (the Immer defect)", () => {
  const lines: LyricLine[] = [
    { line: "واخا فيها لهبال نبغيها", words: [{ ar: "واخا", he: "אפילו ש", translit: "wakha" }] },
  ];
  const issues = checkSong(lines);
  assert.equal(issues.length, 1);
  assert.equal(issues[0].field, "line");
  assert.match(issues[0].problem, /כתב ערבי/);
});

test("Hebrew in the Arabic field is caught (the سوولنا defect)", () => {
  const lines: LyricLine[] = [
    {
      line: "סַוּוּלְנַא כַּאסֵת צַ'אי",
      words: [{ ar: "סוולנא", he: "תכינו לנו", translit: "sawwulna" }],
    },
  ];
  const issues = checkSong(lines);
  assert.equal(issues.length, 1);
  assert.equal(issues[0].field, "words.ar");
  assert.match(issues[0].problem, /עברית/);
});

test("a line with no glosses is caught", () => {
  const issues = checkSong([{ line: "כֻּלּוֹ בִּיִסְאַל", words: [] }]);
  assert.equal(issues.length, 1);
  assert.equal(issues[0].field, "words");
});

test("vocalisations and studio chatter are not reported", () => {
  // These genuinely have nothing to gloss and must not be flagged as defects
  assert.deepEqual(checkSong([{ line: "بابابا، با، بابابا", words: [] }]), []);
  assert.deepEqual(checkSong([{ line: "(Unleaded)", words: [] }]), []);
  assert.deepEqual(checkSong([{ line: "Yeah", words: [] }]), []);
});

test("English in the translation is caught — the note says no English", () => {
  const issues = checkSong([
    { line: "כֻּלּוֹ", words: [{ ar: "كلو", he: "everyone", translit: "kullo" }] },
  ]);
  assert.equal(issues.length, 1);
  assert.match(issues[0].problem, /אנגלית/);
});

test("missing translation or transliteration is caught", () => {
  const issues = checkSong([
    { line: "כֻּלּוֹ", words: [{ ar: "كلو", he: "", translit: "" }] },
  ]);
  assert.equal(issues.length, 2);
});

console.log(`\n${passed} passed`);
