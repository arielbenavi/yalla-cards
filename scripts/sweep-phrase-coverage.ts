/**
 * Word-by-word coverage sweep.
 * Goes through every phrase/sentence card, extracts each translit token,
 * and reports which tokens do NOT have a standalone word card.
 * Skips: pronouns, particles, prepositions, ואללה, names, short function words.
 * Run: npx tsx scripts/sweep-phrase-coverage.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false }, realtime: { transport: class {} as any } }
);

// Strip Hebrew nikud diacritics
function strip(s: string) {
  return s.replace(/[ְ-ׇֽֿׁׂׅׄ]/g, "").toLowerCase().trim();
}

// Tokens to skip — functional words, pronouns, particles in Palestinian Arabic translit
const SKIP_TOKENS = new Set([
  // pronouns
  "אנא", "אנת", "אנתי", "הו", "הי", "אחנא", "נחנא", "אנתו", "הם", "הן", "אנאנא",
  // greetings / exclamations that aren't vocabulary targets
  "ואללה", "יאללה", "אינשאללה", "אלחמדוללה", "בסמאללה", "מאשאללה",
  // yes/no
  "אה", "לא", "אייה", "אבדן",
  // question words (usually covered as vocab)
  // Names
  "רועה", "באסם", "פאטמה", "מוחמד",
  // ultra-short (will be filtered by length anyway)
  "ב", "ל", "ו", "מ", "פ", "כ",
  // conjunctions / connectors (stripped as prefixes below)
  "יא", "מא",
]);

// Common detachable prefixes in Palestinian Arabic translit
const PREFIXES = [
  "ו", "בּ", "ב", "ל", "מן", "מ", "כ",
  "(א)ל", "אל", "ה",
];

function stripPrefix(tok: string): string {
  for (const p of PREFIXES) {
    if (tok.startsWith(p) && tok.length > p.length + 1) {
      return tok.slice(p.length);
    }
  }
  return tok;
}

// Common suffixes that inflect base forms (possessive, verb conjugation endings)
const SUFFIXES = ["י", "כ", "כּ", "ה", "נא", "כם", "הם", "ו", "וּ", "א"];

function stripSuffix(tok: string): string {
  for (const s of SUFFIXES) {
    if (tok.endsWith(s) && tok.length > s.length + 2) {
      return tok.slice(0, tok.length - s.length);
    }
  }
  return tok;
}

function tokenize(translit: string): string[] {
  return translit
    .replace(/[?!.,;:״׳"()[\]{}\/\\]/g, " ")
    .split(/\s+/)
    .map((t) => strip(t))
    .filter((t) => t.length > 1);
}

interface Card {
  id: string;
  hebrew_meaning: string;
  translit_nikud: string;
  arabic_script: string | null;
  item_type: string;
  lessons?: { title: string } | null;
}

async function main() {
  const { data: phrases } = await sb
    .from("cards")
    .select("id, hebrew_meaning, translit_nikud, arabic_script, item_type, lessons(title)")
    .in("item_type", ["phrase", "sentence"])
    .not("translit_nikud", "is", null);

  const { data: words } = await sb
    .from("cards")
    .select("hebrew_meaning, translit_nikud")
    .eq("item_type", "word");

  // Build word lookup: every stripped token + its no-suffix and no-prefix variants
  const wordSet = new Set<string>();
  for (const w of words ?? []) {
    for (const variant of (w.translit_nikud as string).split("/").map((v: string) => strip(v.trim()))) {
      wordSet.add(variant);
      wordSet.add(stripPrefix(variant));
      wordSet.add(stripSuffix(variant));
      wordSet.add(stripSuffix(stripPrefix(variant)));
    }
  }

  // Track missing tokens → which phrases they appear in
  type Entry = { phraseHe: string; phraseTranslit: string; lesson: string };
  const missing = new Map<string, Entry[]>();

  for (const p of (phrases ?? []) as unknown as Card[]) {
    const lesson = p.lessons?.title ?? "?";
    const tokens = tokenize(p.translit_nikud);

    for (const rawTok of tokens) {
      const tok = rawTok;
      if (tok.length < 2) continue;
      if (SKIP_TOKENS.has(tok)) continue;

      // Check direct + prefix-stripped + suffix-stripped variants
      const stripped = stripPrefix(tok);
      const suffStripped = stripSuffix(tok);
      const bothStripped = stripSuffix(stripped);

      if (
        wordSet.has(tok) ||
        wordSet.has(stripped) ||
        wordSet.has(suffStripped) ||
        wordSet.has(bothStripped)
      ) continue;

      if (!missing.has(tok)) missing.set(tok, []);
      missing.get(tok)!.push({ phraseHe: p.hebrew_meaning, phraseTranslit: p.translit_nikud, lesson });
    }
  }

  // Sort by frequency desc
  const sorted = [...missing.entries()].sort((a, b) => b[1].length - a[1].length);

  console.log(`\n=== מילים שמופיעות בביטויים אך חסרות כ-word card (${sorted.length} טוקנים) ===\n`);
  for (const [tok, entries] of sorted) {
    const example = entries[0];
    const lessons = [...new Set(entries.map((e) => e.lesson))].join(", ");
    console.log(`• ${tok}  [${entries.length}x | ${lessons}]`);
    console.log(`  בביטוי: "${example.phraseHe}"`);
    console.log(`  תעתיק:  ${example.phraseTranslit}`);
    console.log();
  }

  console.log(`\nסה"כ: ${sorted.length} טוקנים חסרים מתוך ${phrases?.length ?? 0} ביטויים/משפטים`);
}

main().catch((e) => { console.error(e); process.exit(1); });
