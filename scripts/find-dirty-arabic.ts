import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

// Arabic block + space only
const ARABIC_ONLY = /^[؀-ۿ\s]+$/;
// Harakat (tashkil)
const HARAKAT = /[ً-ْٰ]/;

async function main() {
  const { data, error } = await sb
    .from("cards")
    .select("id, hebrew_meaning, arabic_script")
    .eq("item_type", "word")
    .not("arabic_script", "is", null);

  if (error) { console.error(error.message); process.exit(1); }

  const nonArabic: typeof data = [];
  const withHarakat: typeof data = [];
  const multiWord: typeof data = [];

  for (const row of data ?? []) {
    const val = row.arabic_script as string;
    if (!ARABIC_ONLY.test(val)) nonArabic.push(row);
    if (HARAKAT.test(val)) withHarakat.push(row);
    // multi-word: contains space (but not just whitespace edge)
    if (val.trim().includes(" ")) multiWord.push(row);
  }

  console.log(`\n=== Non-Arabic characters (expect ~2) — ${nonArabic.length} ===`);
  for (const r of nonArabic) {
    console.log(`  ${r.id.slice(0,8)} | ${r.hebrew_meaning} | "${r.arabic_script}"`);
  }

  console.log(`\n=== Contains harakat (expect ~2) — ${withHarakat.length} ===`);
  for (const r of withHarakat) {
    console.log(`  ${r.id.slice(0,8)} | ${r.hebrew_meaning} | "${r.arabic_script}"`);
  }

  console.log(`\n=== Multi-word values (expect ~5) — ${multiWord.length} ===`);
  for (const r of multiWord) {
    console.log(`  ${r.id.slice(0,8)} | ${r.hebrew_meaning} | "${r.arabic_script}"`);
  }

  console.log(`\nTotal words with arabic_script: ${data?.length}`);
}

main();
