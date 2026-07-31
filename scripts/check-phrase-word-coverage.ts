/**
 * Lists all phrase/sentence cards so we can verify each constituent word
 * exists as a standalone card. Outputs phrases, then flags any word
 * (by hebrew_meaning) that doesn't appear in the word card pool.
 * Run: npx tsx scripts/check-phrase-word-coverage.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false }, realtime: { transport: class {} as any } }
);

async function main() {
  const { data: phrases } = await sb
    .from("cards")
    .select("id, hebrew_meaning, translit_nikud, arabic_script, item_type, plural_form")
    .in("item_type", ["phrase", "sentence"])
    .order("item_type")
    .order("hebrew_meaning");

  const { data: words } = await sb
    .from("cards")
    .select("hebrew_meaning, translit_nikud, arabic_script, plural_form")
    .eq("item_type", "word");

  const wordSet = new Set(
    (words ?? []).map((w: { translit_nikud: string }) =>
      stripNikud(w.translit_nikud).toLowerCase()
    )
  );

  console.log(`=== כל ביטויים + משפטים (${phrases?.length ?? 0}) ===\n`);

  for (const p of phrases ?? []) {
    console.log(`[${p.item_type}] ${p.hebrew_meaning}`);
    console.log(`  תעתיק: ${p.translit_nikud}`);
    console.log(`  ערבית: ${p.arabic_script}`);
    if (p.plural_form) console.log(`  רבים:  ${p.plural_form}`);
    console.log();
  }

  console.log(`\n=== סיכום ===`);
  console.log(`ביטויים: ${phrases?.filter(p => p.item_type === "phrase").length ?? 0}`);
  console.log(`משפטים:  ${phrases?.filter(p => p.item_type === "sentence").length ?? 0}`);
  console.log(`מילים (word):  ${words?.length ?? 0}`);
}

function stripNikud(s: string) {
  return s.replace(/[ְ-ׇֽֿׁׂׅׄ]/g, "").trim();
}

main().catch((e) => { console.error(e); process.exit(1); });
