// Note 97311b79: "הכוונה בדרך פסקה 1 זה לא דרך להכניס את זה. הכוונה הייתה
// להכניס כסיטואציה".
//
// The two pointed direction paragraphs from מפגש בעל פה 5 went in as `sentence`
// cards, which made them unanswerable flashcards — their Hebrew side was the
// label "הכוונה בדרך — פסקה 1", not a translation, so there was nothing to
// recall. They belong in the directions situation.
//
// The paragraphs are attached verbatim as `course_material` on the existing
// simulation_directions scene. No turn is invented and no Hebrew is written for
// them: Ariel gave the Arabic pointed and gave no gloss, and making one up is
// exactly what this project does not do. They render as the lesson's own text
// beneath the dialogue.
//
//   npx tsx scripts/move-directions-to-situation.ts
//   npx tsx scripts/move-directions-to-situation.ts --apply
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { DIRECTIONS } from "./data/meeting-oral-5";

config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});
const APPLY = process.argv.includes("--apply");

const CARD_IDS = [
  "c31702f8-b32a-4a63-9178-7ae661fda985", // הכוונה בדרך — פסקה 1
  "a6565b6c-520b-493b-8d3a-c8e5b22d41cc", // הכוונה בדרך — פסקה 2
];

async function main() {
  const { data: row, error } = await sb
    .from("paradigms")
    .select("id, slug, data")
    .eq("slug", "simulation_directions")
    .single();
  if (error) throw error;

  const data = row.data as Record<string, unknown>;
  data.course_material = {
    title: "מפגש בעל פה 5 — הכוונה בדרך",
    source: "מפגש בעל פה 5",
    note: "הטקסט של אריאל מהשיעור, מנוקד כפי שנמסר. אין תרגום — לא נכתב אחד בשיעור.",
    paragraphs: DIRECTIONS,
  };

  // Deleting cards, so make sure nothing is being thrown away: a card with
  // review history is a card Ariel has actually worked on.
  const { data: srs } = await sb.from("card_srs").select("id, card_id").in("card_id", CARD_IDS);
  const srsIds = (srs ?? []).map((s) => s.id);
  const { data: logs } = await sb.from("review_log").select("id").in("card_srs_id", srsIds);

  const { data: cards } = await sb.from("cards").select("id, translit_nikud, hebrew_meaning").in("id", CARD_IDS);
  console.log("כרטיסים להסרה:");
  for (const c of cards ?? []) console.log(`   ${c.hebrew_meaning} — ${String(c.translit_nikud).slice(0, 50)}…`);
  console.log(`card_srs: ${srsIds.length} · review_log: ${(logs ?? []).length}`);
  console.log(`\nהפסקאות נכנסות ל-simulation_directions כ-course_material (${DIRECTIONS.length} פסקאות)`);

  const reviewed = (logs ?? []).length > 0;

  if (!APPLY) {
    console.log("\ndry run — הוסף --apply כדי לכתוב");
    return;
  }

  const { error: e1 } = await sb.from("paradigms").update({ data }).eq("id", row.id);
  if (e1) throw e1;
  console.log("\n✅ הפסקאות נוספו לסיטואציה");

  if (reviewed) {
    // Not deleted. There is review history on these two, so removing them would
    // destroy work Ariel actually did — and retiring a card without deleting it
    // would mean filtering the daily queue, which is off limits ("חזרה יומית לא
    // נוגעים"). The cards get a note saying where the material now lives, and
    // whether they stay is Ariel's call, not this script's.
    const { error: e2 } = await sb
      .from("cards")
      .update({ course_note: "הטקסט עבר לסיטואציה 'הכוונה בדרך' (סימולציות). הכרטיס נשאר כי יש עליו היסטוריית חזרות — אריאל מחליט אם להסיר." })
      .in("id", CARD_IDS);
    if (e2) throw e2;
    console.log(`⚠️  שני הכרטיסים נשארו — יש עליהם ${(logs ?? []).length} חזרות. סומנו בהערה.`);
  }
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
