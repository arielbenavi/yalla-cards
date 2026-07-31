/**
 * Dump all word cards with arabic_script to /tmp/all-arabic.tsv
 * Format: id\thebrew_meaning\ttranslit_nikud\tarabic_script
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "fs";

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

async function main() {
  const { data, error } = await sb
    .from("cards")
    .select("id, hebrew_meaning, translit_nikud, arabic_script")
    .eq("item_type", "word")
    .not("arabic_script", "is", null)
    .order("id");

  if (error) { console.error(error.message); process.exit(1); }

  const lines = (data ?? []).map(r =>
    `${r.id}\t${r.hebrew_meaning}\t${r.translit_nikud}\t${r.arabic_script}`
  );
  writeFileSync("/tmp/all-arabic.tsv", lines.join("\n") + "\n");
  console.log(`Written ${lines.length} rows to /tmp/all-arabic.tsv`);
}

main();
