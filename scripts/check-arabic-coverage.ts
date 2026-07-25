import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

async function main() {
  const { count: total } = await sb.from('cards').select('*', { count: 'exact', head: true }).eq('item_type', 'word');
  const { count: missing } = await sb.from('cards').select('*', { count: 'exact', head: true }).eq('item_type', 'word').is('arabic_script', null);
  console.log('Total words:', total);
  console.log('Missing arabic_script:', missing);
  console.log('Filled:', (total ?? 0) - (missing ?? 0));
}

main();
