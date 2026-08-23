// Reconciles the משימות tab with the session of 2026-08-23.
//
// A note is closed only when the thing it asked for is actually done and
// verifiable. Notes that are still blocked stay open and get a comment saying
// what was learned, because a blocked note whose blocker is stale is worse than
// no note — it hides that the situation changed.
//
//   npx tsx scripts/close-notes-2026-08-23.ts
//   npx tsx scripts/close-notes-2026-08-23.ts --apply
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});
const APPLY = process.argv.includes("--apply");

/** Done and checked. */
const CLOSE: { id: string; why: string }[] = [
  { id: "571982cb-83ea-4de8-861c-105389bfbb62", why: "המילים של שריף היו במסד כל הזמן. lyrics_parsed היה [] וזה truthy, אז הדף מיפה רשימה ריקה במקום ליפול חזרה ל-lyrics_raw. תוקן — גם براحة يا شيخة ו-Konna Netlaka הושפעו." },
  { id: "43226423-e6e5-4d98-aee6-0a9bf68f4d2a", why: "'מילת עזר להווה מתמשך' עבר משדה התרגום לשדה note. נבדקו כל 11 השירים — זה היה המקרה היחיד. מילה בלי תרגום כבר לא מוגשת כפריט תרגול." },
  { id: "7a063a00-252c-4521-9684-e454b92c8a6d", why: "הכותרת בהתאמת הטיות אומרת עכשיו מה הפועל אומר, ולשמות הפרדיגמות יש שמות בעברית במקום slug אנגלי. הזמן ירד לכותרת משנה קריאה." },
  { id: "e165eccf-921a-4198-9fd1-ff0910cc0f99", why: "הטאב 'נטיות' הוסר משורת הניווט (הראוט נשאר, שורה אחת להחזרה). בהתאמת הטיות הכותרת אומרת מה הפועל אומר." },
  { id: "17f19ad7-f963-4771-b88d-8fb625abbffe", why: "התרגולים כבר מקובצים לפי נושא/מפגש ורצים אחד אחרי השני, לא פר פועל." },
  { id: "97d76da0-75f6-4aff-b292-77dd30f5a2f3", why: "מתעדכן. הרשימה נבנית מחדש בכל אימון, מדורגת לפי כישלונות אחרונים וסיכון לשכחה ואז נדגמת באקראי משוקלל, ומילה שתורגלה לא חוזרת 12 שעות. ההסבר עכשיו כתוב בדף עצמו." },
  { id: "4fa5f38d-1438-4235-98e9-ac02eaedca62", why: "(1) בוקרו סיומות השייכות: 5 בסיסים, 40 צורות, כל בסיס מופיע בכרטיס בקורס וכל 40 מאומתות chatifai. אין מה לגזום ואין מה להוסיף בלי chatifai. (2) באג ההפקה תוקן — התור נטען מחדש במעבר לשלב 3." },
  { id: "f68bbf5a-40f7-46bf-bc16-954f11e2d5f5", why: "עִנְדִי סֻאַאל / عندي سؤال נוסף. הניקוד הורכב משתי צורות מאומתות chatifai שכבר היו במערכת." },
  { id: "28e16a9b-4227-4b39-8590-1984bd3426b3", why: "כפתור רמקול נוסף לתרגול האותיות — 28 מתוך 30 אותיות, חתוכות משתי ההקלטות של מפגש 1 לפי חותמות הזמן. כל טווח נושא את מה שהמורה אומר שם, כדי שטווח שגוי ייראה בנתונים ולא רק יישמע." },
  { id: "b4fe5996-ca00-4f8d-a0e8-4fb78925434d", why: "מחלץ המילים מהביטויים חודד — שמות פרטיים ותחיליות פועל (ב/בת/י/נ + מא…ש) כבר לא נספרים. 174 ← 135, עם הניקוד מהקורס ומשפטי המקור, ב-scripts/data/vocab-from-phrases-worklist.json. הוספה עצמה דורשת פירושים ממך." },
];

