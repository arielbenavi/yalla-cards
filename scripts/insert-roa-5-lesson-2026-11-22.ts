// Preply Roa K. 5 (22.11.26): Roa's tense board (present · past · future) and the words from the lesson.
// Nikud from MuFeed stems where it has them, the rest estimated; chatifai checks later.
import { config } from "dotenv"; import { createClient } from "@supabase/supabase-js";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const APPLY = process.argv.includes("--apply");
const NOTE = "ניקוד משוער, מבוסס מופיד";
const CARDS: [string, string, string, string?][] = [
  ["אַלַאקִי / בַּלַאקִי · לַאקֵית · רַח אַלַאקִי", "(ש)אמצא / אני מוצא · מצאתי · אמצא", "الاقي / بلاقي · القيت · رح الاقي", "מהלוח של רואה (הווה · עבר · עתיד). מופיד: לַאקַא / יִלַאקִי. בלוח כתוב القيت"],
  ["אַגַ'אוֵבּ / בַּגַ'אוֵבּ · גַ'אוַבְּת · רַח אַגַ'אוֵבּ", "(ש)אענה / אני עונה · עניתי · אענה", "اجاوب / بجاوب · جاوبت · رح اجاوب", "מהלוח של רואה. מופיד: גַ'אוַבּ / יִגַ'אוֵבּ"],
  ["אַשְרַבּ / בַּשְרַבּ · שִרִבְּת · רַח / בִּדִּי אַשְרַבּ", "(ש)אשתה / אני שותה · שתיתי · אשתה / אני רוצה לשתות", "اشرب / بشرب · شربت · رح / بدي اشرب", "מהלוח של רואה. מופיד: שִרֵבּ / יִשְרַבּ"],
  ["אֻטְבֹּח' / בֻּטְבֹּח' · טַבַחְ'ת · רַח / בִּדִּי אֻטְבֹּח'", "(ש)אבשל / אני מבשל · בישלתי · אבשל", "اطبخ / بطبخ · طبخت · رح / بدي اطبخ", "מהלוח של רואה. מופיד: טַבַּח' / יֻטְבֹּח'"],
  ["סַרִיע", "מהיר, מהר", "سريع", "מופיד"],
  ["בְּסֻרְעַה", "במהירות, מהר", "بسرعة", "לא במופיד"],
  ["אֻסְבּוּעִי מַרַק בְּסֻרְעַה", "השבוע שלי עבר מהר", "اسبوعي مرق بسرعة", "גם: מַרּ. מופיד: מַרַק / יֻמְרֹק"],
  ["מֻגַ'רַּד", "סתם, רק, גרידא", "مجرّد", "מופיד. גם מֻגַ'רַּד מַא = ברגע ש..."],
  ["מַזְחַה / מַזְחַאת", "בדיחה / בדיחות", "مزحة", "מופיד"],
  ["מְקַסַּמֵה", "מחולקת", "مقسّمة", "לא במופיד; אריאל שמע מקאסמה"],
  ["צַרַח' / בֻּצְרֹח'", "צעק / (אני) צועק", "صرخ / بصرخ", "מופיד: צַרַח' / יֻצְרֹח'. אריאל שמע ביסאריח"],
];
const nt = (s: string) => (s ?? "").normalize("NFD").replace(/[֑-ׇ'׳"?!.,()\s–-]/g, "").replace(/ך/g, "כ").replace(/ם/g, "מ").replace(/ן/g, "נ").replace(/ף/g, "פ").replace(/ץ/g, "צ");
(async () => {
  const all: { translit_nikud: string }[] = [];
  for (let f = 0; ; f += 1000) { const { data, error } = await sb.from("cards").select("translit_nikud").range(f, f + 999); if (error) throw error; all.push(...data!); if (data!.length < 1000) break; }
  const have = new Set(all.map((c) => nt(c.translit_nikud)));
  const fresh = CARDS.filter(([tr]) => { const dup = have.has(nt(tr)); if (dup) console.log("skip (exists)", tr); return !dup; });
  console.log(`new ${fresh.length} of ${CARDS.length}`);
  if (!APPLY) return;
  let { data: l } = await sb.from("lessons").select("id").eq("title", "Preply Roa K. 5").maybeSingle();
  if (!l) { const r = await sb.from("lessons").insert({ title: "Preply Roa K. 5", source: "preply", meeting: 5, date: "2026-11-22" }).select("id").single(); if (r.error) throw r.error; l = r.data; }
  for (const [tr, he, ar, extra] of fresh) {
    const { data, error } = await sb.from("cards").insert({ translit_nikud: tr, hebrew_meaning: he, arabic_script: ar, notes: extra ? `${extra}. ${NOTE}` : NOTE, item_type: tr.includes(" ") && !tr.includes(" / ") ? "phrase" : "word", lesson_id: l!.id, chatifai_verified: false }).select("id").single();
    if (error) throw error;
    const { error: e2 } = await sb.from("card_srs").insert({ card_id: data.id, direction: "he_to_ar" }); if (e2) throw e2;
  }
  console.log("✅ done");
})();
