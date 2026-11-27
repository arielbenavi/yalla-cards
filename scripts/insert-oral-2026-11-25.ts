// Oral meeting 25.11.26 → new lesson "מפגש בעל פה 25.11.26". Skips words the deck already has (by Arabic).
// FSRS untouched apart from each new card's own card_srs row.
//   npx tsx scripts/insert-oral-2026-11-25.ts [--apply]
import { config } from "dotenv"; import { createClient } from "@supabase/supabase-js";
import { ROWS } from "./data/oral-2026-11-25";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const APPLY = process.argv.includes("--apply");
const na = (s: string) => (s ?? "").replace(/[ً-ْـ؟?!،,.\s–()-]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي");
(async () => {
  const all: { id: string; arabic_script: string | null; translit_nikud: string; hebrew_meaning: string; notes: string | null }[] = [];
  for (let f = 0; ; f += 1000) { const { data, error } = await sb.from("cards").select("id,arabic_script,translit_nikud,hebrew_meaning,notes").range(f, f + 999); if (error) throw error; all.push(...data!); if (data!.length < 1000) break; }
  const have = new Map<string, string>();
  for (const c of all) for (const p of [c.arabic_script ?? "", ...(c.arabic_script ?? "").split("/")]) if (na(p)) have.set(na(p), `${c.translit_nikud} = ${c.hebrew_meaning}`);
  const fresh = ROWS.filter(([tr, ar]) => { const k = [ar, ...ar.split("/")].map(na).find((x) => x && have.has(x)); if (k) console.log("skip", tr, "←", have.get(k)); return !k; });
  console.log(`new ${fresh.length} of ${ROWS.length}`);
  if (!APPLY) return;
  const T = "מפגש בעל פה 25.11.26";
  let { data: l } = await sb.from("lessons").select("id").eq("title", T).maybeSingle();
  if (!l) { const r = await sb.from("lessons").insert({ title: T, date: "2026-11-25", source: "oral" }).select("id").single(); if (r.error) throw r.error; l = r.data; }
  for (const [tr, ar, he, type, n, pl] of fresh) {
    const { data, error } = await sb.from("cards").insert({ translit_nikud: tr, arabic_script: ar, hebrew_meaning: he, item_type: type, notes: n, plural_form: pl ?? null, lesson_id: l!.id, course_verified: false, chatifai_verified: false }).select("id").single();
    if (error) throw error;
    const { error: e2 } = await sb.from("card_srs").insert({ card_id: data.id, direction: "he_to_ar" }); if (e2) throw e2;
  }
  console.log("✅ done");
})();
