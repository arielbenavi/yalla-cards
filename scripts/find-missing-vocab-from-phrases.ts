/**
 * Scans phrase/sentence cards, extracts individual word tokens from their
 * translit_nikud (stripping common prefixes/particles), and cross-references
 * against existing word cards. Reports tokens that appear only in phrases.
 * Run: npx tsx scripts/find-missing-vocab-from-phrases.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false }, realtime: { transport: class {} as any } }
);

// Strip Hebrew nikud
function strip(s: string) {
  return s.replace(/[ְ-ׇֽֿׁׂׅׄ]/g, "").trim();
}

// Common prefixes/particles that attach to words in Palestinian Arabic transliteration
const PREFIXES = ["(א)ל", "אל", "(אל)", "בּ", "בּ(א)ל", "ב(א)ל", "בִּ(א)ל", "לְ", "לְ(א)ל", "מִן", "מִנְ", "וְ", "וּ", "כּ"];

function stripPrefix(tok: string): string {
  let t = tok;
  for (const p of PREFIXES) {
    if (t.startsWith(p)) { t = t.slice(p.length); break; }
  }
  return t;
}

// Very rough tokenizer: split on spaces, parens, question/period marks
function tokenize(translit: string): string[] {
  return translit
    .split(/[\s\(\)\?\.\!,\/]+/)
    .map((t) => strip(t))
    .filter((t) => t.length > 1);
}

async function main() {
  const { data: phrases } = await sb
    .from("cards")
    .select("hebrew_meaning, translit_nikud, arabic_script")
    .in("item_type", ["phrase", "sentence"]);

  const { data: words } = await sb
    .from("cards")
    .select("hebrew_meaning, translit_nikud, arabic_script, plural_form")
    .eq("item_type", "word");

  // Build word lookup by stripped translit token
  const wordByToken = new Map<string, { he: string; ar: string | null; plural: string | null }>();
  for (const w of words ?? []) {
    // Index each slash-separated variant
    for (const variant of w.translit_nikud.split("/").map((v: string) => strip(v.trim()))) {
      wordByToken.set(variant.toLowerCase(), { he: w.hebrew_meaning, ar: w.arabic_script, plural: w.plural_form });
    }
  }

  // Track phrase-tokens not found in word cards
  const missing = new Map<string, { phraseHe: string; phraseTranslit: string }[]>();

  for (const p of phrases ?? []) {
    if (!p.translit_nikud) continue;
    const tokens = tokenize(p.translit_nikud);
    for (const raw of tokens) {
      const tok = strip(stripPrefix(raw)).toLowerCase();
      if (tok.length < 2) continue;
      if (wordByToken.has(tok)) continue;
      // Also try without common suffix inflections (-י,-כ,-ה,-נא,-כם,-הם,-וֹ,-כּ)
      const shortened = tok.replace(/[יכהכּוֹ]$/, "").replace(/נא$/, "").replace(/כם$/, "");
      if (shortened.length > 1 && wordByToken.has(shortened)) continue;

      if (!missing.has(tok)) missing.set(tok, []);
      missing.get(tok)!.push({ phraseHe: p.hebrew_meaning, phraseTranslit: p.translit_nikud });
    }
  }

  // Sort by frequency (most common across phrases first)
  const sorted = [...missing.entries()].sort((a, b) => b[1].length - a[1].length);

  console.log(`\n=== טוקנים בביטויים שלא נמצאו כמילות בסיס (${sorted.length}) ===\n`);
  for (const [tok, phrases] of sorted.slice(0, 80)) {
    const example = phrases[0];
    console.log(`• ${tok}  (${phrases.length}x) — ב: "${example.phraseHe}"`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
