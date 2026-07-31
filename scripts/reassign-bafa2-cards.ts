import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false }, realtime: { transport: class {} as any } }
);

const SHIUR2_ID = "5325a7b7-82e9-446c-ac41-d913690d52dd";
const BAFA2_ID  = "1ec690db-bde3-463b-9c27-888150347a75";

async function main() {
  // Find cards under שיעור 2 that were created on 2026-07-30 (the chatifai batch)
  const { data: candidates, error } = await supabase
    .from("cards")
    .select("id, item_type, translit_nikud, hebrew_meaning, created_at")
    .eq("lesson_id", SHIUR2_ID)
    .gte("created_at", "2026-07-30T00:00:00+00:00")
    .order("created_at");

  if (error) { console.error(error.message); return; }
  if (!candidates?.length) { console.log("No cards found to move"); return; }

  console.log(`Found ${candidates.length} cards to move to מפגש בעפ 2:`);
  for (const c of candidates) {
    console.log(`  [${c.item_type}] ${c.translit_nikud} — ${c.hebrew_meaning}`);
  }

  const ids = candidates.map(c => c.id);
  const { error: updateErr } = await supabase
    .from("cards")
    .update({ lesson_id: BAFA2_ID })
    .in("id", ids);

  if (updateErr) { console.error("Update failed:", updateErr.message); return; }
  console.log(`\n✓ Moved ${ids.length} cards → מפגש בעפ 2`);
}

main();
