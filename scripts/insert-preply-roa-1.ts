// Preply Roa K. lesson 1 (2026-10-31) → its own lesson, newest, so it reaches the
// daily queue first. Words the deck has are skipped (checked by Arabic skeleton);
// درس the verb goes in although درس "lesson" exists. chatifai_verified = false
// (chatifai down since 2026-10-28; lesson material → ask for pointing only).
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { SENTENCES, WORDS } from "./data/preply-roa-1";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const n = (s: string) => (s ?? "").replace(/[ً-ْـ؟?!،,.\s–-]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي");
const KEEP = new Set(["درس"]);
(async () => {
  let all: { arabic_script: string }[] = [];
  for (let f = 0; ; f += 1000) { const { data } = await sb.from("cards").select("arabic_script").range(f, f + 999); all = all.concat(data!); if (data!.length < 1000) break; }
  const have = new Set(all.map((c) => n(c.arabic_script)));
  const words = WORDS.filter(([, ar]) => KEEP.has(ar) || !ar.split(" / ").some((a) => have.has(n(a))));
  const { data: lesson, error: e0 } = await sb.from("lessons").insert({ date: "2026-10-31", title: "Preply Roa K. 1", source: "preply", teacher: "Roa K.", meeting: 1 }).select("id").single();
  if (e0) throw e0;
  const rows = [...SENTENCES, ...words];
  const { data, error } = await sb.from("cards").insert(rows.map(([tr, ar, he, type, notes]) => ({
    translit_nikud: tr, arabic_script: ar, hebrew_meaning: he, item_type: type, notes: notes ?? null,
    lesson_id: lesson.id, course_verified: false, chatifai_verified: false,
  }))).select("id");
  if (error) throw error;
  const { error: e2 } = await sb.from("card_srs").insert(data!.map((d) => ({ card_id: d.id, direction: "he_to_ar" })));
  if (e2) throw e2;
  await sb.from("notes").insert({ tag: "cards", status: "open", body: "chatifai (ניקוד בלבד, חומר משיעור): Preply Roa K. 1 — scripts/data/preply-roa-1.ts" });
  console.log("✅", SENTENCES.length, "sentences +", words.length, "words in", lesson.id);
})();
