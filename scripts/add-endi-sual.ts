// Note f68bbf5a: "להוסיף יש לי שאלה (ענדי סואאל?)".
//
// Ariel gave the phrase; the pointing is not invented for it. Both halves are
// already in the database, pointed and chatifai-verified:
//   עִנְדִי  — in פִי עִנְדִי אִמְתִחַאן בֻּכְּרַא and six other verified cards
//   סֻאַאל   — its own verified card, and הַאדַא (א)לְגַ'וַּאב! כַּמַאן סֻאַאל?
// So this is assembly of two verified forms in a construction the course
// already teaches, not a vocalisation written from general Arabic knowledge.
//
//   npx tsx scripts/add-endi-sual.ts
//   npx tsx scripts/add-endi-sual.ts --apply
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { normalizeMarks, assertClean } from "./lib/normalize-marks";

config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});
const APPLY = process.argv.includes("--apply");

/** The two source cards the pointing is lifted from, so the provenance is
 *  checkable rather than asserted. */
const SOURCES = [
  "11bf27f6-30f4-4e65-a6f1-53c3fef25b63", // פִי עִנְדִי אִמְתִחַאן בֻּכְּרַא.
  "58259fbf-dc9c-49dc-bbcd-65820b503e60", // סֻאַאל
];

const CARD = {
  translit: "עִנְדִי סֻאַאל",
  ar: "عندي سؤال",
  he: "יש לי שאלה",
  note: "מורכב משתי צורות מאומתות שכבר במערכת: עִנְדִי + סֻאַאל",
};

const fold = (s: string) =>
  s.normalize("NFC").replace(/[֑-ׇ]/g, "").replace(/\s+/g, " ").trim();

async function main() {
  const { data: sources, error: se } = await sb
    .from("cards")
    .select("id, translit_nikud, arabic_script, chatifai_verified")
    .in("id", SOURCES);
  if (se) throw se;

  console.log("מקורות הניקוד:");
  for (const s of sources ?? [])
    console.log(`   ${s.chatifai_verified ? "✓" : "✗"} ${s.translit_nikud}  (${s.arabic_script})`);
  if ((sources ?? []).some((s) => !s.chatifai_verified)) {
    console.log("\n⛔ אחד המקורות אינו מאומת chatifai — לא מוסיפים.");
    return;
  }

  const translit = normalizeMarks(CARD.translit);
  assertClean(CARD.he, translit, CARD.ar);

  // Paging: a plain select() stops at 1000 and the duplicate check would lie.
  const known = new Set<string>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from("cards").select("translit_nikud").range(from, from + 999);
    if (error) throw error;
    if (!data?.length) break;
    for (const c of data) known.add(fold(c.translit_nikud ?? ""));
    if (data.length < 1000) break;
  }
  if (known.has(fold(translit))) {
    console.log(`\nכבר קיים: ${translit}`);
    return;
  }

  console.log(`\nלהוספה: ${translit}  ${CARD.ar}  — ${CARD.he}`);
  if (!APPLY) {
    console.log("\ndry run — הוסף --apply כדי לכתוב");
    return;
  }

  const { data: card, error } = await sb
    .from("cards")
    .insert({
      translit_nikud: translit,
      arabic_script: CARD.ar,
      hebrew_meaning: CARD.he,
      notes: CARD.note,
      item_type: "phrase",
      course_verified: true,
      course_note: "אריאל ביקש (פתק f68bbf5a). הניקוד הורכב משתי צורות מאומתות קיימות.",
    })
    .select("id")
    .single();
  if (error) throw error;

  const { error: e2 } = await sb.from("card_srs").insert({ card_id: card.id, direction: "he_to_ar" });
  if (e2) throw e2;
  console.log("\n✅ נוסף עם card_srs");
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
