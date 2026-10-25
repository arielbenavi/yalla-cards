// Ariel, 2026-10-24: drop פַלַסְטִינִי and פַלַסְטִין גַ'מִילֵה too (Preply · Leyla).
// Prints each row before deleting it; refuses any card that has been reviewed.
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
(async () => {
  const { data } = await sb.from("cards").select("id, translit_nikud, arabic_script, hebrew_meaning, notes, lesson_id, card_srs(id, reps)").in("translit_nikud", ["פַלַסְטִינִי", "פַלַסְטִין גַ'מִילֵה"]);
  for (const c of data ?? []) {
    console.log("row:", JSON.stringify(c));
    if ((c.card_srs as { reps: number }[]).some((s) => s.reps > 0)) { console.log("skip — reviewed"); continue; }
    const { error: e1 } = await sb.from("card_srs").delete().eq("card_id", c.id);
    if (e1) throw e1;
    const { error } = await sb.from("cards").delete().eq("id", c.id);
    if (error) throw error;
    console.log("✅ deleted", c.translit_nikud);
  }
})();
