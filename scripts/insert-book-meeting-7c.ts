// מפגש 7, third pass: new cards, plurals from pp. 110–112, corrections to existing
// meanings and notes, and the p. 107 drill. Words the deck has (by Arabic skeleton)
// are skipped. Old values go to scripts/data/meeting-7c-before.json. Never touches card_srs
// of existing cards.
//   npx tsx scripts/insert-book-meeting-7c.ts          # dry run
//   npx tsx scripts/insert-book-meeting-7c.ts --apply
import { config } from "dotenv";
import { writeFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { WORDS, PHRASES, PLURALS, UPDATES, NEGATION_PARADIGM } from "./data/book-meeting-7c";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const APPLY = process.argv.includes("--apply");
const LESSON = "0f08865f-9f86-489f-b713-b67d30d0d633";
const n = (s: string) => (s ?? "").replace(/[ً-ْـ؟?!،,.\s–-]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/^ال/, "");
// A different meaning of a word the deck already has, so the skeleton check must not stop it
const FORCE = new Set(["צַ'רֵבּ", "חַכִּי"]);
type Card = { id: string; arabic_script: string | null; translit_nikud: string; hebrew_meaning: string; notes: string | null; plural_form: string | null; item_type: string };

(async () => {
  let all: Card[] = [];
  for (let f = 0; ; f += 1000) {
    const { data, error } = await sb.from("cards").select("id,arabic_script,translit_nikud,hebrew_meaning,notes,plural_form,item_type").range(f, f + 999);
    if (error) throw error;
    all = all.concat(data as Card[]);
    if (data!.length < 1000) break;
  }
  for (const [tr, ar] of [...WORDS, ...PHRASES]) {
    if (/[א-ת]/.test(ar)) throw new Error(`Hebrew in Arabic: ${ar}`);
    if (/[ء-ي]/.test(tr)) throw new Error(`Arabic in translit: ${tr}`);
  }
  const have = new Map(all.map((c) => [n(c.arabic_script ?? ""), c]));
  const incoming = [...WORDS, ...PHRASES];
  const fresh = incoming.filter((r) => FORCE.has(r[0]) || !have.has(n(r[1])));
  const skipped = incoming.filter((r) => !fresh.includes(r)).map((r) => `${r[0]} (יש: ${have.get(n(r[1]))!.translit_nikud})`);

  // Fill only what is empty; "—" is the old marker for "no plural"
  const patches = new Map<string, Partial<Card>>();
  const patch = (id: string, p: Partial<Card>) => patches.set(id, { ...patches.get(id), ...p });
  const notesOf = (c: Card) => (patches.get(c.id)?.notes as string | undefined) ?? c.notes;
  const addNote = (c: Card, text: string) => {
    const old = notesOf(c);
    if (!old?.includes(text)) patch(c.id, { notes: old ? `${old} · ${text}` : text });
  };
  for (const [ar, plural, fem] of PLURALS) {
    const k = n(ar);
    const targets = all.filter((c) => {
      const first = (c.arabic_script ?? "").split("→")[0];
      if (first.startsWith("ال")) return false; // אִ(ל)צַּחִיח = the truth, a noun of its own
      return n(first) === k && (c.item_type === "word" || (c.arabic_script ?? "").includes("→"));
    });
    for (const c of targets) {
      if (plural && (!c.plural_form || c.plural_form === "—")) patch(c.id, { plural_form: plural });
      if (fem) addNote(c, `נקבה: ${fem}`);
    }
    if (!targets.length) console.log("no card for plural:", ar);
  }
  for (const u of UPDATES) {
    const hits = all.filter((c) => c.id.startsWith(u.id));
    if (hits.length !== 1) throw new Error(`id ${u.id}: ${hits.length} hits`);
    if (u.hebrew_meaning) patch(hits[0].id, { hebrew_meaning: u.hebrew_meaning });
    if (u.addNote) addNote(hits[0], u.addNote);
  }

  console.log("new:", fresh.length, "· skipped:", skipped.join(" | ") || "none");
  console.log("patches:", patches.size);
  for (const [id, p] of patches) { const c = all.find((x) => x.id === id)!; console.log(" ", c.translit_nikud, "::", JSON.stringify(p)); }
  if (!APPLY) return console.log("dry run");

  writeFileSync("scripts/data/meeting-7c-before.json", JSON.stringify([...patches.keys()].map((id) => {
    const c = all.find((x) => x.id === id)!;
    return { id, hebrew_meaning: c.hebrew_meaning, notes: c.notes, plural_form: c.plural_form };
  }), null, 1));
  const { data, error } = await sb.from("cards").insert(fresh.map(([tr, ar, he, type, notes, plural]) => ({
    translit_nikud: tr, arabic_script: ar, hebrew_meaning: he, item_type: type, notes: notes ?? null, plural_form: plural ?? null,
    lesson_id: LESSON, course_verified: (notes ?? "").includes("עמ' 11"), chatifai_verified: false,
  }))).select("id");
  if (error) throw error;
  const { error: e2 } = await sb.from("card_srs").insert(data!.map((d) => ({ card_id: d.id, direction: "he_to_ar" })));
  if (e2) throw e2;
  for (const [id, p] of patches) {
    const { error: e3 } = await sb.from("cards").update(p).eq("id", id);
    if (e3) throw e3;
  }
  const { data: ex } = await sb.from("paradigms").select("id").eq("slug", NEGATION_PARADIGM.slug).maybeSingle();
  if (!ex) {
    const { error: e4 } = await sb.from("paradigms").insert(NEGATION_PARADIGM);
    if (e4) throw e4;
  }
  const { data: note } = await sb.from("notes").select("id,body").eq("status", "open").like("body", "chatifai (כשיחזור): מפגש 7%").single();
  if (note) await sb.from("notes").update({ body: `${note.body} + scripts/data/book-meeting-7c.ts (הערות השיעור מ-3.11, עמ' 110–112).` }).eq("id", note.id);
  console.log("✅ inserted", data!.length, "· patched", patches.size, "· note", note ? "updated" : "NOT FOUND");
})();
