import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });

async function main() {
  const { data } = await sb.from("recordings")
    .select("id, title, lesson_id, source_filename, created_at, transcript_json")
    .order("created_at", { ascending: true });
  
  const noTitle = data?.filter(r => !r.title && !r.lesson_id) ?? [];
  const noTranscript = data?.filter(r => !r.transcript_json) ?? [];
  
  console.log(`Total recordings: ${data?.length}`);
  console.log(`No title AND no lesson: ${noTitle.length}`);
  console.log(`No transcript: ${noTranscript.length}`);
  console.log("\nSample no-title:");
  noTitle.slice(0,5).forEach(r => console.log(` ${r.id.slice(0,8)} | ${r.source_filename ?? "no filename"} | ${r.created_at.slice(0,10)}`));
}
main();
