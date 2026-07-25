import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
async function main() {
  const { data } = await sb.from("notes").select("id, body, tag, created_at").eq("status", "open").order("created_at", { ascending: false });
  data?.forEach(n => console.log(`[${n.tag ?? '—'}] ${n.body}\n  id: ${n.id}\n`));
  console.log(`סה"כ: ${data?.length ?? 0}`);
}
main();
