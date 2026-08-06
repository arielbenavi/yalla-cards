// Records the קציר / אציר homophone on the existing card.
//
// Ariel checked this against the lesson: "short" is قصير — written קציר under
// the ק convention and pronounced אציר in urban speech. So the existing card
// `אַצִיר` = "קצר" is correct, not mislabelled as I first suspected.
//
// The lesson's `אציר` = "אהיה" is أصير, a different word that sounds identical.
// That card comes from the chatifai batch; this script only annotates the one
// that already exists, so a learner meeting one of them is told the other
// exists. Two homophones learned separately get merged.
//
// Touches `notes` only — no transliteration, no meaning, no FSRS state.
//
//   npx tsx scripts/note-qasir-homophone.ts          # dry run
//   npx tsx scripts/note-qasir-homophone.ts --apply
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { HOMOPHONE_NOTE_QASIR } from "./data/meeting-oral-3";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const APPLY = process.argv.includes("--apply");

async function main() {
  const cards: { id: string; translit_nikud: string; hebrew_meaning: string; notes: string | null }[] =
    [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb
      .from("cards")
      .select("id, translit_nikud, hebrew_meaning, notes")
      .range(from, from + 999);
    if (error) throw error;
    if (!data?.length) break;
    cards.push(...(data as typeof cards));
    if (data.length < 1000) break;
  }

  const target = cards.find(
    (c) => c.translit_nikud === "אַצִיר" && (c.hebrew_meaning ?? "").includes("קצר")
  );
  if (!target) {
    console.log("לא נמצא כרטיס אַצִיר במשמעות קצר — ייתכן שכבר שונה");
    return;
  }

  // Rewrite rather than append: a first pass wrote a version of this note that
  // pointed at قصير from the قصير card itself, which says nothing.
  const kept = (target.notes ?? "")
    .split(" · ")
    .filter((p) => p.trim() && !p.includes("הומופון") && !p.includes("נכתבת קציר"))
    .join(" · ");
  const notes = [kept, HOMOPHONE_NOTE_QASIR].filter(Boolean).join(" · ");
  if (notes === target.notes) {
    console.log("ההערה כבר נכונה");
    return;
  }
  console.log(`${target.translit_nikud} [${target.hebrew_meaning}]`);
  console.log(`  לפני: ${target.notes ?? "(ריק)"}`);
  console.log(`  אחרי: ${notes}`);

  if (!APPLY) {
    console.log("\ndry run — הוסף --apply כדי לכתוב");
    return;
  }

  const { error } = await sb.from("cards").update({ notes }).eq("id", target.id);
  if (error) throw error;
  console.log("\n✅ עודכן");
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
