// Ariel, 2026-11-10: "Yes, move them" — the older מפגש 8 cards that were never reviewed go to the
// front of the daily queue, right after the 10.11 additions (due 2026-01-01). Only `due` changes,
// only on card_srs rows with reps = 0, keeping their relative order. Backup first.
//   npx tsx scripts/front-meeting-8-unseen.ts [--apply]
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "fs";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const LESSON = "4b9289ff-8910-4ebb-868b-96f96678ff65";
const BASE = Date.parse("2026-01-02T00:00:00Z");
(async () => {
  const { data: cards } = await sb.from("cards").select("id").eq("lesson_id", LESSON).lt("created_at", "2026-11-01");
  const { data: srs } = await sb.from("card_srs").select("id,card_id,due,reps,state").in("card_id", cards!.map((c) => c.id));
  const unseen = srs!.filter((s) => !s.reps).sort((a, b) => a.due.localeCompare(b.due) || a.id.localeCompare(b.id));
  console.log(`${cards!.length} cards, ${srs!.length} srs rows, ${unseen.length} never reviewed`);
  if (!process.argv.includes("--apply")) return;
  writeFileSync("scripts/data/meeting-8-unseen-due-backup.json", JSON.stringify(unseen, null, 1));
  for (const [i, s] of unseen.entries()) {
    const { error } = await sb.from("card_srs").update({ due: new Date(BASE + i * 1000).toISOString() }).eq("id", s.id).eq("reps", 0);
    if (error) throw error;
  }
  console.log("✅ moved", unseen.length);
})();
