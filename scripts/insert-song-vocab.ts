// Creates cards from the song vocabulary (note efbd5595).
//
// The three songs are Egyptian and Lebanese, and Ariel's ruling is that they
// stay — but that every divergence is marked. So the Palestinian form, where
// chatifai gave one, goes into `notes` on the card itself rather than sitting in
// a file nobody opens during review. A card that teaches אִלְאַמַר without saying
// it is Cairo's form is the exact failure the ruling exists to prevent.
//
//   npx tsx scripts/insert-song-vocab.ts          # dry run
//   npx tsx scripts/insert-song-vocab.ts --apply
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { normalizeMarks, assertClean } from "./lib/normalize-marks";
import { SONG_VOCAB, HELD_INCONSISTENT } from "./data/song-vocab";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const APPLY = process.argv.includes("--apply");
const LESSON = "אוצר מילים משירים";
const strip = (s: string) =>
  s.normalize("NFC").replace(/[֑-ׇ]/g, "").replace(/[ًٌٍَُِّْٰ]/g, "").replace(/\s+/g, " ").trim();

async function main() {
  const rows = SONG_VOCAB.map((w) => ({ ...w, translit: normalizeMarks(w.translit) }));
  for (const r of rows) assertClean(r.he, r.translit, r.ar);

  const known = new Set<string>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from("cards").select("translit_nikud").range(from, from + 999);
    if (error) throw error;
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

  const flagged = toAdd.filter((r) => r.pal);
  console.log(
    `${rows.length} מילים · ${rows.length - toAdd.length} קיימות · ${toAdd.length} להוספה\n` +
      `מתוכן ${flagged.length} עם צורה פלסטינית שונה שנרשמת על הכרטיס\n`
  );
  for (const r of toAdd) {
    console.log(`  ${r.translit.padEnd(18)} ${r.ar.padEnd(12)} ${r.he}${r.pal ? `   ⚑ ${r.pal}` : ""}`);
  }
  console.log(`\n⏸ מוחזקות בגלל סתירה בפלט של chatifai (${HELD_INCONSISTENT.length}):`);
  for (const h of HELD_INCONSISTENT) console.log(`  - ${h}`);

  if (!APPLY) {
    console.log("\ndry run — הוסף --apply כדי לכתוב");
    return;
  }

  const { data: lessons } = await sb.from("lessons").select("id, title");
  let lessonId = (lessons ?? []).find((l) => l.title === LESSON)?.id;
  if (!lessonId) {
    const { data, error } = await sb.from("lessons").insert({ title: LESSON }).select("id").single();
    if (error) throw error;
    lessonId = data.id;
    console.log(`\nנוצר שיעור "${LESSON}"`);
  }

  for (const r of toAdd) {
    const notes = [
      `מהשיר: ${r.song}`,
      r.pal ? `בפלסטינית: ${r.pal}` : null,
      r.note,
    ]
      .filter(Boolean)
      .join(" · ");

    const { data, error } = await sb
      .from("cards")
      .insert({
        translit_nikud: r.translit,
        arabic_script: r.ar,
        hebrew_meaning: r.he,
        notes,
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
  }
  console.log(`\n✅ נוספו ${toAdd.length} כרטיסים ל"${LESSON}", כולם עם card_srs`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
