/**
 * Inserts meeting 1 translation sentences as:
 * 1. A paradigm object (meeting=1, slug='sentences_translation')
 * 2. Individual sentence cards in שיעור 1
 * Transliterations verified by chatifai.
 * Run: npx tsx scripts/insert-meeting1-sentences.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false }, realtime: { transport: class {} as any } }
);

const LESSON_ID = "c835a437-60cc-421b-9c77-35e89905377a"; // שיעור 1

const sentences = [
  { num: 1,  he: "בוקר טוב יא מורה",                                           translit: "צַבַּאח (א)לְחֵ'יר יַא מְעַלֵּם",                                           ar: "صباح الخير يا معلم" },
  { num: 2,  he: "בוקר אור יא נסיך",                                            translit: "צַבַּאח (א)לְנּוּר יַא אַמִיר",                                             ar: "صباح النور يا أمير" },
  { num: 3,  he: "שלום רב יא מנהל בית הספר",                                    translit: "מַרְחַבַּא יַא מֻדִיר (א)לְמַדְרַסֵה",                                      ar: "مرحبا يا مدير المدرسة" },
  { num: 4,  he: "רב שלומות יא בעל הבית",                                       translit: "מַרְחַבְּתֵין יַא צַאחֵב (א)לְבֵּית",                                      ar: "مرحبتين يا صاحب البيت" },
  { num: 5,  he: "שלום וברכה יא תלמידים",                                       translit: "אַהְלַן וְסַהְלַן יַא תַלַאמִיז",                                          ar: "أهلا وسهلا يا تلاميذ" },
  { num: 6,  he: "שלום וברכה לך",                                               translit: "אַהְלַן וְסַהְלַן בִּיכּ",                                                 ar: "أهلا وسهلا بك" },
  { num: 7,  he: "אתם תלמידי בית ספר?",                                         translit: "אִנְתוּ תַלַאמִיז מַדְרַסֵה?",                                             ar: "إنتو تلاميذ مدرسة؟" },
  { num: 8,  he: "אתן סטודנטיות אוניברסיטה?",                                   translit: "אִנְתוּ טַאלִבַּאת גַ'אמְעַה?",                                            ar: "إنتو طالبات جامعة؟" },
  { num: 9,  he: "אתה האחראי?",                                                 translit: "אִנְתּ (א)לְמַעַלֵּם?",                                                   ar: "إنت المعلم؟" },
  { num: 10, he: "הוא מזכיר במשרד המשפטים",                                     translit: "הוּ סַכְּרְתֵּיר פִי וְזַארַת (א)לְעַדְל",                                 ar: "هو سكرتير في وزارة العدل" },
  { num: 11, he: "אתה בעל הבית?",                                               translit: "אִנְתּ צַאחֵב (א)לְדַּאר?",                                               ar: "إنت صاحب الدار؟" },
  { num: 12, he: "הם לא בני דוד (מצד אבא), הם בני דוד (מצד אמא)",              translit: "הֵם מֵשׁ וְלַאד עַם, הֵם וְלַאד חַ'אל",                                   ar: "هم مش ولاد عم، هم ولاد خال" },
  { num: 13, he: "את המנהלת בחברה?",                                            translit: "אִנְתִּי (א)לְמֻדִירֵה פִי (א)לְשִּרְכֵּה?",                              ar: "إنتي المديرة في الشركة؟" },
  { num: 14, he: "היא עורכת דין והיא בעלת החברה",                              translit: "הִיֵ מֻחַאמְיֵה וְהִיֵ צַאחְבֵּת (א)לְשִּרְכֵּה",                         ar: "هي محامية وهي صاحبة الشركة" },
  { num: 15, he: "קיר השירותים, עם חלון?",                                      translit: "חֵיט (א)לְחַמַּאם, מַע שֻׁבַּּאכּ?",                                      ar: "حيط الحمام، مع شباك؟" },
  { num: 16, he: "כוס קפה עם סוכר",                                             translit: "כַּאסֵת קַהְוֵה מַע סֻכַּּר",                                               ar: "كاسة قهوة مع سكر" },
  { num: 17, he: "המורים בהפסקה",                                               translit: "(א)לְמַעַלְּמִין בִּ(א)סְתִרַאחֵה",                                        ar: "المعلمين باستراحة" },
  { num: 18, he: "עט ועיפרון ומחברת וחוברת וספרים בתיק",                       translit: "קַלַם וְקַלַם רְצַאץ וְדַפְתַּר וְכֻּרַּאסֵה וְכֻּתֻבּ פִי שַׁנְטֵה",    ar: "قلم وقلم رصاص ودفتر وكراسة وكتب في شنطة" },
  { num: 19, he: "כיתה עם לוח וכסאות ושולחן",                                  translit: "צַף מַע לוֹח וְכַּרַאסִי וְטַאוְלֵה",                                      ar: "صف مع لوح وكراسي وطاولة" },
  { num: 20, he: "השם בדפי הספר",                                               translit: "(א)לְאִסֵם פִי וְרַאק (א)לְכִּתַּאב",                                      ar: "الاسم في وراق الكتاب" },
];

function strip(s: string) {
  return s.replace(/[֑-ׇ]/g, "").trim();
}

async function main() {
  // 1. Upsert paradigm object
  const paradigmData = {
    description: "פתרון משפטים לתרגום מעברית לערבית — מפגש 1",
    lines: sentences.map((s) => ({ num: s.num, he: s.he, translit: s.translit, ar: s.ar })),
  };

  const { error: pErr } = await sb
    .from("paradigms")
    .upsert({ meeting: 1, slug: "sentences_translation", data: paradigmData }, { onConflict: "meeting,slug" });
  if (pErr) { console.error("paradigm upsert error:", pErr); return; }
  console.log("✓ paradigm upserted (meeting=1, slug=sentences_translation)");

  // 2. Check existing sentences to avoid duplicates
  const { data: existing } = await sb
    .from("cards")
    .select("translit_nikud")
    .eq("item_type", "sentence")
    .eq("lesson_id", LESSON_ID);

  const existingSet = new Set((existing ?? []).map((c: any) => strip(c.translit_nikud)));

  const toInsert = sentences
    .filter((s) => !existingSet.has(strip(s.translit)))
    .map((s) => ({
      lesson_id: LESSON_ID,
      hebrew_meaning: s.he,
      translit_nikud: s.translit,
      arabic_script: s.ar,
      item_type: "sentence",
      chatifai_verified: true,
    }));

  if (toInsert.length === 0) {
    console.log("no new sentence cards to insert (all already exist)");
    return;
  }

  const { data, error: cErr } = await sb.from("cards").insert(toInsert).select("id");
  if (cErr) { console.error("cards insert error:", cErr); return; }
  console.log(`✓ inserted ${data?.length} sentence cards`);
  for (const s of sentences) {
    const exists = existingSet.has(strip(s.translit));
    console.log(`  ${exists ? "skip" : "NEW "} ${s.num}. ${s.he}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
