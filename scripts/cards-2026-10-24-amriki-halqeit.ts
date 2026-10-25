// Ariel, 2026-10-24:
// - drop אַמְרִיכִּי (Preply · Leyla). It had one review; its log goes with it.
// - הַלְקֵית, the spoken "now" — chatifai's form from the Leyla lesson check
//   (urban; rural הַלְקִיאֵת), its own card next to the literary אִלְאַאן.
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const ASKED = "825ef0fe-f683-48ee-9bb5-3cfaa5913282";
(async () => {
  const id = "4b253551-6fd3-4e58-a06d-75e3c881ccd7";
  const { error: e1 } = await sb.from("card_srs").delete().eq("card_id", id); // review_log cascades
  if (e1) throw e1;
  const { error: e2 } = await sb.from("cards").delete().eq("id", id);
  if (e2) throw e2;
  console.log("✅ deleted אַמְרִיכִּי");

  const { data, error } = await sb.from("cards").insert({
    translit_nikud: "הַלְקֵית", arabic_script: "هلقيت", hebrew_meaning: "עכשיו (מדובר)",
    notes: "chatifai: עירוני; בכפר: הַלְקִיאֵת · ספרותי: אִלְאַאן · גם: הַלַּא", item_type: "word",
    lesson_id: ASKED, chatifai_verified: true,
  }).select("id").single();
  if (error) throw error;
  const { error: e3 } = await sb.from("card_srs").insert({ card_id: data.id, direction: "he_to_ar" });
  if (e3) throw e3;
  console.log("✅ הַלְקֵית");
})();