/** Still open — the note stays, the comment records what changed. */
const COMMENT: { id: string; note: string }[] = [
  { id: "97311b79-2d35-4c74-ad18-2dd9d951c5a9", note: "עודכן 23.8: שתי פסקאות ההכוונה נוספו לסיטואציה 'הכוונה בדרך' כטקסט מהשיעור, מילה במילה, בלי תור מומצא ובלי תרגום מומצא. שני הכרטיסים לא נמחקו — יש עליהם 4 חזרות, ולהוציא אותם מהתור פירושו לגעת בחזרה היומית. תגיד אם למחוק." },
  { id: "efbd5595-1097-49bc-a362-3f597676a151", note: "עודכן 23.8: המצב גרוע יותר ממה שחשבת — לא רק Immer. כל 11 השירים שומרים תעתיק לטיני, כי הפרומפט של האוסף ביקש מ-Gemini 'Latin-alphabet transliteration' והבדיקה בדקה את שדה line ולא את התעתיק ברמת המילה. שניהם תוקנו, אז זה לא יקרה שוב. התעתיק הלטיני הקיים לא הומר — המרה שלו לעברית פירושה להמציא ניקוד. הדף כבר לא מציג לטינית כתעתיק." },
  { id: "3c62169c-35e1-4c1a-bd9f-29d6befac0ed", note: "עודכן 23.8: התוסף עדיין לא מחובר (list_connected_browsers מחזיר רשימה ריקה). נוסף לחסימה: ניקוד ל-73 מילים ממפגש בעל פה 5, המילה ע׳דא (צהריים), ותיקון הניקוד של צַ'דַא (חלודה)." },
  { id: "5e76460f-bcd6-4228-86f3-e29846b9de7a", note: "עודכן 23.8: נבדק — אין YOUTUBE_API_KEY ב-.env.local. חסום עד שתייצר מפתח ב-Google Cloud Console." },
  { id: "6f0291ca-4b1c-4dfa-88cf-d62924846410", note: "עודכן 23.8: הכרטיס הוא צַ'דַא / صدأ. לא כתוב מה שגוי בניקוד, ואני לא מתקן ניקוד מידע כללי — זה נכנס לפאס chatifai הבא. אם אתה יודע מה הצורה הנכונה, תכתוב אותה." },
  { id: "b9a792c9-cab0-4216-9cb0-47ad9996d500", note: "עודכן 23.8: אין כרטיס ל-ע׳דא. ממתין לניקוד מ-chatifai." },
];

async function main() {
  const ids = [...CLOSE.map((c) => c.id), ...COMMENT.map((c) => c.id)];
  const { data: rows, error } = await sb.from("notes").select("id, body, status").in("id", ids);
  if (error) throw error;
  const byId = new Map((rows ?? []).map((r) => [r.id, r]));

  const missing = ids.filter((id) => !byId.has(id));
  if (missing.length) throw new Error(`פתקים לא נמצאו: ${missing.join(", ")}`);

  console.log(`=== לסגירה (${CLOSE.length}) ===`);
  for (const c of CLOSE) console.log(`• ${byId.get(c.id)!.body.slice(0, 60)}\n    → ${c.why.slice(0, 100)}`);
  console.log(`\n=== נשארים פתוחים עם עדכון (${COMMENT.length}) ===`);
  for (const c of COMMENT) console.log(`• ${byId.get(c.id)!.body.slice(0, 60)}`);

  if (!APPLY) {
    console.log("\ndry run — הוסף --apply כדי לכתוב");
    return;
  }

  for (const c of CLOSE) {
    const { error: e } = await sb
      .from("notes")
      .update({ status: "done", body: `${byId.get(c.id)!.body}\n\n✅ 23.8.26: ${c.why}` })
      .eq("id", c.id);
    if (e) throw e;
  }
  for (const c of COMMENT) {
    const { error: e } = await sb
      .from("notes")
      .update({ body: `${byId.get(c.id)!.body}\n\n${c.note}` })
      .eq("id", c.id);
    if (e) throw e;
  }
  console.log(`\n✅ ${CLOSE.length} נסגרו · ${COMMENT.length} עודכנו`);
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
