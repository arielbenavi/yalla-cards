import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

async function main() {
  const { data } = await sb
    .from('recordings')
    .select('id, title, storage_path, created_at, lesson_id')
    .is('title', null)
    .is('lesson_id', null)
    .order('created_at');
  
  for (const r of data ?? []) {
    console.log(`${r.id}\t${r.created_at}\t${r.storage_path}`);
  }
  console.log('\nTotal:', data?.length);
}

main();
