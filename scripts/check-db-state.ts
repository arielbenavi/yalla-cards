import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false }, realtime: { transport: class {} as any } }
);

async function main() {
  const { data: lessons } = await supabase.from("lessons").select("id, date, title").order("date");
  console.log("=== LESSONS ===");
  lessons?.forEach(l => console.log(`  ${l.date} | ${l.title ?? "(no title)"} | ${l.id}`));

  const { data: recentCards } = await supabase
    .from("cards")
    .select("id, item_type, translit_nikud, hebrew_meaning, lesson_id, created_at")
    .order("created_at", { ascending: false })
    .limit(15);
  console.log("\n=== RECENT 15 CARDS ===");
  recentCards?.forEach(c => console.log(`  [${c.item_type}] ${c.translit_nikud} — ${c.hebrew_meaning} | lesson: ${c.lesson_id ?? "none"} | ${c.created_at}`));

  const { count: noTranscript } = await supabase
    .from("recordings")
    .select("*", { count: "exact", head: true })
    .is("transcript_json", null);
  console.log(`\n=== RECORDINGS WITHOUT TRANSCRIPT: ${noTranscript} ===`);
}

main();
