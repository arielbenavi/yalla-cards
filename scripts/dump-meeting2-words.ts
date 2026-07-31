import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const strip = (s: string) => s.replace(/[֑-ׇ]/g, "").replace(/[׳'''`]/g, "").replace(/\s+/g, " ").trim();
async function main() {
  const { data } = await sb.from("cards").select("translit_nikud,hebrew_meaning").eq("item_type","word").eq("lesson_id","5325a7b7-82e9-446c-ac41-d913690d52dd").order("created_at", { ascending: false }).limit(64);
  for (const c of (data ?? [])) console.log(strip(c.translit_nikud), "→", c.hebrew_meaning);
}
main().catch(console.error);
