// Creates the lesson of the oral meeting of 2026-11-04 and inserts its cards.
// Words the deck has (by Arabic skeleton) are skipped. Never touches card_srs of existing cards.
//   npx tsx scripts/insert-oral-2026-11-04.ts          # dry run
//   npx tsx scripts/insert-oral-2026-11-04.ts --apply
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { CARDS, FANNAN_NOTE } from "./data/oral-2026-11-04";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const APPLY = process.argv.includes("--apply");
const n = (s: string) => (s ?? "").replace(/[ً-ْـ؟?!،,.\s–-]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي");

(async () => {
  const all: { id: string; arabic_script: string | null; translit_nikud: string; notes: string | null }[] = [];
  for (let f = 0; ; f += 1000) {
    const { data, error } = await sb.from("cards").select("id,arabic_script,translit_nikud,notes").range(f, f + 999);
    if (error) throw error;
    all.push(...data!);
    if (data!.length < 1000) break;
  }
  for (const [tr, ar] of CARDS) {
    if (/[א-ת]/.test(ar)) throw new Error(`Hebrew in Arabic: ${ar}`);
    if (/[ء-ي]/.test(tr)) throw new Error(`Arabic in translit: ${tr}`);
  }
  const have = new Map(all.map((c) => [n(c.arabic_script ?? ""), c]));
  const fresh = CARDS.filter((r) => !have.has(n(r[1])));
  const skipped = CARDS.filter((r) => have.has(n(r[1])));
  const fannan = all.filter((c) => n(c.arabic_script ?? "") === n("فنان"));
  console.log(`new ${fresh.length}, skipped ${skipped.length}, فنان cards ${fannan.length}`);
  skipped.forEach((r) => console.log("  skip", r[0], "← יש:", have.get(n(r[1]))!.translit_nikud));
  if (!APPLY) return console.log("dry run: pass --apply");

  const { data: lesson, error: e0 } = await sb.from("lessons").insert({
    date: "2026-11-04", title: "מפגש בעל פה 4.11.26", source: "oral",
    notes: "מספר המפגש לא ידוע, לכן לפי התאריך. הערות ושני צילומי כתב יד.",
  }).select("id").single();
  if (e0) throw e0;
  const { data, error } = await sb.from("cards").insert(fresh.map(([tr, ar, he, type, notes, plural]) => ({
    translit_nikud: tr, arabic_script: ar, hebrew_meaning: he, item_type: type, notes: notes ?? null, plural_form: plural ?? null,
    lesson_id: lesson.id, course_verified: true, chatifai_verified: false,
  }))).select("id");
  if (error) throw error;
  const { error: e2 } = await sb.from("card_srs").insert(data!.map((d) => ({ card_id: d.id, direction: "he_to_ar" })));
  if (e2) throw e2;
  for (const c of fannan) {
    if (c.notes?.includes(FANNAN_NOTE)) continue;
    const { error: e3 } = await sb.from("cards").update({ notes: c.notes ? `${c.notes} · ${FANNAN_NOTE}` : FANNAN_NOTE }).eq("id", c.id);
    if (e3) throw e3;
  }
  const { error: e4 } = await sb.from("notes").insert([
    { tag: "cards", body: `chatifai: לבדוק ניקוד וערבית של ${data!.length} הכרטיסים של מפגש בעל פה 4.11.26 (chatifai_verified=false, נתונים ב-scripts/data/oral-2026-11-04.ts). לבקש רק ניקוד וכתיב, לא אישור לתוכן.` },
    { tag: "מפגש 4.11", body: "לברר מהמפגש: (1) ביזבט ושתייה נשארו בלי פירוש ומחל פי קטוע. (2) הוא אהב (עבר): נרשם רק חַבֵּית, בלי הצורה שלו. (3) אבא שלי רוצה שתבואו למסעדה שלו: ההמשך בערבית לא נרשם. (4) (זבן) ליד מוכר: מה הקשר? (5) תנקיד: אולי تنقيط? (6) רק אלאן: מה נאמר עליה?" },
  ]);
  if (e4) throw e4;
  console.log("✅ lesson", lesson.id, "·", data!.length, "cards");
})();
