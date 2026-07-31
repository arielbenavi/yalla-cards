import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });

async function main() {
  // Check if column exists by trying to select it
  const { data, error } = await sb.from("cards")
    .select("id, hebrew_meaning, translit_nikud, arabic_script")
    .eq("item_type", "word")
    .limit(5);
  if (error) { console.error("column error:", error.message); return; }
  console.log("Sample (arabic_script field):");
  data?.forEach(c => console.log(c.hebrew_meaning, "→", c.arabic_script ?? "(null)"));
  
  const { count } = await sb.from("cards").select("id", { count: "exact", head: true })
    .is("arabic_script", null).eq("item_type", "word");
  console.log("\nTotal words without arabic_script:", count);
}
main();
