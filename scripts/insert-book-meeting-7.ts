// מפגש 7 → a new book lesson (dated today so it reaches the daily queue first):
// the comparative table (one card per pair), the asked-for sentences from pp. 104,
// 105 and 108, the participles, and the class words. Skips what the deck has by
// Arabic skeleton, except words that share a spelling but are different words.
// Existing participle cards only get the present/past note. chatifai is down →
// chatifai_verified = false (open note).
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { COMPARATIVES, PARTICIPLES, SENTENCES, WORDS } from "./data/book-meeting-7";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const n = (s: string) => (s ?? "").replace(/[ً-ْـ؟?!،,.\s–-]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي");
const SAME_SPELLING_OTHER_WORD = new Set(["مهمة", "فاتح", "طب", "جمع"]);
const PART_NOTE = "בינוני — בהווה או בעבר לפי ההקשר";
(async () => {
  let all: { id: string; arabic_script: string; notes: string | null }[] = [];
  for (let f = 0; ; f += 1000) { const { data } = await sb.from("cards").select("id,arabic_script,notes").range(f, f + 999); all = all.concat(data!); if (data!.length < 1000) break; }
  const have = new Map<string, typeof all>(); for (const c of all) { const k = n(c.arabic_script); have.set(k, [...(have.get(k) ?? []), c]); }
  const fresh = (rows: typeof WORDS) => rows.filter(([, ar]) => SAME_SPELLING_OTHER_WORD.has(ar) || !have.has(n(ar)));

  const { data: lesson, error: e0 } = await sb.from("lessons").insert({
    date: "2026-11-01", title: "מפגש 7", source: "book", meeting: 7,
    notes: "ערך היתרון וההפלגה, גזרת הכפולים, שלילת עבר, בינוני. הקלטת השיעור נשמעה במלואה (אריאל, 2026-11-01).",
  }).select("id").single();
  if (e0) throw e0;

  const rows = [
    ...COMPARATIVES.map((r) => ({ r, course: true })),
    ...SENTENCES.map((r) => ({ r, course: true })),
    ...fresh(PARTICIPLES).map((r) => ({ r, course: false })),
    ...fresh(WORDS).map((r) => ({ r, course: false })),
  ];
  const { data, error } = await sb.from("cards").insert(rows.map(({ r: [tr, ar, he, type, notes], course }) => ({
    translit_nikud: tr, arabic_script: ar, hebrew_meaning: he, item_type: type, notes: notes ?? null,
    lesson_id: lesson.id, course_verified: course, chatifai_verified: false,
  }))).select("id");
  if (error) throw error;
  const { error: e2 } = await sb.from("card_srs").insert(data!.map((d) => ({ card_id: d.id, direction: "he_to_ar" })));
  if (e2) throw e2;

  let noted = 0;
  for (const [, ar] of PARTICIPLES) for (const c of have.get(n(ar)) ?? []) {
    if ((c.notes ?? "").includes("בינוני")) continue;
    await sb.from("cards").update({ notes: c.notes ? `${c.notes} · ${PART_NOTE}` : PART_NOTE }).eq("id", c.id);
    noted++;
  }
  await sb.from("notes").insert([
    { tag: "cards", status: "open", body: "chatifai (כשיחזור): מפגש 7 — scripts/data/book-meeting-7.ts. הטבלה והמשפטים מהספר; מילים מהשיעור — לבקש ניקוד בלבד." },
    { tag: "songs", status: "open", body: "שירים חדשים בפלייליסט שעוד לא באפליקציה — להדביק את המילים בעמוד השירים: La La (Inez, Tawsen) · Ana Lik YEMI Remix (YEMI, Inez) · GEL GEL GEL (Lvbel C5, DYSTINCT) · Heseeny (TUL8TE) · Ghir Sir (Inez) · WALLAH (DJ HABIBEATS, ONUY) · أنا ابن القدس (فرقة الاعتصام) · غلبان (Assala) · Ya Tabtab Wa Dallaa (Nancy Ajram)" },
    { tag: "idea", status: "open", body: "שדות סמנטיים מהיומיום (אריאל, 2026-11-01): סקיל שמתחבר לאימייל / אמזון ושולף את מה שקונים ביומיום, ויוצר קבוצות מילים לפי מקום (מטבח: קומקום, מיקרוגל, מקרר…), באימות chatifai. מיינדסט: לקרוא בשם לכל מה שרואים." },
  ]);
  console.log("✅ lesson", lesson.id, "·", data!.length, "cards ·", noted, "participle notes");
})();
