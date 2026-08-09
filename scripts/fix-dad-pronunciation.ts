// Two pronunciation corrections Ariel raised (notes 50f92fe6 and 4019997b).
//
// **ض is an emphatic D, not an emphatic צ.** The transliteration system writes it
// צ׳, and the pronunciation guide was reading that symbol back as the sound —
// telling him to make a thick S where the letter is a thick D. The symbol stays;
// only the description of the sound was wrong. Fixed in
// components/PronunciationGuide.tsx.
//
// **צַ'דַא (صدأ, rust) is pronounced DODA**, which he confirmed with chatifai.
// That is worth carrying on the card, because nothing in the transliteration
// predicts it — a learner reading צַ'דַא will produce something else entirely.
//
// Touches `notes` only.
//
//   npx tsx scripts/fix-dad-pronunciation.ts          # dry run
//   npx tsx scripts/fix-dad-pronunciation.ts --apply
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const APPLY = process.argv.includes("--apply");

const DODA = "אריאל (מאומת chatifai): נהגית DODA — לא כפי שהתעתיק נקרא";

/** Notes that describe ض as a thick צ rather than a thick D. */
const DAD_NOTE = "ה-ض היא ד נחצית (עבה), לא צ נחצית — התעתיק צ׳ הוא סימן, לא הצליל";

async function main() {
  const cards: { id: string; translit_nikud: string; arabic_script: string; hebrew_meaning: string; notes: string | null }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb
      .from("cards")
      .select("id, translit_nikud, arabic_script, hebrew_meaning, notes")
      .range(from, from + 999);
    if (error) throw error;
    if (!data?.length) break;
    cards.push(...(data as typeof cards));
    if (data.length < 1000) break;
  }

  const updates: { id: string; label: string; before: string; after: string }[] = [];

  const rust = cards.find((c) => c.arabic_script === "صدأ");
  if (rust && !(rust.notes ?? "").includes("DODA")) {
    updates.push({
      id: rust.id,
      label: `${rust.translit_nikud} [${rust.hebrew_meaning}]`,
      before: rust.notes ?? "",
      after: [rust.notes, DODA].filter(Boolean).join(" · "),
    });
  }

  // Every card whose Arabic actually contains ض gets the sound spelled out, since
  // the transliteration symbol does not carry it.
  for (const c of cards) {
    if (!(c.arabic_script ?? "").includes("ض")) continue;
    if ((c.notes ?? "").includes("ד נחצית")) continue;
    updates.push({
      id: c.id,
      label: `${c.translit_nikud} [${c.hebrew_meaning}]`,
      before: c.notes ?? "",
      after: [c.notes, DAD_NOTE].filter(Boolean).join(" · "),
    });
  }

  console.log(`${updates.length} כרטיסים לעדכון\n`);
  for (const u of updates) {
    console.log(`  ${u.label}`);
    console.log(`    → ${u.after}`);
  }

  if (!APPLY) {
    console.log("\ndry run — הוסף --apply כדי לכתוב");
    return;
  }

  for (const u of updates) {
    const { error } = await sb.from("cards").update({ notes: u.after }).eq("id", u.id);
    if (error) throw error;
  }
  console.log(`\n✅ עודכנו ${updates.length} כרטיסים`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
