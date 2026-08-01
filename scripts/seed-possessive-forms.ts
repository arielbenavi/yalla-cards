// Seeds possessive_forms (note 04cff308) from chatifai's verified tables.
//
// Five of the six nouns asked about are seeded. شقة is deliberately held: the
// agent flagged that chatifai kept a full fatha on the stem (שַׁקַּתִי) where the
// Palestinian form is shaqqti, contradicting how it treated سيارة three lines
// earlier. A single inserted vowel is exactly what this drill cannot survive —
// there is no context to rescue a wrong minimal pair — so it goes back to
// chatifai instead of into the DB.
//
// Two normalisations applied to what chatifai returned, both deliberate:
//  - The 3ms Arabic suffix is written ـه throughout. chatifai used ـه in three
//    tables and ـو in the fourth for the same morpheme.
//  - Parenthetical variants (בֵּיתַא, בֵּיתֹם) are dropped. They are h-dropping
//    reductions more typical of Egyptian and rural registers than of the urban
//    Palestinian this course teaches, and offering them in the same cell would
//    confuse rather than inform.
//
//   npx tsx scripts/seed-possessive-forms.ts --apply
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import type { Feature } from "../lib/possessives";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const APPLY = process.argv.includes("--apply");

type Noun = {
  base_translit: string;
  base_arabic: string;
  base_he: string;
  pattern_class: "regular" | "feminine_ta" | "vowel_base";
  forms: Record<Feature, [string, string]>; // [translit, arabic]
};

const HE: Record<Feature, string> = {
  my: "שלי",
  your_m: "שלך",
  your_f: "שלך",
  his: "שלו",
  her: "שלה",
  our: "שלנו",
  your_pl: "שלכם",
  their: "שלהם",
};

const NOUNS: Noun[] = [
  {
    base_translit: "בֵּית",
    base_arabic: "بيت",
    base_he: "בית",
    pattern_class: "regular",
    forms: {
      my: ["בֵּיתִי", "بيتي"],
      your_m: ["בֵּיתַכּ", "بيتك"],
      your_f: ["בֵּיתֵכּ", "بيتك"],
      his: ["בֵּיתוֹ", "بيته"],
      her: ["בֵּיתְהַא", "بيتها"],
      our: ["בֵּיתְנַא", "بيتنا"],
      your_pl: ["בֵּיתְכֹּם", "بيتكم"],
      their: ["בֵּיתְהֹם", "بيتهم"],
    },
  },
  {
    base_translit: "כִּתַאבּ",
    base_arabic: "كتاب",
    base_he: "ספר",
    pattern_class: "regular",
    forms: {
      my: ["כִּתַאבִּי", "كتابي"],
      your_m: ["כִּתַאבַּכּ", "كتابك"],
      // chatifai's table gave כִּתַאבֵכּ and its prose gave כִּתַאבֵּכּ for the same
      // form. The dagesh is taken from the prose: ب is the same consonant here
      // as in every other cell of the table.
      your_f: ["כִּתַאבֵּכּ", "كتابك"],
      his: ["כִּתַאבּוֹ", "كتابه"],
      her: ["כִּתַאבְּהַא", "كتابها"],
      our: ["כִּתַאבְּנַא", "كتابنا"],
      your_pl: ["כִּתַאבְּכֹּם", "كتابكم"],
      their: ["כִּתַאבְּהֹם", "كتابهم"],
    },
  },
  {
    base_translit: "סַיַּארַה",
    base_arabic: "سيارة",
    base_he: "מכונית",
    pattern_class: "feminine_ta",
    forms: {
      my: ["סַיַּארְתִי", "سيارتي"],
      your_m: ["סַיַּארְתַכּ", "سيارتك"],
      your_f: ["סַיַּארְתֵכּ", "سيارتك"],
      his: ["סַיַּארְתוֹ", "سيارته"],
      her: ["סַיַּארִתְהַא", "سيارتها"],
      our: ["סַיַּארִתְנַא", "سيارتنا"],
      your_pl: ["סַיַּארִתְכֹּם", "سيارتكم"],
      their: ["סַיַּארִתְהֹם", "سيارتهم"],
    },
  },
  {
    base_translit: "אַבּ",
    base_arabic: "أب",
    base_he: "אבא",
    pattern_class: "vowel_base",
    forms: {
      my: ["אַבּוּי", "أبوي"],
      your_m: ["אַבּוּכּ", "أبوك"],
      // After a long-vowel base the 2fs is -כִּי, not -ֵכּ
      your_f: ["אַבּוּכִּי", "أبوكي"],
      his: ["אַבּוּה", "أبوه"],
      her: ["אַבּוּהַא", "أبوها"],
      our: ["אַבּוּנַא", "أبونا"],
      your_pl: ["אַבּוּכֹּם", "أبوكم"],
      their: ["אַבּוּהֹם", "أبوهم"],
    },
  },
  {
    base_translit: "אַח'",
    base_arabic: "أخ",
    base_he: "אח",
    pattern_class: "vowel_base",
    forms: {
      my: ["אַח'וּי", "أخوي"],
      your_m: ["אַח'וּכּ", "أخوك"],
      your_f: ["אַח'וּכִּי", "أخوكي"],
      his: ["אַח'וּה", "أخوه"],
      her: ["אַח'וּהַא", "أخوها"],
      our: ["אַח'וּנַא", "أخونا"],
      your_pl: ["אַח'וּכֹּם", "أخوكم"],
      their: ["אַח'וּהֹם", "أخوهم"],
    },
  },
];

async function main() {
  const rows = NOUNS.flatMap((n) =>
    (Object.keys(n.forms) as Feature[]).map((f) => ({
      base_translit: n.base_translit,
      base_arabic: n.base_arabic,
      base_he: n.base_he,
      feature: f,
      form_translit: n.forms[f][0],
      form_arabic: n.forms[f][1],
      form_he: `${n.base_he} ${HE[f]}`,
      pattern_class: n.pattern_class,
      chatifai_verified: true,
    }))
  );

  // The 3ms Arabic suffix must be ـه everywhere — chatifai wrote ـو once
  const badHis = rows.filter((r) => r.feature === "his" && !r.form_arabic.endsWith("ه"));
  if (badHis.length) {
    throw new Error(`3ms Arabic must end in ه: ${badHis.map((r) => r.form_arabic).join(", ")}`);
  }

  console.log(`${NOUNS.length} שמות עצם · ${rows.length} צורות`);
  for (const n of NOUNS) {
    console.log(`  ${n.base_translit.padEnd(12)} ${n.pattern_class.padEnd(13)} ${n.base_he}`);
  }
  console.log("\n⚠ שַקֵّה (شقة) לא נכלל — chatifai נתן שַׁקַּתִי עם פתח מלא בגזע,");
  console.log("  בסתירה לטיפול שלו ב-سيارة. הצורה הפלסטינית היא shaqqti. חוזר לאימות.");

  if (!APPLY) {
    console.log("\ndry run — pass --apply to write");
    return;
  }

  const { error } = await sb
    .from("possessive_forms")
    .upsert(rows, { onConflict: "base_translit,feature" });
  if (error) throw error;
  console.log(`\n✅ ${rows.length} צורות נכתבו`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
