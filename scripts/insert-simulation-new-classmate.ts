// Conversation situation: meeting a new student between classes — what you
// study, which year, where from, where you live, courses and lecturers, and
// swapping numbers. Requested by Ariel on 2026-10-21.
//
// Every line is chatifai's (2026-10-21), asked for an authentic Palestinian
// student dialogue in this exact shape. Nothing here was composed or "fixed":
// T5's transliteration has הַלַא where its Arabic has هلقيت, and both are kept
// as chatifai gave them. The only edits are two Hebrew typos in the glosses
// (T9 "לקחת" → "לקחתי", T10 "תצריך" → "תצטרך").
//
// Picked up by /api/dialogues and the daily checklist through the simulation_
// slug; no code change needed.
//
//   npx tsx scripts/insert-simulation-new-classmate.ts
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

type Line = { he: string; translit: string; ar: string };
type Turn = ({ speaker: "user" | "other" } & Line) | { speaker: "user"; options: Line[] };

const data: {
  scenario: string;
  setting: string;
  user_role: string;
  other_role: string;
  verified_at: string;
  chatifai_verified: boolean;
  verification_note: string;
  turns: Turn[];
  vocab: { he: string; meaning: string }[];
} = {
  scenario: "היכרות בין סטודנטים בקמפוס",
  setting: "רחבת האוניברסיטה בהפסקה בין שיעורים",
  user_role: "סטודנט ותיק",
  other_role: "סטודנט חדש",
  verified_at: "2026-10-21",
  chatifai_verified: true,
  verification_note: "chatifai כתב את כל הדיאלוג — כל שורה כפי שהדפיס.",
  turns: [
    { speaker: "other", he: "שלום, אפשר לשבת פה?", translit: "מַרְחַבַּא, מֻמְכֵּן אַקְעֹד הוֹן?", ar: "مرحبا، ممكن أقعد هون؟" },
    { speaker: "user", he: "אהלן, בטח, תתפדל. אתה סטודנט חדש פה?", translit: "אַהְלַן, אַכִּיד, תְפַצַּ'ל. אִנְתֵ טַאלֵבּ גְ'דִיד הוֹן?", ar: "أهلاً، أكيد، تفضل. إنت طالب جديد هون؟" },
    { speaker: "other", he: "כן, זה היום הראשון שלי. אני מוחמד, לומד הנדסה. ואתה?", translit: "אַיְוַה, הַאדַא אַוַל יוֹם אִלִי. אַנַא מֻחַמַד, בַּדְרֹס הַנְדַסֵה. וְאִנְתֵ?", ar: "أيوه، هادا أول يوم إلي. أنا محمد، بدرس هندسة. وإنت؟" },
    { speaker: "user", he: "נעים מאוד, אני אמיר. אני שנה שלישית כלכלה. מאיפה אתה במקור?", translit: "פֻרְצַה סַעִידֵה, אַנַא אַמִיר. אַנַא סַנֵה תַאלְתֵה אִקְתִצַ'אד. מְנֵין אַצְלַכּ?", ar: "فرصة سعيدة، أنا أمير. أنا سنة تالتة اقتصاد. منين أصلك؟" },
    { speaker: "other", he: "אני במקור משכם, אבל עכשיו אני גר פה במעונות. איפה אתה גר?", translit: "אַנַא אַצְלִי מִנְ נַאבְּלֻס, בַּס הַלַא סַאכֵּן הוֹן בִּי(א)לְסַכַּן. וֵין אִנְתֵ סַאכֵּן?", ar: "أنا أصلي من نابلس، بس هلقيت ساكن هون بالسكن. وين إنت ساكن؟" },
    {
      speaker: "user",
      options: [
        { he: "אני מקומי, גר עם המשפחה פה קרוב.", translit: "אַנַא מִנְ הַ(א)לְבַּלַד, סַאכֵּן מַעִ (א)לְעֵילֵה הוֹן קַרִיבּ.", ar: "أنا من البلد، ساكن مع العيلة هون قريب." },
        { he: "אני גם גר במעונות, בבניין השני.", translit: "אַנַא כַּמַאן סַאכֵּן בִּי(א)לְסַכַּן, בִּי(א)לְעַמַארַה (אל)תַּאנְיֵה.", ar: "أنا كمان ساكن بالسكن، بالعمارة التانية." },
      ],
    },
    { speaker: "other", he: "יפה. תגיד, איך המרצים פה? יש לי עכשיו שיעור עם דוקטור חאלד.", translit: "חִלְוּ. קוּלְלִי, כִּיפ (א)לִמְעַלְמִין הוֹן? עִנְדִי הַלַא דַרְס מַע דֻכְּתוֹר חַ'אלֵד.", ar: "حلو. قلي، كيف المعلمين هون؟ عندي هلقيت درس مع دكتور خالد." },
    { speaker: "user", he: "דוקטור חאלד מצוין אבל קצת קשוח. איזה עוד קורסים לקחת?", translit: "דֻכְּתוֹר חַ'אלֵד מֻמְתַאז בַּס שְוַיְ שְדִיד. אֵיש כַּמַאן דַוְרַאת אַחַ'דְת?", ar: "دكتور خالد ممتاز بس شوي شديد. ايش كمان دورات أخذت؟" },
    { speaker: "other", he: "לקחתי מתמטיקה ואנגלית. האמת, אני קצת לחוץ מהלימודים.", translit: "אַחַ'דְת רִיַאצִ'יַאת וְאִנְגְ'לִיזִי. אִלְמַטְ'בּוּט, אַנַא שְוַיְ מַצְ'עוּט מִנִ (אל)דִּרַאֺסֵה.", ar: "أخذت رياضيات وإنجليزي. المظبوط، أنا شوي مضغوط من الدراسة." },
    { speaker: "user", he: "אל תדאג, הכל יהיה בסדר. אם תצטרך עזרה, אני פה.", translit: "מַא תִקְלַקְש, כֻּל שִי בִּיצִיר תַמַאם. אִזַא לַאזְמַכּ מֻסַאעַדֵה, אַנַא הוֹן.", ar: "ما تقلقش، كل شي بيصير تمام. إذا لازمك مساعدة، أنا هون." },
    { speaker: "other", he: "תודה אחי, מעריך את זה. אפשר לקחת את המספר שלך?", translit: "תִסְלַם יַא ח'וּי, מְקַדֵּר הַאדַא. מֻמְכֵּן אַאחֹ'ד רַקַמַכּ?", ar: "تسلم يا خوي، مقدر هادا. ممكن آخذ رقمك؟" },
    { speaker: "user", he: "בטח, תרשום: 05... יאללה, בוא נשב לקפה אחרי השיעור.", translit: "אַכִּיד, סַגֵּ'ל: צִפֵר חַ'מְסֵה... יַאללַה, תַעַאל נִקְעֹד עַ-כַּאסֵת קַהְוֵה בַּעַדִ (אל)דַּרְס.", ar: "أكيد، سجل: صفر خمسة... ياللا، تعال نقعد ع كاسة قهوة بعد الدرس." },
  ],
  vocab: [
    { he: "הַלַּא / הַלְקֵית", meaning: "עכשיו" },
    { he: "סַכַּן", meaning: "מעונות (סטודנטים)" },
    { he: "מַצְ'עוּט", meaning: "לחוץ" },
    { he: "מֻמְתַאז", meaning: "מצוין" },
    { he: "שְדִיד", meaning: "קשוח / חזק" },
    { he: "מַא תִקְלַקְש", meaning: "אל תדאג" },
    { he: "לַאזְמַכּ", meaning: "אתה צריך / דרוש לך" },
    { he: "פֻרְצַה סַעִידֵה", meaning: "נעים מאוד (מילולית: הזדמנות מאושרת)" },
  ],
};

async function main() {
  const { error } = await sb
    .from("paradigms")
    .upsert({ meeting: 0, slug: "simulation_new_classmate", data }, { onConflict: "meeting,slug" });
  if (error) throw error;
  console.log(`✓ simulation_new_classmate — ${data.turns.length} turns, ${data.vocab.length} words`);
}
main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
