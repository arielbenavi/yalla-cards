// Book p. 74 (מפגש 5, אלי / ענדי / מעי; translation p. 75) — cards Ariel asked for
// (2026-10-25): sentences 12, 13, 16, 18; chunks from them; the words that had no card.
// Pointing: the book's, checked by chatifai (see data/book-translation-drills.ts).
// The existing sentence-19 card gets the book's pointing (text only). צַרַאחַה and הַם
// already exist and are moved into מילים שביקשתי so they reach the daily queue.
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const ASKED = "825ef0fe-f683-48ee-9bb5-3cfaa5913282";
type C = [string, string, string, string, string?];
const CARDS: C[] = [
  ["sentence", "אַח'וּכִּי מֻש עִנַּא, רַאח קַבֵּל סַעְתֵין, כֻּלּ שִי תַמַאם?", "أخوكي مش عنا، راح قبل ساعتين، كل شي تمام؟", "אחיך לא אצלנו, הלך לפני שעתיים, הכל בסדר?", "פנייה לאישה (אַח'וּכִּי)"],
  ["sentence", "בַּעְד (א)לְמֻכַּאלַמֵה, אִלְהֹם הַםּ כְּבִּיר", "بعد المكالمة، إلهم هم كبير", "אחרי השיחה, יש להם דאגה גדולה"],
  ["sentence", "אִלְמֻקַאבַּלֵה עִנְדֵכּ בִּ(א)לְמַכְּתַבּ אַוְ פִי (א)לְמַטְעַם?", "المقابلة عندك بالمكتب أو في المطعم؟", "הפגישה אצלך במשרד או במסעדה?", "פנייה לאישה (עִנְדֵכּ)"],
  ["sentence", "יַא עַמִּי, עִנְדִי וְלַּא עִנְדַכּ, וַאללַּהִ כֻּלּוֹ נַפְס (אל)שִּי", "يا عمي، عندي ولا عندك، والله كله نفس الشي", "דוד, אצלי או אצלך — באמת הכל אותו דבר"],
  ["phrase", "רַאח קַבֵּל סַעְתֵין", "راح قبل ساعتين", "הלך לפני שעתיים"],
  ["phrase", "בַּעְד (א)לְמֻכַּאלַמֵה", "بعد المكالمة", "אחרי השיחה"],
  ["phrase", "אִלְהֹם הַםּ כְּבִּיר", "إلهم هم كبير", "יש להם דאגה גדולה"],
  ["word", "קַרַאיֵבּ", "قرايب", "קרובים (קרובי משפחה)"],
  ["word", "מֻקַאבַּלֵה", "مقابلة", "פגישה"],
  ["phrase", "נַפְס (אל)שִּי", "نفس الشي", "אותו דבר"],
  ["phrase", "עַלַא כֵּיף כֵּיפַכּ", "على كيف كيفك", "בדיוק כמו שאתה רוצה / סבבה לגמרי"],
  ["word", "אַצְחַאבּ", "أصحاب", "חברים"],
  ["word", "גְ'דַאד", "جداد", "חדשים (ר)"],
  ["word", "מַעִנְדִיש", "ما عنديش", "אין לי", "גם: מַעִנַּאש = אין לנו (אצלנו) · מַעִנְדְהֹמֵש = אין להם"],
  ["word", "מַלְנַאש", "ما إلناش", "אין לנו", "שלילה של אִלְנַא"],
  ["word", "מַלְהַאש", "ما إلهاش", "אין לה", "שלילה של אִלְהַא"],
  ["word", "סַעְתֵין", "ساعتين", "שעתיים"],
  ["word", "טַיְּבִּין", "طيبين", "טובים (ר)"],
  ["word", "מַפַאתִיח", "مفاتيح", "מפתחות"],
  ["phrase", "מַא פִי כַּלַאם", "ما في كلام", "אין מה להגיד"],
];
(async () => {
  const { data, error } = await sb.from("cards").insert(CARDS.map(([type, tr, ar, he, note]) => ({
    translit_nikud: tr, arabic_script: ar, hebrew_meaning: he, item_type: type,
    notes: ["ספר המדרשה עמ׳ 74", note].filter(Boolean).join(" · "),
    lesson_id: ASKED, course_verified: true, chatifai_verified: true,
  }))).select("id");
  if (error) throw error;
  const { error: e2 } = await sb.from("card_srs").insert(data!.map((d) => ({ card_id: d.id, direction: "he_to_ar" })));
  if (e2) throw e2;
  console.log("✅", data!.length, "cards");

  const { data: s19 } = await sb.from("cards").select("id, notes").ilike("translit_normalized", "%אנא מאשי מעכ זי%").maybeSingle();
  if (s19) {
    await sb.from("cards").update({ translit_nikud: "וַאללַּה, אַנַא מַאשִי מַעַאכּ זַיּ (אל)סֵּיעַה, מַטְ'בּוּט וְלַּא לַא?", notes: [s19.notes, "ספר המדרשה עמ׳ 74"].filter(Boolean).join(" · ") }).eq("id", s19.id);
    console.log("✅ sentence 19 → book pointing");
  } else console.log("– sentence 19 card not found");
  const { error: e3 } = await sb.from("cards").update({ lesson_id: ASKED }).eq("translit_nikud", "צַרַאחַה");
  if (e3) throw e3;
  console.log("✅ צַרַאחַה moved to מילים שביקשתי");
})();
