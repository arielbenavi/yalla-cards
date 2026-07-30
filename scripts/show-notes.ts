import { config } from 'dotenv'; config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
async function main() {
  const { data } = await sb.from('notes').select('id, body, tag').eq('status', 'open').order('created_at', { ascending: false }).limit(25);
  (data ?? []).forEach((n: {id: string; body: string; tag: string|null}) => console.log(n.id.slice(0,8), '|', (n.tag || '-').padEnd(12), '|', n.body.slice(0,160)));
}
main().catch((e: Error) => { console.error(e.message); process.exit(1); });
