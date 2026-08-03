// One prioritised list of words to turn into cards.
//
// Two separate scans found missing vocabulary and neither list was actionable
// on its own: `find-missing-vocab-from-phrases.ts` (note b4fe5996) looks inside
// stored phrases, and `dialogue-vocab-coverage.ts` (note a4e6b161) looks at the
// simulations. A word that both of them want is the strongest candidate there
// is, and sending chatifai one deduplicated list is a single pass instead of
// two overlapping ones.
//
// Output is deliberately just the words. Nikud comes from chatifai; nothing
// here guesses it.
//
//   npx tsx scripts/build-vocab-worklist.ts > docs/vocab-worklist.md
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const strip = (w: string) =>
  w
    .normalize("NFC")
    .replace(/[֑-ׇ]/g, "")
    .replace(/[.,?!״"'’—…]/g, "")
    .replace(/^[ובלכשמ]?-?(?:אל|אִל|א)-/, "")
    .trim();

const tokenize = (line: string) =>
  line.split(/[\s־]+/).map(strip).filter((w) => w.length > 1);

/** Proper names from the textbook dialogues are not vocabulary. */
const NAMES = new Set([
  "אחמד", "מחמד", "סמיר", "אמיר", "עלי", "חסן", "פאטמה", "ליילא", "מאהר",
  "סאמי", "נאדיא", "רים", "יוסף", "כרים", "סלים", "האני", "רנא", "דינא",
  "[שם]",
]);

// Raw frequency ranks function words to the top — פי, שו, יא, לא, מש lead the
// list — and those are grammar Ariel has been using since מפגש 1, not cards
// waiting to be made. They are excluded so the list surfaces content words.
// Inflected pronoun forms (בדכ, ענדכ, אלכ) are excluded for the same reason:
// they belong to the possessives and prepositions drills, not to new cards.
const FUNCTION_WORDS = new Set([
  "פי", "שו", "יא", "עלא", "לא", "מש", "אה", "אנא", "אנת", "אנו", "אן",
  "האדא", "האדי", "האי", "האד", "הדאכ", "הו", "הווה", "הי", "אחנא", "הם",
  "מן", "מע", "בס", "כמאן", "כל", "כלו", "אלי", "אללי", "או", "ו", "בל",
  "לו", "הון", "הנאכ", "אלכ", "בדכ", "בדי", "ענדכ", "ענדי", "ענדנא", "מעו",
  "אלה", "אללה", "ואללה", "ל", "ב", "עלי", "עליك",
]);

async function all<T>(table: string, cols: string): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from(table).select(cols).range(from, from + 999);
    if (error) throw error;
    if (!data?.length) break;
    out.push(...(data as T[]));
    if (data.length < 1000) break;
  }
  return out;
}

async function main() {
  const cards = await all<{ translit_nikud: string | null; item_type: string }>(
    "cards",
    "translit_nikud, item_type"
  );

  // A word "has a card" only if it is a card in its own right — appearing
  // inside a stored phrase is exactly the gap being measured.
  const owned = new Set(
    cards.filter((c) => c.item_type === "word").map((c) => strip(c.translit_nikud ?? ""))
  );

  const score = new Map<string, { phrases: number; dialogues: number; example: string }>();
  const bump = (w: string, key: "phrases" | "dialogues", example: string) => {
    if (!w || owned.has(w) || NAMES.has(w) || FUNCTION_WORDS.has(w)) return;
    const e = score.get(w) ?? { phrases: 0, dialogues: 0, example: example };
    e[key]++;
    score.set(w, e);
  };

  for (const c of cards) {
    if (c.item_type === "word") continue;
    for (const w of tokenize(c.translit_nikud ?? "")) bump(w, "phrases", c.translit_nikud ?? "");
  }

  const rows = await all<{ slug: string; data: unknown }>("paradigms", "slug, data");
  for (const r of rows) {
    if (!r.slug.startsWith("simulation_")) continue;
    const d = r.data as { turns?: Record<string, unknown>[] };
    const seen = new Set<string>();
    for (const t of d.turns ?? []) {
      for (const c of [t, ...(((t.options as Record<string, unknown>[]) ?? []))]) {
        for (const w of tokenize((c.translit as string) ?? "")) {
          if (seen.has(w)) continue;
          seen.add(w);
          bump(w, "dialogues", (c.translit as string) ?? "");
        }
      }
    }
  }

  const ranked = [...score.entries()]
    .map(([w, e]) => ({ w, ...e, total: e.phrases + e.dialogues * 2 }))
    .sort((a, b) => b.total - a.total);

  const both = ranked.filter((r) => r.phrases > 0 && r.dialogues > 0);

  console.log(`# רשימת עבודה: מילים שצריכות כרטיס\n`);
  console.log(`נוצר על ידי \`npx tsx scripts/build-vocab-worklist.ts\`.\n`);
  console.log(
    `מאחד את הסריקה של הביטויים (b4fe5996) ואת הסריקה של הסימולציות (a4e6b161). ` +
      `דו-שיחים נספרים כפול — מילה שחוזרת בכמה סימולציות משפרת יותר.\n`
  );
  console.log(`**${ranked.length} מועמדים · ${both.length} מופיעים בשני המקורות.**\n`);
  console.log(`הניקוד מגיע מ-chatifai. שום דבר כאן לא מנוקד בניחוש.\n`);

  console.log(`## עדיפות ראשונה — גם בביטויים וגם בסימולציות (${both.length})\n`);
  console.log("| מילה | ביטויים | סימולציות | דוגמה |");
  console.log("|---|---|---|---|");
  for (const r of both.slice(0, 60)) {
    console.log(`| ${r.w} | ${r.phrases} | ${r.dialogues} | ${r.example.slice(0, 40)} |`);
  }

  const dialogueOnly = ranked.filter((r) => r.phrases === 0 && r.dialogues > 1);
  console.log(`\n## רק בסימולציות, ביותר מאחת (${dialogueOnly.length})\n`);
  console.log(dialogueOnly.slice(0, 60).map((r) => `${r.w} (${r.dialogues})`).join(" · "));
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
