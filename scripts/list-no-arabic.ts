import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });

async function main() {
  const { data, error } = await sb.from("cards")
    .select("id, hebrew_meaning, translit_nikud")
    .is("arabic_script", null)
    .eq("item_type", "word")
    .order("id");
  if (error) { console.error(error.message); return; }
  // Print as TSV: id\thebrew_meaning\ttranslit_nikud
  data?.forEach(c => console.log(`${c.id}\t${c.hebrew_meaning}\t${c.translit_nikud ?? ""}`));
}
main();
