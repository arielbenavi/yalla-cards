// 15.11: Hebrew meanings that gave the answer away. The hint moves to notes (shown after the flip).
// Old values are backed up in scripts/data/meaning-leaks-2026-11-15.json.
import { config } from "dotenv"; config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js"; import { writeFileSync } from "fs";
const s = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const NEW: Record<string, [string, string]> = {
  c38c921f: ["מה הכוונה (שלי)?", "נשמע אַצְדִי"],
  "674adadc": ["השקיע / משקיע", "נשמע אִסְתַסְמַר"],
  b6930cfd: ["תרבות", "נשמע תַקַאפֵה או סַקַאפֵה"],
  cf50bc58: ["אמא", "ברבים: אֻמַּהַאת"],
  "67d6ee22": ["אבא", "ברבים: אַאבַּאא"],
  "3a49ade2": ["דרכים", "יחיד: טַרִיק"],
  "07ea0fc7": ["יחידה, חתיכה", "חַבֵּת בַּנְדוֹרַה = עגבנייה אחת"],
  "83ddfb2b": ["עד ש... / כדי ש... (קיצור)", "קיצור של חַתַּא"],
  "662d4389": ["טוב (קיצור)", "קיצור של טַיֵּבּ"],
  "78bbba49": ["עכשיו (3 צורות)", "במקום הַלְקֵית"],
  "3ba1be5a": ["אני הייתי ביוון כמה פעמים", "באמירה: אחרי אַכַּם אומרים מִן"],
  d5ab742e: ["עוד חודש / עוד שנה / עוד דקה", "אפשר גם כַּמַאן"],
  "333ab1ab": ["מאיזו משפחה אתה?", "עונים: דַאר + שם המשפחה"],
  "39ceb603": ["אז... (מילת קישור)", "\"פַ... מה שרציתי להגיד\""],
  "16a32c9e": ["חדר כושר (מילולית חדר ברזל)", "יותר אומרים גִ'ים"],
  d5d34827: ["איפה אתה?", "וֵינְהַא, וֵינְכֹּם…"],
  "765f3236": ["תחנת דלק", "כמו כַּאזִיֵּה; מַחְרוּקַאת = דלקים"],
  a797129d: ["עייף, ישנוני", "תַעְבַּאן זה יותר לא מרגיש טוב"],
  "44883628": ["הלוואי שאתה... / הלוואי שאני...", "יַא רֵית מוטה לפי גופים"],
  "27672ab3": ["כדי, בשביל", "= עַשַאן"],
};
(async () => {
  const all: any[] = []; let f = 0;
  for (;;) { const { data } = await s.from("cards").select("id,hebrew_meaning,notes").range(f, f + 999); if (!data?.length) break; all.push(...data); f += 1000; }
  const hits = all.filter(c => NEW[c.id.slice(0, 8)]);
  writeFileSync("scripts/data/meaning-leaks-2026-11-15.json", JSON.stringify(hits, null, 1));
  for (const c of hits) {
    const [he, hint] = NEW[c.id.slice(0, 8)];
    const notes = [c.notes, hint].filter(Boolean).join("\n");
    const { error } = await s.from("cards").update({ hebrew_meaning: he, notes }).eq("id", c.id);
    if (error) throw error;
  }
  console.log("fixed", hits.length, "of", Object.keys(NEW).length);
})();
