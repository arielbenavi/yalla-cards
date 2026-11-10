// מפגש 8, השלמה (2026-11-10): the pp. 132–133 drill (answers pp. 311–312), Ariel's oral notes
// the deck lacked, plurals on existing cards, and the p. 122 linking hiriq (רְגִ'עִלְהַא,
// רְגִ'עִלְכֹּם, כַּתַבִּלְהֹם) that the 24.8 transcription read as a sheva.
//   npx tsx scripts/insert-meeting-8-more.ts            dry run
//   npx tsx scripts/insert-meeting-8-more.ts --apply
// New cards: chatifai_verified = false; sentences read off the page are course_verified.
// Their card_srs rows get an early due so the daily queue serves them first (Ariel: "שנדחוף
// הכל לתרגול יומי"); existing cards' FSRS is never touched.
// Backup of every row this changes: scripts/data/meeting-8-more-backup.json.
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "fs";
import { FORMS, ORAL, SENTENCES, type Row } from "./data/meeting-8-more";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const APPLY = process.argv.includes("--apply");
const LESSON = "4b9289ff-8910-4ebb-868b-96f96678ff65"; // מפגש 8
const EARLY = "2026-01-01T00:00:00Z";
const n = (s: string) => (s ?? "").replace(/[ً-ْـ؟?!،,.\s–-]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي");
// أي واحد exists as "כל אחד", a different meaning; הַלְחִין is already on the "עכשיו" card.
const FORCE = new Set(["أي واحد؟ / أنو واحد؟"]);
const SKIP = new Set(["هالحين"]);
const HIRIQ: [string, string][] = [["רְגִ'עְלְהַא", "רְגִ'עִלְהַא"], ["רְגִ'עְלְכֹּם", "רְגִ'עִלְכֹּם"], ["כַּתַבְּלְהֹם", "כַּתַבִּלְהֹם"]];

(async () => {
  let all: { id: string; arabic_script: string; translit_nikud: string; hebrew_meaning: string }[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("cards").select("id,arabic_script,translit_nikud,hebrew_meaning").range(f, f + 999);
    all = all.concat(data!);
    if (data!.length < 1000) break;
  }
  // A card counts as existing if its whole Arabic, or any "/" form of it, matches a form of ours.
  const have = new Map<string, string>();
  for (const c of all) for (const part of [c.arabic_script, ...(c.arabic_script ?? "").split("/")]) have.set(n(part), `${c.translit_nikud} = ${c.hebrew_meaning}`);
  const dup = (ar: string) => [ar, ...ar.split("/")].map(n).find((k) => k && have.has(k));
  const fresh: { r: Row; course: boolean }[] = [];
  for (const [list, course] of [[SENTENCES, true], [ORAL, false]] as const)
    for (const r of list) {
      if (SKIP.has(r[1])) { console.log(`skip ${r[0]}  ← already on the עכשיו card`); continue; }
      const d = FORCE.has(r[1]) ? undefined : dup(r[1]);
      if (d) console.log(`skip ${r[0]}  ← ${have.get(d)}`);
      else fresh.push({ r, course: course || (r[4] ?? "").startsWith("עמ'") });
    }

  const forms = FORMS.map(([ar, tr, nar]) => ({ card: all.find((c) => c.arabic_script === ar), tr, nar }));
  for (const f of forms) if (!f.card) console.log(`no card for plural: ${f.tr}`);
  const hiriq = all.filter((c) => HIRIQ.some(([a]) => c.translit_nikud.includes(a)));

  console.log(`\nnew: ${fresh.length} (of ${SENTENCES.length + ORAL.length}) · plurals: ${forms.filter((f) => f.card).length} · hiriq fixes: ${hiriq.length}`);
  if (!APPLY) return;

  const { data: para } = await sb.from("paradigms").select("id,data").eq("slug", "indirect_object_l").eq("meeting", 8).single();
  writeFileSync("scripts/data/meeting-8-more-backup.json", JSON.stringify({ forms: forms.map((f) => f.card).filter(Boolean), hiriq, paradigm: para }, null, 1));

  const { data, error } = await sb.from("cards").insert(fresh.map(({ r: [tr, ar, he, type, notes], course }) => ({
    translit_nikud: tr, arabic_script: ar, hebrew_meaning: he, item_type: type, notes: notes ?? null,
    lesson_id: LESSON, course_verified: course, chatifai_verified: false,
  }))).select("id");
  if (error) throw error;
  const { error: e2 } = await sb.from("card_srs").insert(data!.map((d) => ({ card_id: d.id, direction: "he_to_ar", due: EARLY })));
  if (e2) throw e2;

  for (const f of forms) if (f.card) await sb.from("cards").update({ translit_nikud: f.tr, arabic_script: f.nar }).eq("id", f.card.id);
  for (const c of hiriq) {
    let t = c.translit_nikud;
    for (const [a, b] of HIRIQ) t = t.replaceAll(a, b);
    await sb.from("cards").update({ translit_nikud: t }).eq("id", c.id);
  }
  if (para) {
    let s = JSON.stringify(para.data);
    for (const [a, b] of HIRIQ) s = s.replaceAll(a, b);
    await sb.from("paradigms").update({ data: JSON.parse(s) }).eq("id", para.id);
  }
  console.log("✅ inserted", data!.length);
})();
