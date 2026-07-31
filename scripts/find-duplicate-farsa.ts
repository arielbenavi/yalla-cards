import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false }, realtime: { transport: class {} as any } }
);

async function main() {
  // Search broadly for anything related to opportunity/vacation/fracture
  const { data, error } = await sb
    .from("cards")
    .select("id, hebrew_meaning, translit_nikud, item_type, notes, lesson_id, created_at")
    .or("hebrew_meaning.ilike.%הזדמנות%,hebrew_meaning.ilike.%חופשה%,hebrew_meaning.ilike.%פרצה%")
    .order("created_at", { ascending: true });

  if (error) { console.error(error); process.exit(1); }
  console.log(`נמצאו ${data.length} כרטיסים:`);
  data.forEach(c => console.log(`  id=${c.id} | "${c.hebrew_meaning}" | ${c.translit_nikud} | ${c.created_at?.slice(0,10)}`));
}

main();
