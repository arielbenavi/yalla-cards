/**
 * The recognition track asks which person a form belongs to. Its one hard rule
 * is that a question must not admit two right answers — Palestinian present
 * tense really does spell inta and hiyye the same, and offering both while
 * accepting one marks a correct answer wrong.
 *
 * Run: npx tsx tests/unit/inflections.test.ts
 */
import { buildPersonChoices, personsMatching, formOf, type Verb } from "../../lib/inflections";
import assert from "node:assert";

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`✅ ${name}`);
}

/** A distinct form per person — the easy case. */
const distinct: Verb = {
  forms: {},
  forms_translit: {
    ana: "בַּכְּתֹבּ",
    inta: "בְּתֻכְּתֹבּ",
    inti: "בְּתֻכְּתְבִּי",
    huwwe: "בְּיֻכְּתֹבּ",
    hiyye: "בְּתֻכְּתֹבּX",
    ihna: "מְנֻכְּתֹבּ",
    intu: "בְּתֻכְּתְבּוּ",
    hum: "בְּיֻכְּתְבּוּ",
  },
};

/** inta and hiyye share a spelling — the real Palestinian case. */
const syncretic: Verb = {
  forms: {},
  forms_translit: { ...distinct.forms_translit, hiyye: "בְּתֻכְּתֹבּ" },
};

test("transliteration is preferred over Arabic script", () => {
  const v: Verb = { forms: { ana: "بكتب" }, forms_translit: { ana: "בַּכְּתֹבּ" } };
  assert.equal(formOf(v, "ana"), "בַּכְּתֹבּ");
});

test("Arabic is the fallback when a verb has no transliteration", () => {
  assert.equal(formOf({ forms: { ana: "بكتب" } }, "ana"), "بكتب");
});

test("a distinct form matches only its own person", () => {
  assert.deepEqual([...personsMatching(distinct, "inta")], ["inta"]);
});

test("syncretic persons are all reported as matching", () => {
  assert.deepEqual([...personsMatching(syncretic, "inta")].sort(), ["hiyye", "inta"]);
});

test("the target person is always among the options", () => {
  assert.ok(buildPersonChoices(distinct, "huwwe").includes("huwwe"));
});

test("at most four options are offered", () => {
  assert.ok(buildPersonChoices(distinct, "ana").length <= 4);
});

test("no option duplicates the target's spelling", () => {
  // This is the whole point: hiyye must never appear alongside inta here.
  const choices = buildPersonChoices(syncretic, "inta");
  assert.ok(!choices.includes("hiyye"), `hiyye was offered: ${choices.join(", ")}`);
  assert.ok(choices.includes("inta"));
});

test("every option is a distinct person", () => {
  const choices = buildPersonChoices(distinct, "inti");
  assert.equal(new Set(choices).size, choices.length);
});

test("options are never two forms that read the same", () => {
  const choices = buildPersonChoices(syncretic, "inta");
  const forms = choices.map((p) => formOf(syncretic, p));
  assert.equal(new Set(forms).size, forms.length);
});

test("a verb with only one person yields a single option, not a broken one", () => {
  const v: Verb = { forms: {}, forms_translit: { ana: "בַּכְּתֹבּ" } };
  assert.deepEqual(buildPersonChoices(v, "ana"), ["ana"]);
});

console.log(`\n${passed} passed`);
