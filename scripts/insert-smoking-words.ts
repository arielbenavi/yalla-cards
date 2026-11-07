// Ariel (2026-11-07): words about smoking. Asked for: עישון, לעשן, סיגריה/סיגריות,
// מצית, טבק; plus two common neighbours. دخان (סיגריות / עשן) is already in the deck.
// chatifai is down, so the Arabic and nikud are from general knowledge: every card is
// chatifai_verified=false and noted "משוער". Touches lessons, cards and each new
// card's own card_srs row — never existing FSRS state.
//
//   npx tsx scripts/insert-smoking-words.ts [--apply]
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { fixBet } from "../lib/word-lookup";

config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});
const APPLY = process.argv.includes("--apply");
const LESSON = "עישון — מילים שאריאל ביקש 7.11.26";

// [arabic, translit, hebrew, notes?]
const ITEMS: [string, string, string, string?][] = [
  ["تدخين", "תַדְחִ'ין", "עישון", "משוער — לבדוק"],
  ["دخّن / بدخّن", "דַחַּ'ן / בִּדַחֵּ'ן", "עישן / (אני) מעשן", "משוער — לבדוק"],
  ["سيجارة / سجاير", "סִיגַ'ארַה / סַגַ'איֵר", "סיגריה / סיגריות", "משוער — לבדוק. גם دخان דֻחַ'אן = סיגריות"],
  ["ولّاعة", "וַלַּאעַה", "מצית", "משוער — לבדוק"],
  ["تتن", "תֻתֻן", "טבק", "משוער — לבדוק. גם دخان דֻחַ'אן"],
  ["منفضة", "מַנְפַצַ'ה", "מאפרה", "משוער — לבדוק"],
  ["ممنوع التدخين", "מַמְנוּע (א)תַּדְחִ'ין", "העישון אסור", "משוער — לבדוק"],
];

// Arabic without marks and with the common letter variants folded, for the duplicate check
const norm = (s: string) =>
  s.replace(/[ً-ْٰـ؟?]/g, "").replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").trim();

async function main() {
  const existing = new Map<string, string>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from("cards").select("arabic_script, translit_nikud").range(from, from + 999);
    if (error) throw error;
    for (const c of data) if (c.arabic_script) existing.set(norm(c.arabic_script), c.translit_nikud);
    if (data.length < 1000) break;
  }
  const fresh = ITEMS.filter(([ar]) => !existing.has(norm(ar)));
  for (const [ar] of ITEMS) if (existing.has(norm(ar))) console.log("skip (in deck):", ar, "·", existing.get(norm(ar)));
  console.log(`${fresh.length} new of ${ITEMS.length}`);
  if (!APPLY) return console.log("dry run — add --apply");

  const { data: lesson, error } = await sb
    .from("lessons")
    .insert({ title: LESSON, date: "2026-11-07", source: "other" })
    .select("id")
    .single();
  if (error) throw error;
  for (const [ar, tr, he, notes] of fresh) {
    const { data: card, error: e1 } = await sb
      .from("cards")
      .insert({
        arabic_script: ar,
        translit_nikud: fixBet(tr.replace(/׳/g, "'")),
        hebrew_meaning: he,
        notes: notes ?? null,
        item_type: ar.trim().includes(" ") ? "phrase" : "word",
        lesson_id: lesson.id,
        chatifai_verified: false,
      })
      .select("id")
      .single();
    if (e1) throw e1;
    const { error: e2 } = await sb.from("card_srs").insert({ card_id: card.id, direction: "he_to_ar" });
    if (e2) throw e2;
  }
  console.log("✅ lesson", lesson.id, "·", fresh.length, "cards");
}
main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
