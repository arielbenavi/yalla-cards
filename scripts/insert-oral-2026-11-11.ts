// Creates the lesson of the oral meeting of 2026-11-11 and inserts its cards (his notes, the
// situation with נעמה, and words found in the recording). Words the deck has (by Arabic skeleton,
// any "/" form) are skipped. New cards: chatifai_verified=false. Existing FSRS is never touched.
//   npx tsx scripts/insert-oral-2026-11-11.ts          # dry run
//   npx tsx scripts/insert-oral-2026-11-11.ts --apply
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { NAAMA, SENTENCES, WORDS, type Row } from "./data/oral-2026-11-11";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const APPLY = process.argv.includes("--apply");
const TITLE = "מפגש בעל פה 11.11.26";
const n = (s: string) => (s ?? "").replace(/[ً-ْـ؟?!،,.\s–-]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي");

(async () => {
  const all: { arabic_script: string | null; translit_nikud: string; hebrew_meaning: string }[] = [];
  for (let f = 0; ; f += 1000) {
    const { data, error } = await sb.from("cards").select("arabic_script,translit_nikud,hebrew_meaning").range(f, f + 999);
    if (error) throw error;
    all.push(...data!);
    if (data!.length < 1000) break;
  }
  const rows: Row[] = [...WORDS, ...SENTENCES, ...NAAMA];
  for (const [tr, ar] of rows) {
    if (/[א-ת]/.test(ar)) throw new Error(`Hebrew in Arabic: ${ar}`);
    if (/[ء-ي]/.test(tr)) throw new Error(`Arabic in translit: ${tr}`);
  }
  const have = new Map<string, string>();
  for (const c of all) for (const p of [c.arabic_script ?? "", ...(c.arabic_script ?? "").split("/")]) if (n(p)) have.set(n(p), `${c.translit_nikud} = ${c.hebrew_meaning}`);
  const dup = (ar: string) => [ar, ...ar.split("/")].map(n).find((k) => k && have.has(k));
  const fresh = rows.filter((r) => { const d = dup(r[1]); if (d) console.log(`skip ${r[0]}  ← ${have.get(d)}`); return !d; });
  console.log(`new ${fresh.length} of ${rows.length}`);
  if (!APPLY) return console.log("dry run: pass --apply");

  let { data: lesson } = await sb.from("lessons").select("id").eq("title", TITLE).maybeSingle();
  if (!lesson) {
    const r = await sb.from("lessons").insert({ date: "2026-11-11", title: TITLE, source: "oral", notes: "הערות של אריאל, סיטואציה עם נעמה, והקלטת המפגש (61 דק')." }).select("id").single();
    if (r.error) throw r.error;
    lesson = r.data;
  }
  const { data, error } = await sb.from("cards").insert(fresh.map(([tr, ar, he, type, notes]) => ({
    translit_nikud: tr, arabic_script: ar, hebrew_meaning: he, item_type: type, notes: notes ?? null,
    lesson_id: lesson!.id, course_verified: false, chatifai_verified: false,
  }))).select("id");
  if (error) throw error;
  const { error: e2 } = await sb.from("card_srs").insert(data!.map((d) => ({ card_id: d.id, direction: "he_to_ar" })));
  if (e2) throw e2;
  console.log("✅ lesson", lesson!.id, "·", data!.length, "cards");
})();
