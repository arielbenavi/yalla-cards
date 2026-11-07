// Ariel (2026-11-07): اخوت as its own card. Palestinian "fool, nutcase" (أهوت/اخوت),
// heard אַחְ'וַת. chatifai is down: unverified. Goes into the lesson of the 7.11 words.
//
//   npx tsx scripts/insert-akhwat.ts
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

async function main() {
  const { data: lesson, error } = await sb.from("lessons").select("id").eq("title", "מילים שביקשתי 7.11.26").single();
  if (error) throw error;
  const { data: card, error: e1 } = await sb
    .from("cards")
    .insert({
      arabic_script: "اخوت",
      translit_nikud: "אַחְ'וַת",
      hebrew_meaning: "טיפש, מטורף, דפוק (על אדם)",
      notes: "לא 'אח'. اخوت هذا — הוא מטורף / טיפש",
      item_type: "word",
      lesson_id: lesson.id,
      chatifai_verified: false,
    })
    .select("id")
    .single();
  if (e1) throw e1;
  const { error: e2 } = await sb.from("card_srs").insert({ card_id: card.id, direction: "he_to_ar" });
  if (e2) throw e2;
  console.log("✅", card.id);
}
main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
