// Lesson "מפגש בעל פה 17.11.26": new cards (skips words the deck has), extra meanings on two
// existing cards (hebrew_meaning only, old values backed up), and two photos for the picture game.
// New cards: chatifai_verified=false. FSRS of existing cards is never touched.
//   npx tsx scripts/insert-oral-2026-11-17.ts          # dry run
//   npx tsx scripts/insert-oral-2026-11-17.ts --apply
import { config } from "dotenv";
import { readFileSync, writeFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { WORDS, ADD_MEANING, PHOTOS } from "./data/oral-2026-11-17";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const APPLY = process.argv.includes("--apply");
const TITLE = "מפגש בעל פה 17.11.26";
const n = (s: string) => (s ?? "").replace(/[ً-ْـ؟?!،,.\s–()-]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي");

(async () => {
  const all: { id: string; arabic_script: string | null; translit_nikud: string; hebrew_meaning: string }[] = [];
  for (let f = 0; ; f += 1000) {
    const { data, error } = await sb.from("cards").select("id,arabic_script,translit_nikud,hebrew_meaning").range(f, f + 999);
    if (error) throw error;
    all.push(...data!);
    if (data!.length < 1000) break;
  }
  for (const [tr, ar] of WORDS) {
    if (/[א-ת]/.test(ar)) throw new Error(`Hebrew in Arabic: ${ar}`);
    if (/[ء-ي]/.test(tr)) throw new Error(`Arabic in translit: ${tr}`);
  }
  const have = new Map<string, string>();
  for (const c of all) for (const p of [c.arabic_script ?? "", ...(c.arabic_script ?? "").split("/")]) if (n(p)) have.set(n(p), `${c.translit_nikud} = ${c.hebrew_meaning}`);
  const dup = (ar: string) => [ar, ...ar.split("/")].map(n).find((k) => k && have.has(k));
  const fresh = WORDS.filter((r) => { const d = dup(r[1]); if (d) console.log(`skip ${r[0]}  ← ${have.get(d)}`); return !d; });
  const edits = ADD_MEANING.flatMap(([ar, add]) => all.filter((c) => n(c.arabic_script ?? "") === n(ar) && !c.hebrew_meaning.includes(add.split(",")[0]))
    .map((c) => ({ id: c.id, old: c.hebrew_meaning, next: `${c.hebrew_meaning}, ${add}` })));
  console.log(`new ${fresh.length} of ${WORDS.length}`);
  for (const e of edits) console.log(`meaning: ${e.old} → ${e.next}`);
  if (!APPLY) return console.log("dry run: pass --apply");

  writeFileSync("scripts/data/meanings-before-2026-11-17.json", JSON.stringify(edits, null, 2));
  let { data: lesson } = await sb.from("lessons").select("id").eq("title", TITLE).maybeSingle();
  if (!lesson) {
    const r = await sb.from("lessons").insert({ date: "2026-11-17", title: TITLE, source: "oral", notes: "הערות בכתב יד של אריאל ומילים שהקליד אחרי המפגש." }).select("id").single();
    if (r.error) throw r.error;
    lesson = r.data;
  }
  if (fresh.length) {
    const { data, error } = await sb.from("cards").insert(fresh.map(([tr, ar, he, type, notes]) => ({
      translit_nikud: tr, arabic_script: ar, hebrew_meaning: he, item_type: type, notes: notes ?? null,
      lesson_id: lesson!.id, course_verified: false, chatifai_verified: false,
    }))).select("id");
    if (error) throw error;
    const { error: e2 } = await sb.from("card_srs").insert(data!.map((d) => ({ card_id: d.id, direction: "he_to_ar" })));
    if (e2) throw e2;
  }
  for (const e of edits) { const { error } = await sb.from("cards").update({ hebrew_meaning: e.next }).eq("id", e.id); if (error) throw error; }

  for (const p of PHOTOS) {
    const path = `scenes/${p.slug}.webp`;
    const { error: up } = await sb.storage.from("pictures").upload(path, readFileSync(p.file), { contentType: "image/webp", upsert: true });
    if (up) throw up;
    let { data: scene } = await sb.from("picture_scenes").select("id").eq("image_path", path).maybeSingle();
    if (!scene) { const r = await sb.from("picture_scenes").insert({ title: p.title, image_path: path }).select("id").single(); if (r.error) throw r.error; scene = r.data; }
    await sb.from("picture_hotzones").delete().eq("scene_id", scene!.id);
    const { error: hz } = await sb.from("picture_hotzones").insert(p.zones.map((z) => ({ scene_id: scene!.id, label_ar: z.ar, label_he: z.he, translit: z.tr, x_pct: z.x, y_pct: z.y })));
    if (hz) throw hz;
  }
  console.log("✅ lesson", lesson!.id, "·", fresh.length, "cards ·", edits.length, "meanings ·", PHOTOS.length, "photos");
})();
