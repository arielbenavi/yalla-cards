// Ariel's saved words in MuFeed → lesson "שמורים במופיד", in the order he saved them. Rerunnable:
//   python3 -I scripts/mufeed/saved.py        # downloads scripts/mufeed/saved.json (his own login, read-only)
//   npx tsx scripts/insert-mufeed-saved.ts [--apply]
// Skips what the deck already has (by Arabic). Pointing is MuFeed's (ّ → dagesh, ׳ → '), so mufeed_verified.
// FSRS untouched apart from each new card's own card_srs row.
import { config } from "dotenv"; import { readFileSync } from "fs"; import { createClient } from "@supabase/supabase-js";
import { fixBet } from "../lib/word-lookup";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const APPLY = process.argv.includes("--apply");
const LESSON = "שמורים במופיד";
type Entry = { arabic_text: string; is_phrase: boolean; is_literary: boolean; transliteration: string; transliteration_present: string | null; transliteration_plural: string | null; translations: { hebrew_translation: string; is_context: boolean }[] };
const saved: { saved_at: string; dictionary_entries: Entry | null }[] = JSON.parse(readFileSync("scripts/mufeed/saved.json", "utf8"));
const he = (s: string | null) => (s ? fixBet(s.replace(/ّ/g, "ּ").replace(/׳/g, "'").replace(/\s*\/\s*/g, " / ").trim()).normalize("NFC") : null);
// Same spelling, different word than the deck's card (checked by hand, 27.11): forced in.
const FORCE = new Set(["دِين", "قَلَى", "ظَهْر/ضَهِر", "بِرْكِة", "فِي / بْ"]);
// MuFeed writes the article אֵלְ and leaves a word-initial א unpointed; the deck writes (א)לְ / (אל) and אִ.
const deck = (s: string | null) => s && s.replace(/(^|\s)אֵלְ/g, "$1(א)לְ").replace(/^אס/, "אִס").replace(/^אח/, "אִח");
const na = (s: string) => (s ?? "").replace(/[ً-ْٰـ؟?!،,.\s–()-]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي");
(async () => {
  const have = new Map<string, string>();
  for (let f = 0; ; f += 1000) {
    const { data, error } = await sb.from("cards").select("arabic_script,translit_nikud,hebrew_meaning").range(f, f + 999); if (error) throw error;
    for (const c of data!) for (const p of [c.arabic_script ?? "", ...(c.arabic_script ?? "").split("/")]) if (na(p)) have.set(na(p), `${c.translit_nikud} = ${c.hebrew_meaning}`);
    if (data!.length < 1000) break;
  }
  const fresh = saved.filter(({ dictionary_entries: e }) => {
    if (!e) return false;
    if (FORCE.has(e.arabic_text)) return true;
    const k = [e.arabic_text, ...e.arabic_text.split("/")].map(na).find((x) => x && have.has(x));
    if (k) console.log("skip", e.arabic_text, "←", have.get(k));
    return !k;
  });
  console.log(`new ${fresh.length} of ${saved.length}`);
  if (!APPLY) { for (const { dictionary_entries: e } of fresh) console.log("+", deck(he(e!.transliteration)), "=", e!.translations.filter((t) => !t.is_context).map((t) => t.hebrew_translation).join(", ")); return; }
  let { data: l } = await sb.from("lessons").select("id").eq("title", LESSON).maybeSingle();
  if (!l) { const r = await sb.from("lessons").insert({ title: LESSON, date: "2026-11-27", source: "other", notes: "מילים שאריאל שמר במילון של מופיד" }).select("id").single(); if (r.error) throw r.error; l = r.data; }
  for (const { saved_at, dictionary_entries: e } of fresh) {
    const meaning = e!.translations.filter((t) => !t.is_context).map((t) => t.hebrew_translation).join(", ");
    const notes = [`מופיד (נשמר ${saved_at.slice(8, 10)}.${saved_at.slice(5, 7)})`, e!.transliteration_present && `הווה: ${he(e!.transliteration_present)}`, e!.is_literary && "ספרותי"].filter(Boolean).join(". ");
    const { data, error } = await sb.from("cards").insert({ translit_nikud: deck(he(e!.transliteration)), arabic_script: e!.arabic_text, hebrew_meaning: meaning, item_type: e!.is_phrase ? "phrase" : "word", notes, plural_form: he(e!.transliteration_plural), lesson_id: l!.id, chatifai_verified: false, mufeed_verified: true }).select("id").single();
    if (error) throw error;
    const { error: e2 } = await sb.from("card_srs").insert({ card_id: data.id, direction: "he_to_ar" }); if (e2) throw e2;
  }
  console.log("✅ done");
})();
