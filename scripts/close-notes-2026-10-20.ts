// Reconciles the משימות tab with the session of 2026-10-20 (songs, בעפ 4–5,
// מפגש 6). Same rule as close-notes-2026-08-23.ts: close only what is done and
// checked; a note that is still partly blocked stays open with a comment.
//
//   npx tsx scripts/close-notes-2026-10-20.ts
//   npx tsx scripts/close-notes-2026-10-20.ts --apply
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});
const APPLY = process.argv.includes("--apply");

/** Keyed by id prefix — resolved to one open note each, or the script stops. */
const CLOSE: { id: string; why: string }[] = [
  { id: "22c63aad", why: "חמשת השירים מלאים בפורמט של YAMA: כל שורה עם תעתיק עברי מנוקד, כל מילה עם ערבית, פירוש ותעתיק עברי. براحة يا شيخة 13 שורות, Konna Netlaka 18, ولا مرة 26, Immer — 19 השורות בערבית, ול-سوولنا كاسة شاي נוספה הערבית לכל 35 השורות ו-118 המילים. הכל מ-chatifai, שורה שורה, נבדק שאף שורה ואף מילה לא חסרה." },
  { id: "efbd5595", why: "ראה למעלה — Immer ועוד ארבעה שירים בפורמט של YAMA, עם תעתיק עברי (לא לטיני) ברמת המילה." },
  { id: "482f4118", why: "לבקשתך נשאל chatifai: צחית = צִחִית / صحيت = התעוררתי; אווצל / אג'י = אַוְצַל / אַאגִ'י / أوصل / آجي = אגיע / אבוא. נכנסו כרטיסים עם הערה שהפירוש מ-chatifai ולא מהשיעור. כל מפגש בעפ 4 נכנס — 33 כרטיסים." },
];

/** Still open — the note stays, the comment records what changed. */
const COMMENT: { id: string; note: string }[] = [
  { id: "3c62169c", note: "עודכן 20.10: התוסף מחובר. בוצעו: ניקוד מפגש 6 (32 כרטיסים חדשים), מפגש בעפ 4 (33), מפגש בעפ 5 (63), ונטייה מלאה ל-8 פעלים (6 מהטבלה + צ'רב, שרח). נשארו: ע׳דא (צהריים) ותיקון הניקוד של צַ'דַא." },
  { id: "0500233c", note: "עודכן 20.10: (2) 'שאבן עילו ליחייה' — chatifai: שַאבּ וּעֵילוֹ לִחְיֵה / شاب وإله لحية = בחור ויש לו זקן. נכנס עם הערה. (3) נכנס לפי הסרטון: וַפִי בִּוֻוזְ'הִי שַוַארֵבּ. 'למא תטלע מן ביתי' נכנס לפי הפסקה המנוקדת — מִנְ בֵּיתַכּ. נשארו בשבילך 6, ב-HELD בקובץ scripts/data/meeting-oral-5-pointed.ts: ביג'נם (chatifai אמר بيجنن = מטריף, לא מתאים להקשר), בדי יאתי, מומרת, מח'יים אלעג'ין, ע'ריר, ע'רירו — בכולן chatifai ניקד מילה אחרת, וכשהתעקשתי על מה ששמעת הוא המציא (למשל مخيم العجين = 'מחנה הבצק')." },
  { id: "1b067427", note: "עודכן 20.10: חמשת השירים שהיו חסרים מלאים עכשיו עם תעתיק עברי. שישה (YAMA, ZIDI, דבקה, Tisma'ani, Allah Aleik, Tamally Maak) שלמים בשורות — תעתיק עברי מנוקד לכל שורה — אבל התעתיק ברמת המילה שלהם עדיין לטיני." },
];

async function main() {
  const { data: open, error } = await sb.from("notes").select("id, body").eq("status", "open");
  if (error) throw error;
  const resolve = (prefix: string) => {
    const hits = open!.filter((n) => n.id.startsWith(prefix));
    if (hits.length !== 1) throw new Error(`${prefix}: ${hits.length} פתקים פתוחים תואמים`);
    return hits[0];
  };
  const close = CLOSE.map((c) => ({ ...c, row: resolve(c.id) }));
  const comment = COMMENT.map((c) => ({ ...c, row: resolve(c.id) }));

  console.log(`=== לסגירה (${close.length}) ===`);
  for (const c of close) console.log(`• ${c.row.body.slice(0, 60)}`);
  console.log(`\n=== נשארים פתוחים עם עדכון (${comment.length}) ===`);
  for (const c of comment) console.log(`• ${c.row.body.slice(0, 60)}`);
  if (!APPLY) {
    console.log("\ndry run — הוסף --apply כדי לכתוב");
    return;
  }
  for (const c of close) {
    const { error: e } = await sb.from("notes").update({ status: "done", body: `${c.row.body}\n\n✅ 20.10.26: ${c.why}` }).eq("id", c.row.id);
    if (e) throw e;
  }
  for (const c of comment) {
    const { error: e } = await sb.from("notes").update({ body: `${c.row.body}\n\n${c.note}` }).eq("id", c.row.id);
    if (e) throw e;
  }
  console.log(`\n✅ ${close.length} נסגרו · ${comment.length} עודכנו`);
}
main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
