import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });

async function main() {
  const { data: aron } = await sb.from("cards").select("id, hebrew_meaning, translit_nikud, arabic_script, notes, clip_path, plural_form")
    .or("hebrew_meaning.ilike.%ארון%,translit_nikud.ilike.%חזאן%,translit_nikud.ilike.%חזן%")
    .order("hebrew_meaning");
  console.log("=== ארון/חזאן ===");
  aron?.forEach(c => console.log(`${c.id} | ${c.hebrew_meaning} | ${c.translit_nikud} | clip:${c.clip_path ? "✓" : "✗"} | notes: ${c.notes}`));

  const { data: d2 } = await sb.from("cards").select("id, hebrew_meaning, translit_nikud, notes, plural_form").eq("id", "b1f287bc-8943-4135-af39-d01f9f824a54");
  console.log("\n=== מדרגה full ===");
  console.log(JSON.stringify(d2?.[0], null, 2));

  const { data: d3 } = await sb.from("cards").select("id, hebrew_meaning, translit_nikud, notes, plural_form").eq("id", "9622548a-b1fa-4e9c-a0c5-e88154ed094f");
  console.log("\n=== מסגד (מַסְגִ'ד) full ===");
  console.log(JSON.stringify(d3?.[0], null, 2));
}

main();
