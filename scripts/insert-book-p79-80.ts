// Book vocabulary list, מפגש 5 (pp. 79–80): what had no card (2026-10-25). Read off
// the page images; chatifai confirmed every line תקין. Plural/feminine forms of
// participles go into the notes of the existing singular card; where the deck has
// the urban form (מַעְלַאַה, צַנְדוּא, אַריבּ, אַלְבּ) the book's ק form is added to its note.
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const L5 = "79e157c0-5c95-4598-ae54-d3fb3c619105"; // מפגש 5
const NEW: [string, string, string, string?][] = [
  ["אִלַּא", "إلا", "רק", "גם: בַּסּ, פַקַט"],
  ["לִקַאא", "لقاء", "פגישה", "ר: לִקַאאַת · גם: מֻקַאבַּלֵה"],
  ["מֻקַאבַּלַאת", "مقابلات", "פגישות", "יחיד: מֻקַאבַּלֵה"],
  ["טַבּ", "طب", "טוב (קיצור של טַיֵּבּ)"],
  ["מַעְלַקַה זְעִ'ירֵה", "معلقة زغيرة", "כפית"],
  ["בֵּלֵפוֹנַאת", "بيلفونات", "פלאפונים", "יחיד: בֵּלֵפוֹן"],
  ["לִיסְתַאת", "ليستات", "רשימות", "יחיד: לִיסְתַה"],
  ["חְסַאבַּאת", "حسابات", "חשבונות", "יחיד: חְסַאבּ"],
  ["מַרַאכֵּז", "مراكز", "מרכזים", "יחיד: מַרְכַּז"],
  ["אַשְיַאא", "أشياء", "דברים / עניינים", "יחיד: אִשִי / שִי"],
  ["מֻכַּאלַמַאת", "مكالمات", "שיחות", "יחיד: מֻכַּאלַמֵה"],
  ["אַרְקַאם", "أرقام", "מספרים", "יחיד: רַקַם"],
  ["מַוַאצִ'יע", "مواضيع", "נושאים", "יחיד: מַוְצ'וּע"],
  ["אַוְצַ'אע", "أوضاع", "מצבים", "יחיד: וַצֵ'ע"],
  ["אַחְוַאל", "أحوال", "מצבים / מקרים", "יחיד: חַאל"],
];
const NOTES: [string, string][] = [
  ["לַאבֵּס", "ר: לַאבְּסִין · נ: לַאבְּסֵה, ר: לַאבְּסַאת"],
  ["עַארֵף", "ר: עַארְפִין · נ: עַארְפֵה, ר: עַארְפַאת"],
  ["שַאיֵף", "ר: שַאיְפִין · נ: שַאיְפֵה, ר: שַאיְפַאת"],
  ["מַאשִי", "ר: מַאשְיִין · נ: מַאשְיֵה, ר: מַאשְיַאת"],
  ["מַטְ'בּוּט", "ר: מַטְ'בּוּטִין · נ: מַטְ'בּוּטַה, ר: מַטְ'בּוּטַאת"],
  ["מַעְלַאַה", "בספר: מַעְלַקַה (ר: מַעַאלֵק)"],
  ["צַנְדוּא", "בספר: צַנְדוּק (ר: צַנַאדִיק)"],
  ["אַריבּ", "בספר: קַרִיבּ (ר: קַרַאיֵבּ)"],
  ["אַלְבּ", "בספר: קַלְבּ (ר: קְלוּבּ)"],
];
(async () => {
  const { data, error } = await sb.from("cards").insert(NEW.map(([tr, ar, he, note]) => ({
    translit_nikud: tr, arabic_script: ar, hebrew_meaning: he, item_type: tr.includes(" ") ? "phrase" : "word",
    notes: ["ספר המדרשה עמ׳ 79–80", note].filter(Boolean).join(" · "), lesson_id: L5, course_verified: true, chatifai_verified: true,
  }))).select("id");
  if (error) throw error;
  const { error: e2 } = await sb.from("card_srs").insert(data!.map((d) => ({ card_id: d.id, direction: "he_to_ar" })));
  if (e2) throw e2;
  console.log("✅", data!.length, "new cards");
  for (const [tr, add] of NOTES) {
    const { data: rows } = await sb.from("cards").select("id, notes").eq("translit_nikud", tr);
    if (!rows?.length) { console.log("– not found:", tr); continue; }
    for (const r of rows) {
      if ((r.notes ?? "").includes(add)) continue;
      await sb.from("cards").update({ notes: [r.notes, add].filter(Boolean).join(" · ") }).eq("id", r.id);
    }
    console.log("✅ note:", tr);
  }
})();
