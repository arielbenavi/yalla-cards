/**
 * Adds misc vocabulary words from chatbot notes.
 * Sources: notes dc1f7cfb (אִטְלַע, מֻחְ'תַאר, מַעַכּ) + 57209123 (כְּתִיר)
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const sb = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false }, realtime: { transport: class {} as any } }
);

async function main() {
  // Create import batch
  const { data: batch, error: bErr } = await sb
    .from("import_batches")
    .insert({ source: "paste", raw_input: "misc words from chatbot notes" })
    .select("id")
    .single();
  if (bErr) { console.error(bErr.message); process.exit(1); }
  const batch_id = batch.id;

  const words = [
    {
      batch_id,
      hebrew_meaning: "עֲלֵה / צֵא (ציווי)",
      translit_nikud: "אִטְלַע",
      arabic_script: "اطلع",
      item_type: "word",
      notes: "ציווי: אִטְלַע עַ-לְיַמִין = עלה/פנה ימינה. בלהג פלסטיני א' במקום ק' (אִאְעֹד ← אֻקְעֹד)",
    },
    {
      batch_id,
      hebrew_meaning: "מוכתר / ראש כפר / הנבחר",
      translit_nikud: "מֻחְ'תַאר",
      arabic_script: "مختار",
      item_type: "word",
      notes: "שורש: ח'.י.ר (בחירה). כינוי כבוד לאדם מבוגר חכם: יַא מֻחְ'תַאר, שׁוּ אִלְוַצֵ'ע?",
    },
    {
      batch_id,
      hebrew_meaning: "איתך / עמך / עליך",
      translit_nikud: "מַעַכּ",
      arabic_script: "معك",
      item_type: "word",
      notes: "מַע (עם) + כּ. שייכות: מַעַכּ מַצַארִי? = יש לך כסף? הסכמה: אַנַא מַעַכּ = אני איתך",
    },
    {
      batch_id,
      hebrew_meaning: "הרבה / מאוד",
      translit_nikud: "כְּתִיר",
      arabic_script: "كتير",
      item_type: "word",
      notes: "אַכְּתַר = יותר / הכי הרבה. שֻׁכְּרַן כְּתִיר = תודה רבה. מִן כְּתִיר זַמַאן = מלפני הרבה זמן",
    },
  ];

  const { data, error } = await sb.from("cards").insert(words).select("id, hebrew_meaning");
  if (error) { console.error(error.message); process.exit(1); }
  console.log(`✅ הוכנסו ${data.length} מילים:`);
  data.forEach((c) => console.log(`  • ${c.hebrew_meaning}`));

  // Also need to create card_srs rows for FSRS
  const srsRows = data.map((c) => ({ card_id: c.id, direction: "he_to_ar" }));
  const { error: srsErr } = await sb.from("card_srs").insert(srsRows);
  if (srsErr) console.warn("⚠️  card_srs:", srsErr.message);
  else console.log("✅ card_srs rows created");
}

main();
