// pp. 304–305 (answers to p. 101) into מילים שביקשתי: the 19 sentences and the words
// in them the deck lacked. Ariel asked for them by page (2026-10-30). chatifai was
// down (Railway 404), so chatifai_verified = false until re-checked (open note).
// Sentences are read off the page, so course_verified = true; their Arabic script
// and the words' pointing are mine. מחלה already existed as מַרַד' (مرض): moved, not duplicated.
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { NAMED, SENTENCES, WORDS } from "./data/book-p304-305";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const ASKED = "825ef0fe-f683-48ee-9bb5-3cfaa5913282";
const n = (s: string) => (s ?? "").replace(/[ً-ْـ؟?،,\s–-]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي");
(async () => {
  let all: { arabic_script: string }[] = [];
  for (let f = 0; ; f += 1000) { const { data } = await sb.from("cards").select("arabic_script").range(f, f + 999); all = all.concat(data!); if (data!.length < 1000) break; }
  const have = new Set(all.map((c) => n(c.arabic_script)));
  const rows = [
    ...SENTENCES.map((r) => ({ r, course: true })),
    ...[...NAMED, ...WORDS].filter(([, ar]) => !have.has(n(ar))).map((r) => ({ r, course: false })),
  ];
  const { data, error } = await sb.from("cards").insert(rows.map(({ r: [tr, ar, he, type, notes], course }) => ({
    translit_nikud: tr, arabic_script: ar, hebrew_meaning: he, item_type: type, notes: notes ?? null,
    lesson_id: ASKED, course_verified: course, chatifai_verified: false,
  }))).select("id");
  if (error) throw error;
  const { error: e2 } = await sb.from("card_srs").insert(data!.map((d) => ({ card_id: d.id, direction: "he_to_ar" })));
  if (e2) throw e2;
  const { count } = await sb.from("cards").update({ lesson_id: ASKED }, { count: "exact" }).eq("arabic_script", "مرض");
  await sb.from("notes").insert({ tag: "cards", status: "open", body: "chatifai (כשיחזור — היה Railway 404 ב-2026-10-30): לבדוק עמ' 304–305, 19 משפטים + מילים חדשות (scripts/data/book-p304-305.ts) ומשפט 7 (card-ala-tul.ts). הכתב הערבי של המשפטים שלי — לאמת." });
  console.log("✅", data!.length, "cards (", SENTENCES.length, "sentences ) · moved מחלה:", count);
})();
