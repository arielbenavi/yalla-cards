import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });

// Read JSON from stdin or first arg
const jsonStr = process.argv[2] ?? readFileSync("/dev/stdin", "utf-8");
const mapping: Record<string, string> = JSON.parse(jsonStr);

// Load TSV to map 8-char prefix → full UUID
const tsv = readFileSync("/tmp/words-no-arabic.tsv", "utf-8")
  .split("\n")
  .filter(l => !l.startsWith("◇") && l.trim());

const prefixToId: Record<string, string> = {};
for (const line of tsv) {
  const [id] = line.split("\t");
  if (id) prefixToId[id.slice(0, 8)] = id;
}

async function main() {
  let updated = 0;
  for (const [prefix, arabic] of Object.entries(mapping)) {
    const fullId = prefixToId[prefix];
    if (!fullId) { console.warn(`⚠ no match for ${prefix}`); continue; }
    const { error } = await sb.from("cards").update({ arabic_script: arabic, chatifai_verified: true }).eq("id", fullId);
    if (error) console.error(`✗ ${prefix}: ${error.message}`);
    else { console.log(`✅ ${prefix} → ${arabic}`); updated++; }
  }
  console.log(`\nDone: ${updated}/${Object.keys(mapping).length}`);
}
main();
