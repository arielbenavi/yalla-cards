/**
 * Add פנאן vocab and greeting phrase cards for שיעור 3.
 * Run: npx tsx scripts/add-greeting-cards.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false }, realtime: { transport: class {} as any } }
);

async function main() {
  const { data: lesson } = await supabase.from("lessons").select("id").eq("title", "שיעור 3").maybeSingle();
  if (!lesson) { console.error("שיעור 3 not found"); process.exit(1); }

  const { data: existing } = await supabase.from("cards").select("translit_nikud, hebrew_meaning");
  const existingKeys = new Set(
    (existing ?? []).map((c: { translit_nikud: string; hebrew_meaning: string }) =>
      `${c.translit_nikud.replace(/[ְ-ׇֽֿׁׂׅׄ]/g, "")}__${c.hebrew_meaning}`
    )
  );

  const cards = [
    { translit_nikud: "פַנַּאן", hebrew_meaning: "אומן (זכר)", item_type: "word", notes: "יא פנאן! = יא אומן!" },
    { translit_nikud: "פַנַּאנֵה", hebrew_meaning: "אומנית (נקבה)", item_type: "word", notes: null },
    { translit_nikud: "מַרְחַבַּא – שׁוּ אִלְאַח'בַּאר?", hebrew_meaning: "שלום – מה החדשות?", item_type: "phrase", notes: "פתיחת שיחה נפוצה עם כל אחד (מוכר, שכן, מכר)" },
    { translit_nikud: "כִּיפַכּ? אִנְשַׁאלַּה מַבְּסוּט?", hebrew_meaning: "מה שלומך? מקווה שאתה מבסוט?", item_type: "phrase", notes: "ברכה חמה — מראה עניין אמיתי בשלומו" },
    { translit_nikud: "שׁוּ אִלְוַצ'ע?", hebrew_meaning: "מה המצב?", item_type: "phrase", notes: "להג רחוב קלאסי, נפוץ בין צעירים בחוץ ובבית קפה" },
    { translit_nikud: "שׁוּ פִי מַא פִי?", hebrew_meaning: "מה יש מה אין?", item_type: "phrase", notes: "ביטוי סלנגי (כמו \"מה הולך?\") — עם חברים לבדוק עדכונים" },
    { translit_nikud: "שׁוּ יַא וַחְשׁ?", hebrew_meaning: "מה יא מפלצת?", item_type: "phrase", notes: "רמת חברים קרובים — וחש = מחמאה לחבר חזק/תותח" },
    { translit_nikud: "שׁוּ יַא זַלַמֵה?", hebrew_meaning: "מה יא גבר?", item_type: "phrase", notes: "זלמה = הדרך הנפוצה לפנות לגבר ברחוב" },
  ];

  let inserted = 0, skipped = 0;
  for (const card of cards) {
    const key = `${card.translit_nikud.replace(/[ְ-ׇֽֿׁׂׅׄ]/g, "")}__${card.hebrew_meaning}`;
    if (existingKeys.has(key)) { console.log("SKIP:", card.translit_nikud); skipped++; continue; }

    const { data, error } = await supabase
      .from("cards")
      .insert({
        lesson_id: lesson.id,
        translit_nikud: card.translit_nikud,
        hebrew_meaning: card.hebrew_meaning,
        arabic_script: null,
        item_type: card.item_type,
        notes: card.notes ?? null,
      })
      .select("id")
      .single();

    if (error || !data) { console.error("ERROR:", card.translit_nikud, error?.message); continue; }
    await supabase.from("card_srs").insert({ card_id: data.id, direction: "he_to_ar" });
    existingKeys.add(key);
    console.log("INSERT:", card.translit_nikud);
    inserted++;
  }
  console.log(`\nInserted: ${inserted}, Skipped: ${skipped}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
