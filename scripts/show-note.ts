import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

async function main() {
  const ids = ['f1a00ef8', 'e9fa3528', '114dafe0'];
  for (const prefix of ids) {
    const { data } = await sb.from('notes').select('id, body, status').like('id', `${prefix}%`);
    for (const n of data ?? []) {
      console.log(`\n=== ${n.id} [${n.status}] ===\n${n.body}`);
    }
  }
}

main();
