// Closes the items that chatifai could not settle on the first pass.
//
// Ariel, 24.8.26: "תיישב את הדברים הלא פתורים עם chatifai, פשוט תנווט את זה
// למשמעות שהתחלנו ממנה."
//
// That is a deliberate, authorized variation: normally chatifai is anchored on
// Ariel's exact spelling and is never asked what a word means. Here the anchor
// moved to the MEANING — which is what Dror verified — precisely because the
// unreliable part is Ariel's spelling by ear. Three of the four held items
// resolved that way, and one correction fell out of it.
//
//   npx tsx scripts/resolve-meeting-8-held.ts
//   npx tsx scripts/resolve-meeting-8-held.ts --apply
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { normalizeMarks, assertClean } from "./lib/normalize-marks";

config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});
const APPLY = process.argv.includes("--apply");
const LESSON = "מפגש 8";

/** Resolved by anchoring on the meaning. `heard` records what Ariel wrote. */
const RESOLVED: { heard: string; translit: string; ar: string; he: string; note: string }[] = [
  {
    heard: "משדף אלאיחסאב",
    translit: "מַא דַפַעֵש אִלְחִסַאבּ",
    ar: "ما دفعش الحساب",
    he: "לא שילם את החשבון",
    note:
      "אריאל שמע 'משדף אלאיחסאב' — מסגרת השלילה מַא + פועל + ש נשמעת כמו 'מש דפע'. " +
      "גוף שני: מַא דַפַעְתֵש (אתה), מַא דַפַעְתִיש (את)",
  },
  {
    heard: "קדיש טוע'לכ",
    translit: "קַדֵّיש טוּלַכּ?",
    ar: "قديش طولك؟",
    he: "כמה הגובה שלך?",
    note: "אריאל שמע 'טוע'לכ' — ה-ע' היא ל'. לנקבה: קַדֵّיש טוּלֵכּ?",
  },
  {
    heard: "טול",
    translit: "טוּל",
    ar: "طول",
    he: "גובה, אורך",
    note: "אותה מילה לגובה של אדם ולאורך של חפץ",
  },
  {
    heard: "שכלכ ג'והאן",
    translit: "שִכְלַכּ ג'וּעַאן",
    ar: "شكلك جوعان",
    he: "נראה שאתה רעב",
    note: "אריאל שמע 'ג'והאן' — ה-ה' היא ע'. נקבה: שִכְלֵכּ ג'וּעַאנֵה · רבים: שִכְלְכֹּם ג'וּעַאנִין",
  },
];

/**
 * A correction to something already written. chatifai gave المظبوط (ظ) for
 * אִלְמַטְ'בּוּט and مضبوط (ض) for מַטְ'בּוּט — the same word with two different
 * letters. Asked to pick one, it retracts the ظ: the root is ض, and the ظ
 * spelling is a common misrendering driven by how it is pronounced.
 *
 * This is a script-only fix. The word and its meaning came from the lesson and
 * are untouched; the Arabic spelling has no lesson provenance at all — the book
 * gives no Arabic — so chatifai is the authority on it.
 */
const FIX_ARABIC: { translit: string; from: string; to: string; why: string }[] = [
  {
    translit: "אִלְמַטְ'בּוּט",
    from: "المظبوط",
    to: "المضبوط",
    why: "chatifai חזר בו מ-ظ: השורש הוא ض, וה-ظ הוא כתיב שגוי נפוץ שנגרר מההגייה",
  },
];

const fold = (s: string) =>
  s.normalize("NFC").replace(/[֑-ׇ]/g, "").replace(/[ًٌٍَُِّْٰ]/g, "")
   .replace(/ך/g, "כ").replace(/ם/g, "מ").replace(/ן/g, "נ").replace(/ף/g, "פ").replace(/ץ/g, "צ")
   .replace(/[()'"׳״؟?!.,\/]/g, "").replace(/\s+/g, " ").trim();

async function main() {
  const rows = RESOLVED.map((r) => {
    const translit = normalizeMarks(r.translit);
    assertClean(r.he, translit, r.ar);
    return { ...r, translit, note: normalizeMarks(r.note) };
  });

  const known = new Map<string, string>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from("cards").select("id, translit_nikud").range(from, from + 999);
    if (error) throw error;
    if (!data?.length) break;
    for (const c of data) known.set(fold(c.translit_nikud ?? ""), c.id);
    if (data.length < 1000) break;
  }

  const toAdd = rows.filter((r) => !known.has(fold(r.translit)));

  console.log(`נפתרו ${rows.length} · ${rows.length - toAdd.length} כבר קיימים · ${toAdd.length} להוספה\n`);
  for (const r of toAdd) console.log(`  ${r.translit.padEnd(26)} ${r.ar.padEnd(22)} ${r.he}`);

  console.log("\nתיקוני כתיב ערבי:");
  const fixes: { id: string; to: string; why: string; translit: string }[] = [];
  for (const f of FIX_ARABIC) {
    const id = known.get(fold(f.translit));
    if (!id) { console.log(`  ⚠ לא נמצא כרטיס ל-${f.translit}`); continue; }
    const { data } = await sb.from("cards").select("arabic_script").eq("id", id).single();
    if (data?.arabic_script !== f.from) {
      console.log(`  ⏭ ${f.translit}: הערבית כבר "${data?.arabic_script}", לא "${f.from}" — מדלגים`);
      continue;
    }
    console.log(`  ${f.translit}: ${f.from} → ${f.to}`);
    fixes.push({ id, to: f.to, why: f.why, translit: f.translit });
  }

  console.log("\n⛔ עדיין לא נפתר:");
  console.log("   מועטה (קליל?) — chatifai הציע שְוַיّ / נֻתְפֵה / קַלִיל, אף אחת לא קרובה פונטית. צריך את דרור.");
  console.log("   ג'ואן — אריאל השאיר בלי פירוש בכלל. צריך אותו.");

  if (!APPLY) {
    console.log("\ndry run — הוסף --apply כדי לכתוב");
    return;
  }

  const { data: lessons } = await sb.from("lessons").select("id, title");
  const lessonId = (lessons ?? []).find((l) => l.title === LESSON)?.id;
  if (!lessonId) throw new Error(`לא נמצא שיעור "${LESSON}"`);

  for (const r of toAdd) {
    const { data, error } = await sb
      .from("cards")
      .insert({
        translit_nikud: r.translit,
        arabic_script: r.ar,
        hebrew_meaning: r.he,
        notes: r.note,
        item_type: r.translit.trim().includes(" ") ? "phrase" : "word",
        lesson_id: lessonId,
        course_verified: true,
        chatifai_verified: true,
        course_note: `מפגש 7–8 בעל פה · נפתר מול chatifai לפי המשמעות (אריאל שמע: ${r.heard})`,
      })
      .select("id")
      .single();
    if (error) throw error;
    const { error: e2 } = await sb.from("card_srs").insert({ card_id: data.id, direction: "he_to_ar" });
    if (e2) throw e2;
  }

  for (const f of fixes) {
    const { data: card } = await sb.from("cards").select("course_note").eq("id", f.id).single();
    const { error } = await sb
      .from("cards")
      .update({
        arabic_script: f.to,
        course_note: [card?.course_note, `תוקן ${f.why}`].filter(Boolean).join(" · "),
      })
      .eq("id", f.id);
    if (error) throw error;
  }

  console.log(`\n✅ נוספו ${toAdd.length} כרטיסים · תוקנו ${fixes.length} כתיבים ערביים`);
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
