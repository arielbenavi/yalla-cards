// Adds the conjugation homework of meetings 9–10 to the inflection drill, and meeting 10's vocabulary as cards.
import { config } from "dotenv"; import { createClient } from "@supabase/supabase-js";
import { GRIDS } from "./data/homework-9-10-grids";
import { VOCAB_10 } from "./data/meeting-10-vocab";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const APPLY = process.argv.includes("--apply");
const nt = (s: string) => (s ?? "").normalize("NFD").replace(/[֑-ׇ'׳"?!.,()\s–-]/g, "").replace(/ך/g, "כ").replace(/ם/g, "מ").replace(/ן/g, "נ").replace(/ף/g, "פ").replace(/ץ/g, "צ");
const words = (h: string) => new Set(h.replace(/[(),.;/!?"״׳:-]/g, " ").split(/\s+/).filter((w) => w.length > 1));
(async () => {
  const all: { id: string; translit_nikud: string; hebrew_meaning: string; plural_form: string | null }[] = [];
  for (let f = 0; ; f += 1000) { const { data, error } = await sb.from("cards").select("id,translit_nikud,hebrew_meaning,plural_form").range(f, f + 999); if (error) throw error; all.push(...data!); if (data!.length < 1000) break; }
  const by = new Map<string, typeof all>();
  for (const c of all) for (const p of [c.translit_nikud, ...c.translit_nikud.split(/[\/,]/)]) { const k = nt(p); if (k.length > 1) by.set(k, [...(by.get(k) ?? []), c]); }
  const plurals: { id: string; pl: string }[] = [];
  const KEEP = new Set(["זַעֵל", "שֻכֵּר", "מֻמְתַאז"]); // noun vs verb / a phrase: not duplicates
  const fresh = VOCAB_10.filter(([tr, he, pl]) => {
    if (KEEP.has(tr)) return !all.some((c) => c.translit_nikud === tr);
    const hit = [tr, ...tr.split(/[\/,]/)].map(nt).flatMap((k) => by.get(k) ?? []).find((c) => [...words(c.hebrew_meaning)].some((w) => words(he).has(w)));
    if (hit) { if (pl && !hit.plural_form) plurals.push({ id: hit.id, pl }); console.log("skip", tr, "←", hit.translit_nikud); return false; }
    return true;
  });
  console.log(`new ${fresh.length} of ${VOCAB_10.length}, plurals for existing ${plurals.length}, grids ${GRIDS.length}`);
  if (!APPLY) return;
  let { data: l } = await sb.from("lessons").select("id").eq("title", "מפגש 10").maybeSingle();
  if (!l) { const r = await sb.from("lessons").insert({ title: "מפגש 10", source: "book", meeting: 10, date: "2026-11-20" }).select("id").single(); if (r.error) throw r.error; l = r.data; }
  for (const [tr, he, pl] of fresh) {
    const { data, error } = await sb.from("cards").insert({ translit_nikud: tr, hebrew_meaning: he, plural_form: pl ?? null, arabic_script: null, item_type: tr.includes(" ") && !/[,\/]/.test(tr) ? "phrase" : "word", lesson_id: l!.id, course_verified: true, course_note: "מפגש 10 — ספר, מנוקד במקור", chatifai_verified: false }).select("id").single();
    if (error) throw error;
    const { error: e2 } = await sb.from("card_srs").insert({ card_id: data.id, direction: "he_to_ar" }); if (e2) throw e2;
  }
  for (const p of plurals) await sb.from("cards").update({ plural_form: p.pl }).eq("id", p.id).is("plural_form", null);
  for (const g of GRIDS) { await sb.from("paradigms").delete().eq("slug", g.slug); const { error } = await sb.from("paradigms").insert(g); if (error) throw error; }
  console.log("✅ done");
})();
