// Merges the two duplicate pairs found by the MuFeed review (Ariel approved). Keeps the card he has
// reviewed, moves what the other one had into it, deletes the unreviewed duplicate (reps 0) after a backup.
import { config } from "dotenv"; import { writeFileSync } from "fs"; import { createClient } from "@supabase/supabase-js";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const DROP = ["8cfb04d5-1fd3-4f24-b1bc-265efc017b51", "c228cb86-6041-4224-9d5c-de9dbcf2d710"];
(async () => {
  const { data: cards } = await sb.from("cards").select("*").in("id", DROP);
  const { data: srs } = await sb.from("card_srs").select("*").in("card_id", DROP);
  const { data: log } = await sb.from("review_log").select("*").in("card_srs_id", (srs ?? []).map((s) => s.id));
  if ((srs ?? []).some((s) => s.reps > 0) || (log ?? []).length) throw new Error("a duplicate has reviews; stop");
  writeFileSync("scripts/data/merged-duplicates-2026-11-20.json", JSON.stringify({ cards, srs, log }, null, 1));
  const { error: u } = await sb.from("cards").update({ translit_nikud: "אַזְרַק / אַזְרַא", plural_form: "זֻרֻק", notes: "נקבה: זַרְקַא (כחולה); בדיבור: אַזְרַא" }).eq("id", "dc57c368-65a3-468f-9a18-eff920ac7590");
  if (u) throw u;
  const { error: d1 } = await sb.from("card_srs").delete().in("card_id", DROP); if (d1) throw d1;
  const { error: d2 } = await sb.from("cards").delete().in("id", DROP); if (d2) throw d2;
  console.log("✅ merged 2 pairs");
})();
