import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });

async function main() {
  const { data } = await sb.from("cards")
    .select("id, hebrew_meaning, translit_nikud, arabic_script, notes, clip_path, plural_form")
    .or("hebrew_meaning.ilike.%מקלט%,hebrew_meaning.ilike.%מחסה%,hebrew_meaning.ilike.%שעה%,hebrew_meaning.ilike.%שעון%")
    .order("created_at");
  data?.forEach(c => console.log(`${c.id} | ${c.translit_nikud?.padEnd(20)} | ${c.hebrew_meaning} | clip: ${c.clip_path ?? '-'} | plural: ${c.plural_form ?? '-'}`));
}
main();
