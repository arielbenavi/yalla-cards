import { config } from 'dotenv'; config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
async function main() {
  const { data } = await sb.from('cards').select('id, hebrew_meaning, translit_nikud, arabic_script, notes')
    .in('id', ['66a756e0-0000-0000-0000-000000000000', 'c720107c-0000-0000-0000-000000000000'])
    .limit(5);
  // just get both fish cards by content search
  const { data: d2 } = await sb.from('cards').select('id, hebrew_meaning, translit_nikud, arabic_script, item_type, notes')
    .in('translit_nikud', ['פִי', 'פִש', 'פִיש', 'מַאפִי', 'מַאפִיש']);
  (d2 ?? []).forEach((c: {id: string; hebrew_meaning: string; translit_nikud: string; arabic_script: string|null; item_type: string; notes: string|null}) => {
    console.log(c.id, c.item_type.padEnd(8), JSON.stringify(c.hebrew_meaning), '/', c.translit_nikud, '/', c.arabic_script);
  });
}
main().catch((e: Error) => { console.error(e.message); process.exit(1); });
