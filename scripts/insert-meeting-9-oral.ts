// Ariel's notes from the meeting 9 recording → lesson "מפגש 9". Skips words the deck already has
// (by Arabic), adds one meaning and one example note to existing cards. FSRS untouched.
//   npx tsx scripts/insert-meeting-9-oral.ts [--apply]
import { config } from "dotenv"; import { writeFileSync } from "fs"; import { createClient } from "@supabase/supabase-js";
import { ROWS, ADD_MEANING, NOTE_FOR } from "./data/meeting-9-oral";
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
  const meanings = ADD_MEANING.flatMap(([ar, add]) => all.filter((c) => na(c.arabic_script ?? "") === na(ar) && !c.hebrew_meaning.includes(add)).map((c) => ({ id: c.id, old: c.hebrew_meaning, next: `${c.hebrew_meaning}, ${add}` })));
  const notes = NOTE_FOR.flatMap(([ar, n]) => all.filter((c) => na(c.arabic_script ?? "") === na(ar) && !(c.notes ?? "").includes("עמ' 137, משפט 6")).map((c) => ({ id: c.id, old: c.notes, next: (c.notes ? c.notes + "\n" : "") + n })));
  console.log(`new ${fresh.length} of ${ROWS.length} · meanings ${meanings.length} · notes ${notes.length}`);
  if (!APPLY) return;
  writeFileSync("scripts/data/meeting-9-oral-backup.json", JSON.stringify({ meanings, notes }, null, 1));
  const { data: l } = await sb.from("lessons").select("id").eq("title", "מפגש 9").single();
  for (const [tr, ar, he, type, n, pl] of fresh) {
    const { data, error } = await sb.from("cards").insert({ translit_nikud: tr, arabic_script: ar, hebrew_meaning: he, item_type: type, notes: n, plural_form: pl ?? null, lesson_id: l!.id, course_verified: false, chatifai_verified: false }).select("id").single();
    if (error) throw error;
    const { error: e2 } = await sb.from("card_srs").insert({ card_id: data.id, direction: "he_to_ar" }); if (e2) throw e2;
  }
  for (const m of meanings) await sb.from("cards").update({ hebrew_meaning: m.next }).eq("id", m.id);
  for (const m of notes) await sb.from("cards").update({ notes: m.next }).eq("id", m.id);
  console.log("✅ done");
})();
