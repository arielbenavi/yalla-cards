import { config } from 'dotenv'; config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
async function main() {
  const prefix = process.argv[2];
  const { data } = await sb.from('notes').select('id, body, tag').eq('status', 'open');
  const n = (data ?? []).find((n: {id: string}) => n.id.startsWith(prefix)) as {id: string; body: string; tag: string|null} | undefined;
  if (n) console.log(n.body); else console.log('not found');
}
main().catch((e: Error) => { console.error(e.message); process.exit(1); });
