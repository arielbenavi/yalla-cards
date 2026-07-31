import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false }, realtime: { transport: class {} as any } }
);

const BAFA2_ID = "1ec690db-bde3-463b-9c27-888150347a75";

const words = [
  { translit_nikud: "כַּאן בִּדַּכּ", hebrew_meaning: "האם רצית? (עבר)" },
  { translit_nikud: "דִיכּ הִנְדִי", hebrew_meaning: "תרנגול הודו" },
  { translit_nikud: "בִּנַפְס אִל-הַוַא סַוַא", hebrew_meaning: "באותו מצב / באותה סירה" },
  { translit_nikud: "אַחַ'דֵת", hebrew_meaning: "לקחתי" },
  // Verb הלך conjugations (basic forms only — full verb schema TBD)
  { translit_nikud: "רַאח", hebrew_meaning: "הלך / ילך (גם תחילית עתיד: רַאח + פועל)" },
  { translit_nikud: "רֻחֵת", hebrew_meaning: "הלכתי / הלכת (זכר)" },
  { translit_nikud: "רֻחְתִי", hebrew_meaning: "הלכת (נקבה)" },
  { translit_nikud: "רֻחְנַא", hebrew_meaning: "הלכנו" },
];

async function main() {
  // Check which already exist
  const { data: existing } = await supabase
    .from("cards")
    .select("translit_nikud, hebrew_meaning, lesson_id");

  const existingTranslits = new Set((existing ?? []).map(c => c.translit_nikud));

  const toInsert = words.filter(w => !existingTranslits.has(w.translit_nikud));
  const alreadyIn = words.filter(w => existingTranslits.has(w.translit_nikud));

  if (alreadyIn.length) {
    console.log("Already in DB:");
    for (const w of alreadyIn) console.log(`  ✓ ${w.translit_nikud} — ${w.hebrew_meaning}`);
  }

  if (!toInsert.length) {
    console.log("Nothing to insert.");
    return;
  }

  const rows = toInsert.map(w => ({
    item_type: "word",
    translit_nikud: w.translit_nikud,
    hebrew_meaning: w.hebrew_meaning,
    lesson_id: BAFA2_ID,
    chatifai_verified: true,
  }));

  const { data, error } = await supabase.from("cards").insert(rows).select("id, translit_nikud");
  if (error) { console.error(error.message); return; }
  console.log(`\nInserted ${data?.length} cards into מפגש בעפ 2:`);
  for (const c of data ?? []) console.log(`  + ${c.translit_nikud}`);
}

main();
