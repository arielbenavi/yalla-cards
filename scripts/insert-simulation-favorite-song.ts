// Conversation situation: a song you like comes on in a friend's car. It's good, turn it up,
// what's it called, who sings it, play it again, send it to me. Requested by Ariel on 2026-11-05.
//
// chatifai is down, so the lines are mine, a draft: the normal list hides it and /simulate shows
// it labelled as unchecked. After chatifai has checked it, set chatifai_verified and drop draft.
// The pointing follows the deck where the deck has the word (אֻעְ'נִיֵה, מֻעַ'נִּי, צוֹת, כְּתִיר).
// אִיַּאהַא is the form from the oral meeting of 4.11.26.
//
//   npx tsx scripts/insert-simulation-favorite-song.ts
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const data = {
  scenario: "שיר שאני אוהב",
  setting: "באוטו של חבר, ברדיו מתחיל שיר",
  user_role: "נוסע",
  other_role: "חבר שנוהג",
  chatifai_verified: false,
  draft: true,
  verification_note: "טיוטה: כתבתי את השורות כי chatifai למטה. עדיין לא נבדקה.",
  turns: [
    { speaker: "user", he: "וואו, זה שיר ממש טוב! תגביר.", translit: "יַא סַלַאם, הַאי אֻעְ'נִיֵה חִלְוֵה כְּתִיר! עַלִּי (אל)צּוֹת.", ar: "يا سلام، هاي أغنية حلوة كتير! علّي الصوت." },
    { speaker: "other", he: "בכיף. אהבת?", translit: "תִכְּרַם. עַגַ'בַּתַכּ?", ar: "تكرم. عجبتك؟" },
    { speaker: "user", he: "מאוד! איך קוראים לשיר הזה?", translit: "כְּתִיר! שוּ אִסְם הַ(א)לְאֻעְ'נִיֵה?", ar: "كتير! شو اسم هالأغنية؟" },
    { speaker: "other", he: "קוראים לו ״תמלי מעאכ״.", translit: "אִסְמְהַא ״תַמַלִּי מַעַאכּ״.", ar: "اسمها «تملّي معاك»." },
    { speaker: "user", he: "ומי שר אותו?", translit: "וּמִין בִּעַ'נִּיהַא?", ar: "ومين بغنيها؟" },
    { speaker: "other", he: "עמרו דיאב. אתה מכיר אותו?", translit: "עַמְר דִיַאבּ. בְּתַעְרְפוֹ?", ar: "عمرو دياب. بتعرفه؟" },
    {
      speaker: "user",
      options: [
        { he: "כן בטח, אני אוהב אותו מאוד.", translit: "אַאה טַבְּעַן, בַּחִבּוֹ כְּתִיר.", ar: "آه طبعاً، بحبه كتير." },
        { he: "לא, פעם ראשונה שאני שומע אותו.", translit: "לַאא, אַוַּל מַרַּה בַּסְמַעוֹ.", ar: "لأ، أول مرة بسمعه." },
      ],
    },
    { speaker: "other", he: "הוא מצרי, אבל כולם אוהבים אותו. יש לו קול יפה, נכון?", translit: "הֻוֵּ מַצְרִי, בַּס כֻּלּ (א)לְעַאלַם בִּחִבּוֹ. צוֹתוֹ חִלוּ, צַחּ?", ar: "هو مصري، بس كل العالم بحبه. صوته حلو، صح؟" },
    { speaker: "user", he: "הקול שלו יפה, וגם המילים. תחזיר אותו עוד פעם.", translit: "צוֹתוֹ חִלוּ, וִ(א)לְכַּלִמַאת כַּמַאן. רַגִּ'עְהַא כַּמַאן מַרַּה.", ar: "صوته حلو، والكلمات كمان. رجّعها كمان مرة." },
    { speaker: "other", he: "אין בעיה. רוצה שאשלח לך אותו?", translit: "מַאשִי. בִּדַּכּ אַבְּעַתְלַכּ אִיַּאהַא?", ar: "ماشي. بدك أبعتلك إياها؟" },
    { speaker: "user", he: "כן, תשלח לי אותו, בבקשה.", translit: "אַאה, אִבְּעַתְלִי אִיַּאהַא, אַללַּה יְחַ'לִּיכּ.", ar: "آه، ابعتلي إياها، الله يخليك." },
    { speaker: "other", he: "בסדר, שלחתי לך אותו בווטסאפ.", translit: "תַמַאם, בַּעַתְלַכּ אִיַּאהַא עַ (א)לְוַאטְסַאבּ.", ar: "تمام، بعتلك إياها عالواتساب." },
  ],
  vocab: [
    { he: "אֻעְ'נִיֵה", meaning: "שיר (בערבית נקבה: אִסְמְהַא, בִּעַ'נִּיהַא)" },
    { he: "עַלִּי (אל)צּוֹת", meaning: "תגביר" },
    { he: "וַטִּי (אל)צּוֹת", meaning: "תנמיך" },
    { he: "מִין בִּתְעַ'נִּיהַא?", meaning: "מי שרה אותו? (זמרת)" },
    { he: "מֻעַ'נִּי / מֻעַ'נִּיֵה", meaning: "זמר / זמרת" },
    { he: "(א)לְכַּלִמַאת", meaning: "המילים" },
    { he: "רַגִּ'עְהַא", meaning: "תחזיר אותו (את השיר)" },
  ],
};

async function main() {
  const { error } = await sb
    .from("paradigms")
    .upsert({ meeting: 0, slug: "simulation_favorite_song", data }, { onConflict: "meeting,slug" });
  if (error) throw error;
  const { error: noteError } = await sb.from("notes").insert({
    tag: "cards",
    body: "chatifai: לבדוק את הסיטואציה ״שיר שאני אוהב״ (scripts/insert-simulation-favorite-song.ts), טיוטה שכתבתי כשהוא למטה. אחרי הבדיקה: chatifai_verified=true ולהוריד draft, ואז היא תוצע גם ברשימה היומית.",
  });
  if (noteError) throw noteError;
  console.log(`✓ simulation_favorite_song — ${data.turns.length} turns, ${data.vocab.length} words`);
}
main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
