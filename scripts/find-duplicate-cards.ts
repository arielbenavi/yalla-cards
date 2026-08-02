// Lists cards sharing a transliteration, so duplicates can be triaged.
//
// Not every shared translit is a duplicate — مرة is genuinely both "פעם" and
// "אישה", and a word can legitimately recur across lessons. What this separates
// is the cases where the Hebrew side is the same too (a true duplicate, safe to
// merge) from the cases where it differs (two senses, or one of them wrong).
//
// Merging is not automated: which card survives depends on review history and
// which lesson the word belongs to, and that is a judgement call.
//
//   npx tsx scripts/find-duplicate-cards.ts
//   npx tsx scripts/find-duplicate-cards.ts --same-meaning
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const SAME_ONLY = process.argv.includes("--same-meaning");
const strip = (s: string) => s.normalize("NFC").replace(/[֑-ׇ]/g, "").trim();

type Card = {
  id: string;
  hebrew_meaning: string;
  translit_nikud: string;
  arabic_script: string | null;
  lesson_id: string | null;
  item_type: string;
};

async function main() {
  const cards: Card[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await sb
      .from("cards")
      .select("id, hebrew_meaning, translit_nikud, arabic_script, lesson_id, item_type")
      .eq("item_type", "word")
      .range(from, from + 999);
    if (!data?.length) break;
    cards.push(...(data as Card[]));
    if (data.length < 1000) break;
  }

  const { data: lessons } = await sb.from("lessons").select("id, title");
  const title = new Map((lessons ?? []).map((l) => [l.id, l.title]));

  // review_log counts decide which card of a pair should survive
  const { data: srs } = await sb.from("card_srs").select("id, card_id");
  const srsByCard = new Map<string, string[]>();
  for (const s of srs ?? []) {
    if (!srsByCard.has(s.card_id)) srsByCard.set(s.card_id, []);
    srsByCard.get(s.card_id)!.push(s.id);
  }
  // review_log is well past PostgREST's 1000-row default cap — without paging
  // this silently undercounts and picks the wrong card to keep.
  const logsBySrs = new Map<string, number>();
  for (let from = 0; ; from += 1000) {
    const { data: logs } = await sb.from("review_log").select("card_srs_id").range(from, from + 999);
    if (!logs?.length) break;
    for (const l of logs) logsBySrs.set(l.card_srs_id, (logsBySrs.get(l.card_srs_id) ?? 0) + 1);
    if (logs.length < 1000) break;
  }
  const reviewCount = (cardId: string) =>
    (srsByCard.get(cardId) ?? []).reduce((n, id) => n + (logsBySrs.get(id) ?? 0), 0);

  const groups = new Map<string, Card[]>();
  for (const c of cards) {
    const k = strip(c.translit_nikud);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(c);
  }

  const dups = [...groups.entries()].filter(([, v]) => v.length > 1);
  const sameMeaning = dups.filter(([, v]) => new Set(v.map((c) => c.hebrew_meaning)).size === 1);
  const diffMeaning = dups.filter(([, v]) => new Set(v.map((c) => c.hebrew_meaning)).size > 1);

  const show = (label: string, list: [string, Card[]][]) => {
    console.log(`\n### ${label} — ${list.length}\n`);
    for (const [, v] of list) {
      for (const c of v) {
        const n = reviewCount(c.id);
        console.log(
          `  ${c.id.slice(0, 8)} ${String(c.translit_nikud).padEnd(18)} ` +
            `${String(c.arabic_script ?? "—").padEnd(10)} חזרות:${String(n).padStart(3)}  ` +
            `${String(title.get(c.lesson_id ?? "") ?? "—").padEnd(30)} ${c.hebrew_meaning}`
        );
      }
      console.log("");
    }
  };

  console.log(`${cards.length} מילים · ${dups.length} תעתיקים חוזרים`);
  show("אותה משמעות — כפילות אמיתית, בטוח למזג", sameMeaning);
  if (!SAME_ONLY) {
    show("משמעות שונה — שני מובנים או שאחד מהם שגוי, צריך שיפוט", diffMeaning);
  }

  console.log(
    "\nלמיזוג: שמור את הכרטיס עם יותר חזרות; אם לשניהם 0, שמור את זה שבשיעור הנכון."
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
