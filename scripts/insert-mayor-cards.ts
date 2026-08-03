// Closes note f1ed64e1 — רַאִיס (א)לְבַּלַדִיֵּה, which Ariel wrote down with no
// lesson to file it under.
//
// chatifai confirmed his transliteration and corrected two things: the ראִ takes
// the (א)ל prefix the rest of the cards use, and the dagesh he wrote was the
// Arabic shadda U+0651 rather than the Hebrew U+05BC — the same codepoint slip
// that has bitten this project repeatedly, so this goes through normalizeMarks
// like every other insert.
//
// It also volunteered the two terms a learner would confuse this with, so they
// go in together: a card that teaches "mayor" without רַאִיס (א)לְמַגְ'לֵס beside
// it teaches a word that cannot be used correctly.
//
//   npx tsx scripts/insert-mayor-cards.ts          # dry run
//   npx tsx scripts/insert-mayor-cards.ts --apply
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { normalizeMarks, assertClean } from "./lib/normalize-marks";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const APPLY = process.argv.includes("--apply");
const NOTE_ID = "f1ed64e1";
const strip = (s: string) => s.normalize("NFC").replace(/[֑-ׇ]/g, "").replace(/\s+/g, " ").trim();

const CARDS = [
  {
    translit: "רַאִיס (א)לְבַּלַדִיֵّה",
    ar: "رئيس البلدية",
    he: "ראש עירייה",
    notes:
      "chatifai: הביטוי הרווח לראש עיר. נהגה Ra-is il-baladiyye — " +
      "ה-א' של רַאִיס נבלעת והמילה מסתיימת בתנועה. " +
      "אין כאן ق אלא د, ולכן שום המרה ל-א' אינה חלה",
  },
  {
    translit: "רַאִיס (א)לְמַגְ'לֵס",
    ar: "رئيس المجلس",
    he: "ראש מועצה",
    notes: "chatifai: נפוץ בכפרים ובמועצות מקומיות, בניגוד לראש עירייה",
  },
  {
    translit: "מֻחְ'תַאר",
    ar: "مختار",
    he: "מוכתאר (ראש חמולה/כפר)",
    notes:
      "chatifai: לא תפקיד רשמי אלא נכבד המייצג כפר או משפחה. " +
      "עדיין תואר בעל משקל חברתי",
  },
];

async function main() {
  const rows = CARDS.map((c) => ({ ...c, translit: normalizeMarks(c.translit) }));
  for (const r of rows) assertClean(r.he, r.translit, r.ar);

  const known = new Set<string>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from("cards").select("translit_nikud").range(from, from + 999);
    if (error) throw error;
    if (!data?.length) break;
    for (const c of data) known.add(strip(c.translit_nikud ?? ""));
    if (data.length < 1000) break;
  }

  const toAdd = rows.filter((r) => !known.has(strip(r.translit)));
  console.log(`${rows.length} כרטיסים · ${rows.length - toAdd.length} קיימים · ${toAdd.length} להוספה\n`);
  for (const r of toAdd) console.log(`  ${r.translit.padEnd(26)} ${r.ar.padEnd(16)} ${r.he}`);

  if (!APPLY) {
    console.log("\ndry run — הוסף --apply כדי לכתוב");
    return;
  }

  for (const r of toAdd) {
    const { data, error } = await sb
      .from("cards")
      .insert({
        translit_nikud: r.translit,
        arabic_script: r.ar,
        hebrew_meaning: r.he,
        notes: r.notes,
        item_type: "word",
        lesson_id: null,
        chatifai_verified: true,
      })
      .select("id")
      .single();
    if (error) throw error;
    const { error: e2 } = await sb
      .from("card_srs")
      .insert({ card_id: data.id, direction: "he_to_ar" });
    if (e2) throw e2;
  }
  console.log(`\n✅ נוספו ${toAdd.length} כרטיסים, כולם עם card_srs`);

  // `.like()` against a uuid column errors in PostgREST, so match the prefix in
  // memory rather than in the query.
  const { data: open } = await sb.from("notes").select("id").eq("status", "open");
  const note = (open ?? []).find((n) => n.id.startsWith(NOTE_ID));
  if (note) {
    const { error } = await sb.from("notes").update({ status: "done" }).eq("id", note.id);
    if (error) throw error;
    console.log(`✅ נסגרה הערה ${NOTE_ID}`);
  }
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
