// Demonstratives paradigm (note 5774ff07: "צריך שיהיה תרגול על האי האדיכ האדאכ הדול").
//
// All six forms already exist as chatifai-verified cards. What was missing is a
// structure that makes them contrastive: they form a 2×3 grid, proximity ×
// gender/number, and the confusion is always between neighbouring cells —
// הַאדִי vs הַדִיכּ differ only in distance, הַדַאכּ vs הַדִיכּ only in gender.
//
// Stored as a paradigm with per-slot rows so it feeds the existing
// /inflection-drill for free: placing all six forces every distinction at once,
// which is the "contrastive" the note asks for and the research's stage-1 design
// (two contexts differing only in the morpheme).
//
//   npx tsx scripts/insert-demonstratives.ts --apply
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const APPLY = process.argv.includes("--apply");

const DEMONSTRATIVES = {
  description:
    "כינויי רמז — רשת 2×3: קרוב/רחוק × זכר/נקבה/רבים. הבלבול תמיד בין תאים שכנים.",
  chatifai_verified: true,
  source: "כל שש הצורות מכרטיסים מאומתי chatifai",
  // `person` is the slot label the drill shows on the box
  rows: [
    { person: "זה (קרוב, ז)", form: "הַאדַא", variant: "הַאד", ar: "هادا" },
    { person: "זאת (קרוב, נ)", form: "הַאדִי", variant: "הַאיְ", ar: "هادي" },
    { person: "אלו (קרוב, ר)", form: "הַדוֹל", variant: "הַדוֹלַא", ar: "هدولا" },
    { person: "ההוא (רחוק, ז)", form: "הַדַאכּ", ar: "هداك" },
    { person: "ההיא (רחוק, נ)", form: "הַדִיכּ", ar: "هديك" },
    { person: "ההם (רחוק, ר)", form: "הַדוֹלַאכּ", ar: "هدولاك" },
  ],
  grid: {
    note: "הרחוקים נבנים מהקרובים בתוספת כּ- בסוף: הַאדַא→הַדַאכּ, הַאדִי→הַדִיכּ, הַדוֹל→הַדוֹלַאכּ.",
    near: { m: "הַאדַא", f: "הַאדִי", pl: "הַדוֹל" },
    far: { m: "הַדַאכּ", f: "הַדִיכּ", pl: "הַדוֹלַאכּ" },
  },
  minimal_pairs: [
    { a: "הַאדִי", b: "הַדִיכּ", differs: "מרחק בלבד — זאת מול ההיא" },
    { a: "הַדַאכּ", b: "הַדִיכּ", differs: "מין בלבד — ההוא מול ההיא" },
    { a: "הַאדַא", b: "הַאדִי", differs: "מין בלבד — זה מול זאת" },
    { a: "הַדוֹל", b: "הַדוֹלַאכּ", differs: "מרחק בלבד — אלו מול ההם" },
  ],
  usage: [
    "כינוי הרמז יכול לבוא לפני שם העצם או אחריו: הַאדַא (א)לְוַלַד או אִלְוַלַד הַאדַא.",
    "לרבים שאינו בני אדם משתמשים בנקבה יחידה (רשמב\"א): הַאדִי (א)לְבְּיוּת.",
  ],
};

async function main() {
  console.log(`■ meeting 1 / demonstratives — ${DEMONSTRATIVES.rows.length} slots`);
  for (const r of DEMONSTRATIVES.rows) {
    console.log(`  ${r.person.padEnd(18)} ${r.form}`);
  }

  if (!APPLY) {
    console.log("\ndry run — pass --apply to write");
    return;
  }

  const { error } = await sb.from("paradigms").upsert(
    {
      meeting: 1,
      slug: "demonstratives",
      data: DEMONSTRATIVES as unknown as Record<string, unknown>,
    },
    { onConflict: "meeting,slug" }
  );
  if (error) throw error;
  console.log("\n✅ written");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
