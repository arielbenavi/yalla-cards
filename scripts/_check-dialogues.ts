import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });

async function main() {
  const { data, error } = await sb.from('paradigms').select('id, meeting, slug, data').order('meeting');
  if (error) { console.error(error); return; }
  for (const p of data ?? []) {
    console.log(`\n=== meeting ${p.meeting} | ${p.slug} ===`);
    console.log(JSON.stringify(p.data, null, 2));
  }
}
main().catch(e => { console.error(e); process.exit(1); });
