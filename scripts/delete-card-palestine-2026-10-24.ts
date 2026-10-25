// Ariel, 2026-10-24: drop the פַלַסְטִין card (Preply · Leyla) — self-evident.
// Never reviewed (reps 0), so no review history goes with it.
// Restore: insert { translit_nikud: "פַלַסְטִין", arabic_script: "فلسطين", hebrew_meaning: "פלסטין",
//   item_type: "word", notes: "Preply · Leyla", lesson_id: "4369913a-26e7-4d8f-9333-26932de52e85",
//   chatifai_verified: true } and a card_srs row.
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
(async () => {
  const id = "23d91c64-8be5-4a18-bb64-66aed322e985";
  const { error: e1 } = await sb.from("card_srs").delete().eq("card_id", id);
  if (e1) throw e1;
  const { error } = await sb.from("cards").delete().eq("id", id);
  if (error) throw error;
  console.log("✅ deleted פַלַסְטִין");
})();
