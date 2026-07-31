import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

async function main() {
  const { data } = await sb
    .from('notes')
    .select('id, body, tag, status, created_at')
    .order('created_at', { ascending: false });
  
  for (const n of data ?? []) {
    console.log(`[${n.status}] ${n.id.slice(0,8)} | ${n.tag ?? '-'} | ${n.body.slice(0,80)}`);
  }
}

main();
