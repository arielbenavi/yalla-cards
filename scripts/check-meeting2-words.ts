import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false }, realtime: { transport: class {} as any } }
);

// strip nikud + apostrophes + geresh so ח'/ג'/ע' match ח/ג/ע in user input
const strip = (s: string) =>
  s.replace(/[֑-ׇ]/g, "").replace(/[׳'''`]/g, "").replace(/\s+/g, " ").trim();

async function main() {
  const { data } = await sb
    .from("cards")
    .select("translit_nikud, hebrew_meaning")
    .eq("item_type", "word")
    .eq("lesson_id", "5325a7b7-82e9-446c-ac41-d913690d52dd")
    .order("created_at");

  const dbWords = (data ?? []).map((c: any) => strip(c.translit_nikud));

  // rough match: does any db word contain any significant token of the query?
  const found = (query: string) => {
    const tokens = query.replace(/[׳׳]/g, "'").split(/[\s\-\/]+/).filter(t => t.length > 2);
    return dbWords.some(d => tokens.some(t => d.includes(t)));
  };

  const userItems: Array<{ word: string; meaning: string }> = [
    { word: "כיפאק אליום", meaning: "איך אתה היום" },
    { word: "ניח", meaning: "?" },
    { word: "כמל", meaning: "תשלים/תסיים/תמלא" },
    { word: "צעב", meaning: "קשה" },
    { word: "סהל", meaning: "קל" },
    { word: "חילו", meaning: "יפה/כל הכבוד/מתוק" },
    { word: "חאלי", meaning: "מצבי" },
    { word: "חאלי (דוד)", meaning: "דוד מצד אמא" },
    { word: "חאלה", meaning: "דודה מצד אמא" },
    { word: "ארגה", meaning: "?" },
    { word: "רגיעת", meaning: "חזרתי" },
    { word: "רוחמה", meaning: "לקחתי" },
    { word: "תרחיץ", meaning: "רישיון" },
    { word: "אחבאר", meaning: "חדשות" },
    { word: "חבר", meaning: "ידיעה" },
    { word: "וין כולת", meaning: "איפה היית?" },
    { word: "אלעטלה אלציפיה", meaning: "חופשת קיץ" },
    { word: "וילא ליסא", meaning: "או שעוד לא" },
    { word: "צח", meaning: "נכון" },
    { word: "שחס מועיין", meaning: "דמות מסוים" },
    { word: "שחס", meaning: "אישיות" },
    { word: "מומסל תלפיזיון", meaning: "שחקן טלויזיה" },
    { word: "חכ מעכ", meaning: "האמת איתך" },
    { word: "ברנמש", meaning: "תכנית" },
    { word: "פילם", meaning: "סרט" },
    { word: "איברני", meaning: "עברית" },
    { word: "חיאלי", meaning: "דמיוני" },
    { word: "חקיקי", meaning: "אמיתי" },
    { word: "אנא בערפש", meaning: "אני לא יודע" },
    { word: "מערוף", meaning: "מוכר/ידוע" },
    { word: "מית", meaning: "מת" },
    { word: "אביעד", meaning: "לבן" },
    { word: "שעב", meaning: "עם/אומה" },
    { word: "כל אלשעב בחיבו", meaning: "כל העם אוהב אותו" },
    { word: "פאקר", meaning: "חושב" },
    { word: "מורני", meaning: "זמר" },
    { word: "עקיד", meaning: "קצין" },
    { word: "וואלה מרה", meaning: "אף פעם" },
    { word: "אול מרה", meaning: "פעם ראשונה" },
    { word: "אנא אל עקל", meaning: "לפחות" },
    { word: "סיאסה", meaning: "פוליטיקה" },
    { word: "חרוף", meaning: "כבש" },
    { word: "ביזאנם", meaning: "מהמם" },
    { word: "מחלוטה", meaning: "ערבוב" },
    { word: "היואיה", meaning: "תחביב" },
    { word: "מע בעצ", meaning: "ביחד" },
    { word: "עבל אגיש", meaning: "לפני צבא" },
    { word: "פריק", meaning: "קבוצה" },
    { word: "אי", meaning: "איזה" },
    { word: "יפוז", meaning: "לנצח" },
    { word: "צראחה", meaning: "האמת/בכנות" },
    { word: "מנשאן", meaning: "מכיוון ש" },
    { word: "לעבה", meaning: "משחק" },
    { word: "אחכי לכ", meaning: "אני אגיד לך" },
    { word: "ביחכו", meaning: "הם מדברים" },
    { word: "מוהם", meaning: "חשוב" },
    { word: "אנא מחלק", meaning: "בנחת רוחך" },
    { word: "קרת סלה", meaning: "כדורסל" },
    { word: "בחב", meaning: "אני אוהב" },
    { word: "אחוה", meaning: "אחים" },
    { word: "בתחיב", meaning: "אתה אוהב" },
    { word: "הינדי", meaning: "הודי/מהודו" },
    { word: "חלץ אלדרס", meaning: "נגמר השיעור" },
    { word: "מבלול", meaning: "רטוב" },
    // extras from updated list
    { word: "סנא", meaning: "ביחד (נוסף)" },
    { word: "בתעלה", meaning: "?" },
    { word: "ביל ישראל ביל ברה", meaning: "בישראל או בחוץ" },
    { word: "כאן בדכ", meaning: "רצית?" },
    { word: "טניס", meaning: "טניס" },
    { word: "אכל אסיאוי", meaning: "אוכל אסייתי" },
    { word: "שו בתחיב תאכול", meaning: "מה אתה אוהב לאכול" },
    { word: "הודו עיזל", meaning: "?" },
    { word: "עילא ליקה", meaning: "להתראות (ספרותי)" },
    { word: "אלמבלול מא ביחאף", meaning: "פתגם: הרטוב לא מפחד מהגשם" },
    { word: "אישי שעב", meaning: "אהוב העם" },
    { word: "מן שופו תלפיזיון", meaning: "?" },
    { word: "אנא אל עקל מרה", meaning: "לפחות פעם אחת" },
  ];

  console.log(`\n=== DB HAS ${dbWords.length} WORD CARDS IN שיעור 2 ===\n`);
  const missing: string[] = [];
  for (const item of userItems) {
    const ok = found(item.word);
    if (!ok) missing.push(`  ✗ ${item.word} = ${item.meaning}`);
    else console.log(`  ✓ ${item.word}`);
  }
  if (missing.length) {
    console.log("\n=== MISSING / NOT FOUND ===");
    missing.forEach(m => console.log(m));
  } else {
    console.log("\nAll items found!");
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
