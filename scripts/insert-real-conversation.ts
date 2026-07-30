/**
 * Inserts "שיחה אמיתית" real conversation phrases (verified by chatifai).
 * Creates a new lesson and inserts 10 cards.
 * Run: npx tsx scripts/insert-real-conversation.ts
 */
import { config } from 'dotenv'; config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });

const LESSON_DATE = '2026-07-30';
const LESSON_TITLE = 'שיחה אמיתית';

const cards = [
  { hebrew_meaning: 'אני לומד ערבית', translit_nikud: 'אַנַא בַּתְעַלַּם עַרַבִּי', arabic_script: 'أنا بتعلم عربي', item_type: 'sentence' },
  { hebrew_meaning: 'אני ישראלי', translit_nikud: 'אַנַא אִסְרַאאִילִי', arabic_script: 'أنا إسرائيلي', item_type: 'phrase' },
  { hebrew_meaning: 'נעים להכיר / שמחים להכיר', translit_nikud: 'תְשַרַּפְנַא', arabic_script: 'تشرفنا', item_type: 'phrase' },
  { hebrew_meaning: 'מה שמך?', translit_nikud: 'שׁוּ אִסְמַכּ? / שׁוּ אִסְמֵכּ?', arabic_script: 'شو اسمك؟', item_type: 'phrase', notes: 'לגבר: אִסְמַכּ | לאישה: אִסְמֵכּ' },
  { hebrew_meaning: 'יש לי חבר ערבי', translit_nikud: 'פִי עִנְדִי צַאחֵבּ עַרַבִּי', arabic_script: 'في عندي صاحب عربي', item_type: 'sentence' },
  { hebrew_meaning: 'אני מנסה לדבר ערבית', translit_nikud: 'אַנַא בַּחַאוֵל אַחְכִּי עַרַבִּי', arabic_script: 'أنا بحاول أحكي عربي', item_type: 'sentence' },
  { hebrew_meaning: 'סלח לי, לא הבנתי', translit_nikud: 'אִסְמַחְלִי, מַא פְהִמְתֵש', arabic_script: 'اسمح لي، ما فهمتش', item_type: 'phrase' },
  { hebrew_meaning: 'תדבר לאט לאט בבקשה', translit_nikud: 'אִחְכִּי שְׁוַיְ שְׁוַיְ לַוְ סַמַחְת', arabic_script: 'احكي شوي شوي لو سمحت', item_type: 'phrase' },
  { hebrew_meaning: 'איך אומרים ___ בערבית?', translit_nikud: 'כִּיף בִּיאוּלוּ ___ בִּ(א)לְעַרַבִּי?', arabic_script: 'كيف بيقولوا ___ بالعربي؟', item_type: 'phrase' },
  { hebrew_meaning: 'אני מבין קצת ערבית', translit_nikud: 'בַּפְהַם עַרַבִּי שְׁוַיְ', arabic_script: 'بفهم عربي شوي', item_type: 'sentence' },
];

async function main() {
  // Create lesson
  const { data: lesson, error: lessonErr } = await sb
    .from('lessons')
    .insert({ date: LESSON_DATE, title: LESSON_TITLE })
    .select()
    .single();
  if (lessonErr) { console.error('❌ lesson:', lessonErr.message); return; }
  console.log('✅ Created lesson:', lesson.id, LESSON_TITLE);

  // Insert cards
  const toInsert = cards.map((c) => ({
    lesson_id: lesson.id,
    hebrew_meaning: c.hebrew_meaning,
    translit_nikud: c.translit_nikud,
    arabic_script: c.arabic_script,
    item_type: c.item_type,
    notes: ('notes' in c ? c.notes : undefined) ?? null,
    plural_form: null,
    chatifai_verified: true,
  }));

  const { data: inserted, error: cardErr } = await sb.from('cards').insert(toInsert).select('id, hebrew_meaning');
  if (cardErr) { console.error('❌ cards:', cardErr.message); return; }
  console.log(`✅ Inserted ${inserted!.length} cards`);

  // Insert card_srs rows
  const srsRows = inserted!.map((c: { id: string }) => ({ card_id: c.id, direction: 'he_to_ar' }));
  const { error: srsErr } = await sb.from('card_srs').insert(srsRows);
  if (srsErr) console.warn('⚠  card_srs:', srsErr.message);
  else console.log(`✅ ${srsRows.length} card_srs rows created`);

  inserted!.forEach((c: { id: string; hebrew_meaning: string }) => console.log('  •', c.hebrew_meaning));
}
main().catch((e: Error) => { console.error(e.message); process.exit(1); });
