/**
 * Re-validate arabic_script values against chatifai.
 * Usage: npx tsx scripts/validate-arabic-batch.ts <batch-json> <tsv-path>
 *
 * <batch-json>: {"8charPrefix": "chatifai_response", ...}
 * <tsv-path>: file listing id\thebrew_meaning\ttranslit_nikud per line (from list-all-arabic.ts)
 *
 * For each prefix, compares stored arabic_script with chatifai's response.
 * - Match → sets chatifai_verified = true
 * - Mismatch → appends to /tmp/arabic-disagreements.json and does NOT overwrite
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, existsSync } from "fs";

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const REPORT_PATH = "/tmp/arabic-disagreements.json";

function normalise(s: string): string {
  // Strip harakat, tatweel, extra whitespace; lowercase-like normalise for comparison
  return s
    .replace(/[ً-ْٰ]/g, "")   // harakat
    .replace(/ـ/g, "")        // tatweel
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  const jsonStr = process.argv[2];
  const tsvPath = process.argv[3] ?? "/tmp/all-arabic.tsv";

  if (!jsonStr) {
    console.error("Usage: npx tsx scripts/validate-arabic-batch.ts '<json>' [tsv-path]");
    process.exit(1);
  }

  const chatifaiMap: Record<string, string> = JSON.parse(jsonStr);

  // Load TSV: id\thebrew_meaning\ttranslit_nikud\tarabic_script
  const tsv = readFileSync(tsvPath, "utf-8").split("\n").filter(l => l.trim() && !l.startsWith("◇"));
  const rows: Record<string, { id: string; arabic_script: string }> = {};
  for (const line of tsv) {
    const parts = line.split("\t");
    const id = parts[0];
    const arabic = parts[3];
    if (id && arabic) rows[id.slice(0, 8)] = { id, arabic_script: arabic };
  }

  const disagreements: Array<{ id: string; prefix: string; stored: string; chatifai: string }> = [];
  let verified = 0;
  let skipped = 0;

  for (const [prefix, chatifaiArabic] of Object.entries(chatifaiMap)) {
    const row = rows[prefix];
    if (!row) { console.warn(`⚠ no match for prefix ${prefix}`); skipped++; continue; }

    const storedNorm = normalise(row.arabic_script);
    const chatifaiNorm = normalise(chatifaiArabic);

    if (storedNorm === chatifaiNorm) {
      const { error } = await sb.from("cards").update({ chatifai_verified: true }).eq("id", row.id);
      if (error) console.error(`✗ ${prefix}: ${error.message}`);
      else { console.log(`✅ ${prefix} verified`); verified++; }
    } else {
      console.warn(`⚠ MISMATCH ${prefix}: stored="${row.arabic_script}" chatifai="${chatifaiArabic}"`);
      disagreements.push({ id: row.id, prefix, stored: row.arabic_script, chatifai: chatifaiArabic });
    }
  }

  if (disagreements.length > 0) {
    const existing = existsSync(REPORT_PATH)
      ? JSON.parse(readFileSync(REPORT_PATH, "utf-8"))
      : [];
    writeFileSync(REPORT_PATH, JSON.stringify([...existing, ...disagreements], null, 2));
    console.error(`\n⛔ ${disagreements.length} disagreement(s) written to ${REPORT_PATH}`);
    console.error("Review them before proceeding. Do NOT re-run with --force.");
  }

  console.log(`\nVerified: ${verified}, Skipped: ${skipped}, Disagreements: ${disagreements.length}`);
}

main();
