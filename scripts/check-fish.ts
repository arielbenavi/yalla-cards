import { config } from 'dotenv'; config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
async function main() {
  const { data } = await sb.from('cards').select('id, hebrew_meaning, translit_nikud, arabic_script, item_type, notes')
    .or('hebrew_meaning.ilike.%יש%,hebrew_meaning.ilike.%אין%,translit_nikud.ilike.%פיש%,translit_nikud.ilike.%מאפי%,translit_nikud.ilike.%מאפ%')
    .limit(20);
  (data ?? []).forEach((c: {id: string; hebrew_meaning: string; translit_nikud: string; arabic_script: string|null; item_type: string; notes: string|null}) => {
    console.log(c.id.slice(0,8), c.item_type.padEnd(8), JSON.stringify(c.hebrew_meaning).padEnd(20), c.translit_nikud.slice(0,40));
  });
}
main().catch((e: Error) => { console.error(e.message); process.exit(1); });
