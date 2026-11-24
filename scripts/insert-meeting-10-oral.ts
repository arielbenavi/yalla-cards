// Ariel's notes from the meeting 10 recording → lesson "מפגש 10". Skips words the deck already has
// (by Arabic) and fixes the barkan → barken card's text. FSRS untouched.
//   npx tsx scripts/insert-meeting-10-oral.ts [--apply]
import { config } from "dotenv"; import { writeFileSync } from "fs"; import { createClient } from "@supabase/supabase-js";
import { ROWS, FIX } from "./data/meeting-10-oral";
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
  const fix = all.filter((c) => c.translit_nikud === FIX.from);
  console.log(`new ${fresh.length} of ${ROWS.length} · fix ${fix.length}`);
  if (!APPLY) return;
  writeFileSync("scripts/data/meeting-10-oral-backup.json", JSON.stringify(fix, null, 1));
  const { data: l } = await sb.from("lessons").select("id").eq("title", "מפגש 10").single();
  for (const [tr, ar, he, type, n, pl] of fresh) {
    const { data, error } = await sb.from("cards").insert({ translit_nikud: tr, arabic_script: ar, hebrew_meaning: he, item_type: type, notes: n, plural_form: pl ?? null, lesson_id: l!.id, course_verified: false, chatifai_verified: false }).select("id").single();
    if (error) throw error;
    const { error: e2 } = await sb.from("card_srs").insert({ card_id: data.id, direction: "he_to_ar" }); if (e2) throw e2;
  }
  for (const c of fix) await sb.from("cards").update({ translit_nikud: FIX.translit, arabic_script: FIX.arabic, notes: (c.notes ? c.notes + "\n" : "") + FIX.note }).eq("id", c.id);
  console.log("✅ done");
})();
