// "פתרון תרגול אישי — מפגש 2": six nouns inflected for the eight persons, from
// the course's own solution sheet (Ariel's photo, 2026-10-22). Book material,
// already pointed — read off the page, nothing composed. The sheet marks
// doubling with the Arabic shadda (مَحَلّ); it is written here as the Hebrew
// dagesh, the project's one permitted mark conversion (normalizeMarks).
//
// Lands in התאמת הטיות as one drill per noun, grouped under מפגש 2.
//
//   npx tsx scripts/insert-meeting-2-noun-suffixes.ts [--apply]
// Rollback: delete from paradigms where meeting = 2 and slug = 'noun_suffixes';
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});
const APPLY = process.argv.includes("--apply");

const COLUMNS = ["makhzan", "mushkile", "shughl", "amara", "mahal", "eile"] as const;
const HEAD: Record<(typeof COLUMNS)[number], string> = {
  makhzan: "מַחְ'זַן — מחסן",
  mushkile: "מֻשְכְּלֵה — בעיה",
  shughl: "שֻׁעְ'ל — עבודה",
  amara: "עַמַארַה — בניין",
  mahal: "מַחַלּ — חנות",
  eile: "עֵילֵה — משפחה",
};

// person, then one form per column, in COLUMNS order
const TABLE: [string, ...string[]][] = [
  ["אַנַא", "מַחְ'זַנִי", "מֻשְכִּלְתִי", "שֻׁעְ'לִי", "עַמַארְתִי", "מַחַלִּי", "עֵילְתִי"],
  ["אִנְתֵ", "מַחְ'זַנַכּ", "מֻשְכִּלְתַכּ", "שֻׁעְ'לַכּ", "עַמַארְתַכּ", "מַחַלַּכּ", "עֵילְתַכּ"],
  ["אִנְתִי", "מַחְ'זַנֵכּ", "מֻשְכִּלְתֵכּ", "שֻׁעְ'לֵכּ", "עַמַארְתֵכּ", "מַחַלֵּכּ", "עֵילְתֵכּ"],
  ["הֻוֵّ", "מַחְ'זַנוֹ", "מֻשְכִּלְתוֹ", "שֻׁעְ'לוֹ", "עַמַארְתוֹ", "מַחַלּוֹ", "עֵילְתוֹ"],
  ["הִיֵّ", "מַחְ'זַנְהַא", "מֻשְכִּלְתְהַא", "שֻׁעְ'לְהַא", "עַמַארְתְהַא", "מַחַלְּהַא", "עֵילִתְהַא"],
  ["אִחְנַא", "מַחְ'זַנַּא", "מֻשְכִּלְתְנַא", "שֻׁעְ'לְנַא", "עַמַארְתְנַא", "מַחַלְּנַא", "עֵילִתְנַא"],
  ["אִנְתוּ", "מַחְ'זַנְכֹּם", "מֻשְכִּלְתְכֹּם", "שֻׁעְ'לְכֹּם", "עַמַארְתְכֹּם", "מַחַלְּכֹּם", "עֵילִתְכֹּם"],
  ["הֵםّ", "מַחְ'זַנְהֹם", "מֻשְכִּלְתְהֹם", "שֻׁעְ'לְהֹם", "עַמַארְתְהֹם", "מַחַלְּהֹם", "עֵילִתְהֹם"],
];

const data = {
  description: "סיומות שייכות על שמות עצם — פתרון תרגול אישי, מפגש 2",
  source: "פתרון תרגול אישי — מפגש 2 (המדרשה לערבית וביטחון)",
  course_verified: true,
  translations: HEAD,
  rows: TABLE.map(([person, ...forms]) => ({
    person,
    ...Object.fromEntries(COLUMNS.map((c, i) => [c, forms[i]])),
  })),
};

async function main() {
  for (const r of data.rows) console.log(COLUMNS.map((c) => (r as Record<string, string>)[c]).join("  ·  "), "  ←", r.person);
  if (!APPLY) return console.log("\ndry run — add --apply");
  const { error } = await sb.from("paradigms").upsert({ meeting: 2, slug: "noun_suffixes", data }, { onConflict: "meeting,slug" });
  if (error) throw error;
  console.log("\n✅ paradigm meeting 2 / noun_suffixes");
}
main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
