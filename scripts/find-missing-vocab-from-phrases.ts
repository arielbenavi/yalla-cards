/**
 * Note b4fe5996: scan phrase/sentence cards for content words that have no word
 * card of their own, so they can be added as vocabulary.
 *
 * The naive version of this reported 372 tokens, almost all noise: the definite
 * article assimilates in transliteration (אלבית is written לבית), so every "the
 * X" looked like an unknown word even when X had a card. Matching now normalises
 * both sides the same way — article, conjunction ו, preposition ב/ל, and the
 * construct-state ת are stripped before comparing — and a stoplist removes
 * pronouns and particles, which are grammar, not vocabulary.
 *
 * Run: npx tsx scripts/find-missing-vocab-from-phrases.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const stripNikud = (s: string) => s.replace(/[֑-ׇ]/g, "").trim();

/** Function words: grammar, not vocabulary. Reporting these is just noise. */
const STOPLIST = new Set([
  // pronouns
  "אנא", "אנת", "אנתי", "הו", "הי", "הם", "אחנא", "אנתו", "הוא", "היא", "הנ",
  // demonstratives
  "האדא", "האדי", "הדול", "הדאכ", "הדיכ", "הדולאכ", "האד", "האי",
  // particles, prepositions, conjunctions
  "שו", "מין", "וין", "פין", "מא", "מש", "לא", "יא", "בס", "כמאן", "כל", "פי",
  "מן", "עלא", "ען", "מע", "אלי", "אללי", "לו", "אן", "אנו", "חתא", "או", "ולא",
  "לה", "לו", "לכ", "לי", "בכ", "ביכ", "פיהא", "פיה", "עמ", "עם", "אד", "היכ",
  "כיף", "לימא", "למא", "אדיש", "קדיש", "כם", "אימתא", "ליש", "טיב", "טב",
  "ה", "ו", "ב", "ל", "כ", "אל", "ال",
]);

/** Strip proclitics: conjunction ו, prepositions ב/ל/כ, and the definite article
 *  in all the shapes the transliteration uses — including the assimilated form
 *  where אל collapses onto the following consonant (אלבית → לבית). */
function stripProclitics(tok: string): string[] {
  const out = new Set<string>([tok]);
  let t = tok;

  // conjunction
  if (t.startsWith("ו") && t.length > 2) {
    t = t.slice(1);
    out.add(t);
  }

  // parenthesised article forms the corpus uses: (א)ל, (אל)
  let s = t.replace(/^\(א\)ל/, "").replace(/^\(אל\)/, "");
  if (s !== t) out.add(s);
  t = s;

  // preposition + article
  for (const p of ["באל", "בל", "לאל", "כאל", "מנאל"]) {
    if (t.startsWith(p) && t.length > p.length + 1) out.add(t.slice(p.length));
  }
  // bare preposition
  for (const p of ["ב", "ל", "כ"]) {
    if (t.startsWith(p) && t.length > 2) out.add(t.slice(1));
  }
  // article, plain and assimilated
  if (t.startsWith("אל") && t.length > 3) out.add(t.slice(2));
  if (t.startsWith("ל") && t.length > 2) out.add(t.slice(1));

  return [...out].filter((x) => x.length > 1);
}

/** Possessive/object suffixes and the construct-state ת. */
function stripSuffixes(tok: string): string[] {
  const out = new Set<string>([tok]);
  for (const suf of ["נא", "כם", "הם", "הא", "כי", "י", "כ", "ה", "ו", "ן"]) {
    if (tok.endsWith(suf) && tok.length - suf.length > 1) out.add(tok.slice(0, -suf.length));
  }
  // construct state: מחטת ← מחטה, כאסת ← כאסה
  if (tok.endsWith("ת") && tok.length > 3) {
    out.add(tok.slice(0, -1) + "ה");
    out.add(tok.slice(0, -1));
  }
  return [...out].filter((x) => x.length > 1);
}

/** All normalised shapes a token could match under. */
function variants(tok: string): string[] {
  const out = new Set<string>();
  for (const a of stripProclitics(tok)) {
    out.add(a);
    for (const b of stripSuffixes(a)) out.add(b);
  }
  return [...out];
}

function tokenize(translit: string): string[] {
  return translit
    .split(/[\s()?.!,\/־–-]+/)
    .map(stripNikud)
    .filter((t) => t.length > 1);
}

async function main() {
  const { data: phrases } = await sb
    .from("cards")
    .select("hebrew_meaning, translit_nikud")
    .in("item_type", ["phrase", "sentence"]);

  const { data: words } = await sb
    .from("cards")
    .select("hebrew_meaning, translit_nikud, plural_form")
    .eq("item_type", "word");

  // Index every known word under all of its normalised shapes, so a phrase token
  // and a word card meet in the middle rather than only on an exact match.
  const known = new Set<string>();
  for (const w of words ?? []) {
    const forms = [w.translit_nikud, w.plural_form].filter(Boolean) as string[];
    for (const f of forms) {
      for (const variant of f.split("/")) {
        const base = stripNikud(variant.trim());
        if (!base) continue;
        for (const v of variants(base)) known.add(v);
      }
    }
  }

  const missing = new Map<string, { he: string; count: number }>();
  for (const p of phrases ?? []) {
    if (!p.translit_nikud) continue;
    for (const raw of tokenize(p.translit_nikud)) {
      const forms = variants(raw);
      if (forms.some((f) => known.has(f) || STOPLIST.has(f))) continue;
      if (STOPLIST.has(raw)) continue;
      // The shortest normalised form is the likeliest dictionary shape
      const key = forms.sort((a, b) => a.length - b.length)[0] ?? raw;
      if (key.length < 3) continue;
      const hit = missing.get(key);
      if (hit) hit.count++;
      else missing.set(key, { he: p.hebrew_meaning, count: 1 });
    }
  }

  const sorted = [...missing.entries()].sort((a, b) => b[1].count - a[1].count);
  console.log(`\n=== מילים בביטויים שאין להן כרטיס משלהן (${sorted.length}) ===\n`);
  for (const [tok, info] of sorted) {
    console.log(`• ${tok.padEnd(14)} ${String(info.count).padStart(2)}x   — ב: "${info.he}"`);
  }
  console.log(`\n(${(phrases ?? []).length} ביטויים/משפטים · ${(words ?? []).length} מילות בסיס)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
