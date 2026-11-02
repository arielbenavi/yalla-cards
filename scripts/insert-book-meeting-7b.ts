// מפגש 7, second pass: the remaining sentences of pp. 105 and 108 and their words,
// into the existing מפגש 7 lesson. Words the deck has (by Arabic skeleton) are
// skipped. chatifai is down → chatifai_verified = false; the open re-check note
// gets this file appended.
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { SENTENCES, WORDS } from "./data/book-meeting-7b";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const n = (s: string) => (s ?? "").replace(/[ً-ْـ؟?!،,.\s–-]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/^ال/, "");
const LESSON = "0f08865f-9f86-489f-b713-b67d30d0d633";
(async () => {
  let all: { arabic_script: string }[] = [];
  for (let f = 0; ; f += 1000) { const { data } = await sb.from("cards").select("arabic_script").range(f, f + 999); all = all.concat(data!); if (data!.length < 1000) break; }
  const have = new Set(all.map((c) => n(c.arabic_script)));
  const words = WORDS.filter(([, ar]) => !have.has(n(ar)));
  const skipped = WORDS.filter(([, ar]) => have.has(n(ar))).map(([tr]) => tr);
  const sentences = SENTENCES.filter(([, ar]) => !have.has(n(ar)));
  const rows = [...sentences.map((r) => ({ r, course: true })), ...words.map((r) => ({ r, course: false }))];
  const { data, error } = await sb.from("cards").insert(rows.map(({ r: [tr, ar, he, type, notes], course }) => ({
    translit_nikud: tr, arabic_script: ar, hebrew_meaning: he, item_type: type, notes: notes ?? null,
    lesson_id: LESSON, course_verified: course, chatifai_verified: false,
  }))).select("id");
  if (error) throw error;
  const { error: e2 } = await sb.from("card_srs").insert(data!.map((d) => ({ card_id: d.id, direction: "he_to_ar" })));
  if (e2) throw e2;
  const { data: note } = await sb.from("notes").select("id,body").eq("status", "open").like("body", "chatifai (כשיחזור): מפגש 7%").single();
  if (note) await sb.from("notes").update({ body: `${note.body} + scripts/data/book-meeting-7b.ts (עמ' 105, 107, 108).` }).eq("id", note.id);
  console.log("✅", sentences.length, "sentences,", words.length, "words · skipped (in deck):", skipped.join(", ") || "none", "· note", note ? "updated" : "NOT FOUND");
})();
