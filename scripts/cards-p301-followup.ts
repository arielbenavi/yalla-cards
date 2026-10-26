// Book p. 301 (מפגש 5 answers 12–20), follow-up (2026-10-26): forms from those
// sentences that still had no card — book pointing, lines already checked by chatifai.
// Also removes the duplicate מַלַאן added the day before (never reviewed); the July
// card for it stays and gets the page reference.
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const ASKED = "825ef0fe-f683-48ee-9bb5-3cfaa5913282";
const C: [string, string, string, string?][] = [
  ["בַּנַאת", "بنات", "בנות", "יחיד: בִּנְת"],
  ["בֵּלֵפוֹנוֹ", "بيلفونه", "הפלאפון שלו", "רַקַם בֵּלֵפוֹנוֹ = מספר הפלאפון שלו"],
  ["מַא עִנְדְהַאש", "ما عندهاش", "אין לה", "הִיֵּ מַא עִנְדְהַאש וְלַאד = אין לה ילדים"],
  ["מַעִנְדֵכְּש", "ما عندكيش", "אין לך (לאישה)", "לגבר: מַא עִנְדַכְּש"],
  ["צַנַאדִיק", "صناديق", "תיבות / קופות", "יחיד: צַנְדוּק (בעירונית: צַנְדוּא)"],
];
(async () => {
  const dup = "aeb3b3f4-b788-493b-8381-2854299f4903";
  await sb.from("card_srs").delete().eq("card_id", dup);
  const { error: d } = await sb.from("cards").delete().eq("id", dup);
  if (d) throw d;
  await sb.from("cards").update({ notes: "ספר המדרשה עמ׳ 301 · אִ(ל)גֻּ'זְדַאן מַלַאן מַצַארִי = הארנק מלא כסף" }).eq("id", "49a23d62-5c06-4355-b6b0-7d7b8c63e150");
  console.log("✅ duplicate מַלַאן removed");
  const { data, error } = await sb.from("cards").insert(C.map(([tr, ar, he, note]) => ({
    translit_nikud: tr, arabic_script: ar, hebrew_meaning: he, item_type: tr.includes(" ") ? "phrase" : "word",
    notes: ["ספר המדרשה עמ׳ 301", note].filter(Boolean).join(" · "), lesson_id: ASKED, course_verified: true, chatifai_verified: true,
  }))).select("id");
  if (error) throw error;
  const { error: e2 } = await sb.from("card_srs").insert(data!.map((x) => ({ card_id: x.id, direction: "he_to_ar" })));
  if (e2) throw e2;
  console.log("✅", data!.length, "cards");
})();
