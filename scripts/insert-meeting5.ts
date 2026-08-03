// Inserts מפגש 5 vocabulary from scripts/data/meeting5-verified.ts.
//
// Every card is chatifai's output verbatim. Plurals become their own cards —
// the colours especially, since the whole point of the lesson is that the three
// patterns differ.
//
// Skips anything whose transliteration already exists, creates the card_srs row
// so the card actually reaches review, and refuses to write if a card would go
// in with an empty Arabic or Hebrew side.
//
//   npx tsx scripts/insert-meeting5.ts          # dry run
//   npx tsx scripts/insert-meeting5.ts --apply
import { config } from "dotenv";
import { normalizeMarks, assertClean } from "./lib/normalize-marks";
import { createClient } from "@supabase/supabase-js";
import { NOTES, COLOURS, COLOURS_EXTRA, BOOK, type V } from "./data/meeting5-verified";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const APPLY = process.argv.includes("--apply");
const LESSON = "מפגש 5";
const strip = (s: string) => s.normalize("NFC").replace(/[֑-ׇ]/g, "").replace(/\s+/g, " ").trim();

const HEBREW = /[א-ת]/;
const ARABIC = /[ء-ي]/;

type Row = { translit: string; ar: string; he: string; notes?: string };

function expand(): Row[] {
  const out: Row[] = [];
  const push = (v: V, translit: string, ar: string, he: string) => {
    const notes = [v.note, v.was ? `הספר/ההערות: ${v.was}` : null].filter(Boolean).join(" · ");
    out.push({ translit, ar, he, notes: notes || undefined });
  };

  for (const v of [...NOTES, ...COLOURS_EXTRA, ...BOOK]) {
    push(v, v.translit, v.ar, v.he);
    if (v.plural && v.plural_ar) push(v, v.plural, v.plural_ar, `${v.he} (ר)`);
  }
  for (const c of COLOURS) {
    push(c, c.translit, c.ar, c.he);
    push(c, c.f, c.f_ar, `${c.he} (נ)`);
    push(c, c.pl, c.pl_ar, `${c.he} (ר)`);
  }
  return out;
}

async function main() {
  const rows = expand();

  // Validate before touching anything — a Hebrew word in the Arabic column has
  // slipped through three times on this project.
  // Normalise codepoints BEFORE validating, then refuse anything still mixed.
  for (const r of rows) {
    r.translit = normalizeMarks(r.translit);
    assertClean(r.translit.slice(0, 30), r.translit, r.ar);
    if (!r.he?.trim()) throw new Error(`אין פירוש עברי: ${r.translit}`);
  }

  const known = new Set<string>();
  for (let from = 0; ; from += 1000) {
    const { data } = await sb.from("cards").select("translit_nikud").range(from, from + 999);
    if (!data?.length) break;
    for (const c of data) known.add(strip(c.translit_nikud ?? ""));
    if (data.length < 1000) break;
  }

  const seen = new Set<string>();
  const toAdd = rows.filter((r) => {
    const k = strip(r.translit);
    if (known.has(k) || seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  console.log(`${rows.length} צורות · ${rows.length - toAdd.length} כבר קיימות · ${toAdd.length} להוספה\n`);
  for (const r of toAdd) console.log(`  ${r.translit.padEnd(22)} ${r.ar.padEnd(12)} ${r.he}`);

  if (!APPLY) {
    console.log("\ndry run — pass --apply to write");
    return;
  }

  const { data: lessons } = await sb.from("lessons").select("id, title");
  let lessonId = (lessons ?? []).find((l) => l.title === LESSON)?.id;
  if (!lessonId) {
    const { data, error } = await sb
      .from("lessons")
      .insert({ title: LESSON })
      .select("id")
      .single();
    if (error) throw error;
    lessonId = data.id;
    console.log(`\nנוצר שיעור "${LESSON}"`);
  }

  let n = 0;
  for (const r of toAdd) {
    const { data, error } = await sb
      .from("cards")
      .insert({
        translit_nikud: r.translit,
        arabic_script: r.ar,
        hebrew_meaning: r.he,
        notes: r.notes ?? null,
        item_type: "word",
        lesson_id: lessonId,
        chatifai_verified: true,
      })
      .select("id")
      .single();
    if (error) throw error;
    const { error: e2 } = await sb
      .from("card_srs")
      .insert({ card_id: data.id, direction: "he_to_ar" });
    if (e2) throw e2;
    n++;
  }
  console.log(`\n✅ נוספו ${n} כרטיסים ל"${LESSON}", כולם עם card_srs`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
