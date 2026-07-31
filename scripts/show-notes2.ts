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
    .select('id, body, status')
    .in('id', [
      'f1a00ef8-0000-0000-0000-000000000000',
      'e9fa3528-0000-0000-0000-000000000000',
      '114dafe0-0000-0000-0000-000000000000',
    ]);
  
  // fallback: get all and filter
  const { data: all } = await sb.from('notes').select('id, body, status');
  for (const n of all ?? []) {
    const prefixes = ['f1a00ef8', 'e9fa3528', '114dafe0'];
    if (prefixes.some(p => n.id.startsWith(p))) {
      console.log(`\n=== ${n.id} [${n.status}] ===\n${n.body}`);
    }
  }
}

main();
