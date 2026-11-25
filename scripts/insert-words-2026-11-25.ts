// Ariel's word list of 25.11.26, pointing checked against MuFeed (scripts/mufeed/dict.json).
// Skipped as already in the deck: אכיאס (כִּיס carries the plural אַכְּיַאס) and סאחה (אִסַּאחַה = הזירה / החצר).
// חדיקה is not in MuFeed (the spoken word is גְ'נֵינֵה, already a card), so its pointing is estimated.
import { config } from "dotenv"; import { createClient } from "@supabase/supabase-js";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const APPLY = process.argv.includes("--apply");
const LESSON = "מילים 25.11.26";
const M = "ניקוד לפי מופיד";
// [translit, arabic, hebrew, notes, plural?, mufeed_verified]
const ROWS: [string, string, string, string, string | null, boolean][] = [
  ["בַּדְרִי", "بدري", "מוקדם", M + ". גם: בַּכִּיר", null, true],
  ["חַדִיקַה", "حديقة", "גינה", "ניקוד משוער, לא במופיד. בדיבור בדרך כלל גְ'נֵינֵה", null, false],
  ["רִסַאלֵה", "رسالة", "מכתב, הודעה", M, "רַסַאיֵל", true],
  ["פֻסְתַאן", "فستان", "שמלה", M, "פַסַאתִין", true],
  ["נַתִיגֵ'ה", "نتيجة", "תוצאה, ציון", M, "נַתַאיֵג'", true],
];
const bare = (s: string) => (s ?? "").replace(/[ً-ْٰـ]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").trim();
(async () => {
  const have = new Set<string>();
  for (let f = 0; ; f += 1000) {
    const { data, error } = await sb.from("cards").select("arabic_script").range(f, f + 999); if (error) throw error;
    for (const c of data!) for (const p of (c.arabic_script ?? "").split(/\s*\/\s*/)) have.add(bare(p));
    if (data!.length < 1000) break;
  }
  const fresh = ROWS.filter(([tr, ar]) => { const dup = have.has(bare(ar)); if (dup) console.log("skip (exists)", tr); return !dup; });
  console.log(`new ${fresh.length} of ${ROWS.length}`);
  if (!APPLY) return console.log("dry run — add --apply");
  let { data: l } = await sb.from("lessons").select("id").eq("title", LESSON).maybeSingle();
  if (!l) { const r = await sb.from("lessons").insert({ title: LESSON, date: "2026-11-25", source: "other" }).select("id").single(); if (r.error) throw r.error; l = r.data; }
  for (const [tr, ar, he, notes, pl, mv] of fresh) {
    const { data, error } = await sb.from("cards").insert({ translit_nikud: tr, arabic_script: ar, hebrew_meaning: he, notes, plural_form: pl, item_type: "word", lesson_id: l!.id, chatifai_verified: false, mufeed_verified: mv }).select("id").single();
    if (error) throw error;
    const { error: e2 } = await sb.from("card_srs").insert({ card_id: data.id, direction: "he_to_ar" }); if (e2) throw e2;
    console.log("+", tr);
  }
  console.log("✅ done");
})();
