import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });

async function del(id: string, label: string) {
  const { error } = await sb.from("cards").delete().eq("id", id);
  if (error) console.error(`✗ delete ${label}: ${error.message}`);
  else console.log(`✅ deleted ${label} (${id})`);
}

async function main() {
  // מקלט: keep 3f0d4af5 (מקלט (מחסה)), delete 8a11f0b4 (מקלט plain)
  // Fix plural_form on kept card — remove the parenthetical note, just מַלַאגִ'י
  await sb.from("cards").update({ plural_form: "מַלַאגִ'י" }).eq("id", "3f0d4af5-560c-4747-adba-32f7b5a1bad7");
  console.log("✅ fixed plural_form on מקלט (מחסה)");
  await del("8a11f0b4-b2dc-4c60-aae5-75187ff753f7", "מקלט (plain)");

  // שעה: keep f525bb89 (שעון / שעה), delete 4c190d0e (שעה only)
  await del("4c190d0e-9703-4cea-9e95-7d77272797f9", "שעה (plain)");
}
main();
