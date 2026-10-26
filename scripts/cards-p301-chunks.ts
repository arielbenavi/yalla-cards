// Book p. 301 (מפגש 5 answers 12–20): short chunks Ariel wants as their own cards
// (2026-10-26) — e.g. רַקַם בֵּלֵפוֹנוֹ. Book pointing, lines already checked by chatifai.
// Skips any whose letters already match a card.
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const ASKED = "825ef0fe-f683-48ee-9bb5-3cfaa5913282";
const C: [string, string, string][] = [
  ["רַקַם בֵּלֵפוֹנוֹ", "رقم بيلفونه", "מספר הפלאפון שלו"],
  ["מַלַאן מַצַארִי", "ملان مصاري", "מלא כסף"],
  ["גֻ'וַּת (אל)צַּנְדוּק", "جوات الصندوق", "בתוך התיבה"],
  ["מֻש עַארֵף", "مش عارف", "לא יודע / אני לא יודע"],
  ["מֻמְכֵּן עַארֵף אַוְ מֻש עַארֵף", "ممكن عارف أو مش عارف", "אולי יודע ואולי לא יודע"],
  ["פִי מַוְצ'וּע (אל)רֻּחְצַ'ה", "في موضوع الرخصة", "בנושא הרישיון"],
  ["מֻש מְנִיח בִּ(א)לְמַרַּה", "مش منيح بالمرة", "לא טוב בכלל"],
  ["עִנְדְהַא בַּסּ בַּנַאת", "عندها بس بنات", "יש לה רק בנות"],
  ["מַלַאנֵה בְּאַשְיַאא מְנִיחַה", "مليانة بأشياء منيحة", "מלאה בדברים טובים"],
  ["חְסַאבּ הוֹן", "حساب هون", "חשבון פה"],
];
const sk = (s: string) => s.replace(/[֑-ׇ'׳()?؟.,!\-–]/g, "").replace(/[ךםןףץ]/g, (c) => ({ ך: "כ", ם: "מ", ן: "נ", ף: "פ", ץ: "צ" } as Record<string, string>)[c]).replace(/\s+/g, " ").trim();
(async () => {
  const all: string[] = [];
  for (let f = 0; ; f += 1000) { const { data } = await sb.from("cards").select("translit_nikud").range(f, f + 999); all.push(...(data ?? []).map((d) => sk(d.translit_nikud))); if (!data || data.length < 1000) break; }
  const keep = C.filter(([tr]) => { const hit = all.includes(sk(tr)); if (hit) console.log("skip (exists):", tr); return !hit; });
  const { data, error } = await sb.from("cards").insert(keep.map(([tr, ar, he]) => ({
    translit_nikud: tr, arabic_script: ar, hebrew_meaning: he, item_type: "phrase",
    notes: "ספר המדרשה עמ׳ 301", lesson_id: ASKED, course_verified: true, chatifai_verified: true,
  }))).select("id");
  if (error) throw error;
  const { error: e2 } = await sb.from("card_srs").insert(data!.map((x) => ({ card_id: x.id, direction: "he_to_ar" })));
  if (e2) throw e2;
  console.log("✅", data!.length, "cards");
})();
