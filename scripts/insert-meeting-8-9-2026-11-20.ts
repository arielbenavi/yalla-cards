// Ariel's 2026-11-20 batch: typed words (meetings 8/9), meeting 8 practice answers (pp. 311–312),
// and meeting 9 from the book (pp. 134–146: vocabulary, sentences, four object-suffix tables).
// Skips anything the deck has (by Arabic, or by unpointed transliteration). New cards:
// chatifai_verified=false; book items course_verified=true. FSRS of existing cards is never touched;
// only the new מוצול card gets an early due date, as Ariel asked.
//   npx tsx scripts/insert-meeting-8-9-2026-11-20.ts          # dry run
//   npx tsx scripts/insert-meeting-8-9-2026-11-20.ts --apply
import { config } from "dotenv";
import { writeFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { TYPED, PROMOTE, ADD_MEANING } from "./data/meeting-8-9-typed";
import { PRACTICE8 } from "./data/meeting-8-practice";
import { VOCAB_9, SENTENCES_9, PARADIGMS_9 } from "./data/meeting-9-book";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const APPLY = process.argv.includes("--apply");
const na = (s: string) => (s ?? "").replace(/[ً-ْـ؟?!،,.\s–()-]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي");
const nt = (s: string) => (s ?? "").normalize("NFD").replace(/[֑-ׇ'׳"?!.,()\s–-]/g, "").replace(/ך/g, "כ").replace(/ם/g, "מ").replace(/ן/g, "נ").replace(/ף/g, "פ").replace(/ץ/g, "צ")

type New = { translit_nikud: string; arabic_script: string | null; hebrew_meaning: string; item_type: string; notes: string | null; plural_form: string | null; course_verified: boolean; course_note: string | null; meeting: 8 | 9; promote?: boolean };

(async () => {
  const all: { id: string; arabic_script: string | null; translit_nikud: string; hebrew_meaning: string }[] = [];
  for (let f = 0; ; f += 1000) {
    const { data, error } = await sb.from("cards").select("id,arabic_script,translit_nikud,hebrew_meaning").range(f, f + 999);
    if (error) throw error; all.push(...data!); if (data!.length < 1000) break;
  }
  const byAr = new Map<string, string>(), byTr = new Map<string, { id: string; tr: string; he: string }[]>();
  const words = (h: string) => new Set(h.replace(/[(),.;/!?"״׳-]/g, " ").split(/\s+/).filter((w) => w.length > 1));
  for (const c of all) {
    for (const p of [c.arabic_script ?? "", ...(c.arabic_script ?? "").split("/")]) if (na(p)) byAr.set(na(p), c.translit_nikud);
    for (const p of [c.translit_nikud, ...c.translit_nikud.split("/")]) if (nt(p).length > 1) byTr.set(nt(p), [...(byTr.get(nt(p)) ?? []), { id: c.id, tr: c.translit_nikud, he: c.hebrew_meaning }]);
  }
  const rows: New[] = [
    ...TYPED.map(([tr, ar, he, type, notes, pl, m]) => ({ translit_nikud: tr, arabic_script: ar, hebrew_meaning: he, item_type: type, notes, plural_form: pl, course_verified: false, course_note: null, meeting: m, promote: PROMOTE.includes(ar) })),
    ...PRACTICE8.map(([tr, ar, he]) => ({ translit_nikud: tr, arabic_script: ar, hebrew_meaning: he, item_type: "sentence", notes: "מפגש 8, תרגול אישי (עמ' 311–312)", plural_form: null, course_verified: true, course_note: "מפגש 8 — ספר, מנוקד במקור", meeting: 8 as const })),
    ...VOCAB_9.map(([tr, he, pl]) => ({ translit_nikud: tr, arabic_script: null, hebrew_meaning: he, item_type: tr.includes(" ") && !tr.includes("/") && !tr.includes(",") ? "phrase" : "word", notes: null, plural_form: pl ?? null, course_verified: true, course_note: "מפגש 9 — ספר, מנוקד במקור", meeting: 9 as const })),
    ...SENTENCES_9.map(([tr, he, note]) => ({ translit_nikud: tr, arabic_script: null, hebrew_meaning: he, item_type: "sentence", notes: note ?? "מפגש 9, עמ' 137", plural_form: null, course_verified: true, course_note: "מפגש 9 — ספר, מנוקד במקור", meeting: 9 as const })),
  ];
  const seen = new Set<string>();
  const plurals: { id: string; plural: string }[] = [];
  const fresh = rows.filter((r) => {
    const keyAr = r.arabic_script && r.arabic_script !== "عادة" /* עַאדַתַן (usually) is another word */ ? [r.arabic_script, ...r.arabic_script.split("/")].map(na).find((k) => k && byAr.has(k)) : undefined;
    const mine = words(r.hebrew_meaning);
    const hit = [r.translit_nikud, ...r.translit_nikud.split("/")].map(nt).flatMap((k) => (k.length > 1 ? byTr.get(k) ?? [] : []))
      .find((c) => r.item_type === "sentence" || [...words(c.he)].some((w) => mine.has(w)));
    if (keyAr || hit) {
      console.log(`skip ${r.translit_nikud}  ← ${keyAr ? byAr.get(keyAr) : `${hit!.tr} = ${hit!.he}`}`);
      if (hit && r.plural_form) plurals.push({ id: hit.id, plural: r.plural_form });
      return false;
    }
    const k = nt(r.translit_nikud); if (seen.has(k)) return false; seen.add(k); return true;
  });
  const edits = ADD_MEANING.flatMap(([ar, add]) => all.filter((c) => na(c.arabic_script ?? "") === na(ar) && !c.hebrew_meaning.includes(add)).map((c) => ({ id: c.id, old: c.hebrew_meaning, next: `${c.hebrew_meaning}; ${add}` })));
  const { data: haveP } = await sb.from("paradigms").select("slug").eq("meeting", 9);
  const newP = PARADIGMS_9.filter((p) => !(haveP ?? []).some((h) => h.slug === p.slug));
  console.log(`plurals for existing: ${plurals.length}`);
  console.log(`new cards ${fresh.length} of ${rows.length} (m8 ${fresh.filter((r) => r.meeting === 8).length}, m9 ${fresh.filter((r) => r.meeting === 9).length}) · paradigms ${newP.length} · meanings ${edits.length}`);
  if (!APPLY) return console.log("dry run: pass --apply");

  writeFileSync("scripts/data/meanings-before-2026-11-20.json", JSON.stringify(edits, null, 2));
  const lessonId: Record<number, string> = {};
  for (const m of [8, 9]) {
    const t = `מפגש ${m}`;
    let { data: l } = await sb.from("lessons").select("id").eq("title", t).maybeSingle();
    if (!l) { const r = await sb.from("lessons").insert({ title: t }).select("id").single(); if (r.error) throw r.error; l = r.data; }
    lessonId[m] = l!.id;
  }
  for (const p of newP) { const { error } = await sb.from("paradigms").insert({ meeting: 9, slug: p.slug, data: p.data }); if (error) throw error; }
  for (const r of fresh) {
    const { meeting, promote, ...card } = r;
    const { data, error } = await sb.from("cards").insert({ ...card, lesson_id: lessonId[meeting], chatifai_verified: false }).select("id").single();
    if (error) throw error;
    const { error: e2 } = await sb.from("card_srs").insert({ card_id: data.id, direction: "he_to_ar", ...(promote ? { due: "2026-01-01T00:00:00Z" } : {}) });
    if (e2) throw e2;
  }
  for (const e of edits) { const { error } = await sb.from("cards").update({ hebrew_meaning: e.next }).eq("id", e.id); if (error) throw error; }
  for (const p of plurals) await sb.from("cards").update({ plural_form: p.plural }).eq("id", p.id).is("plural_form", null);
  console.log("✅ done");
})();
