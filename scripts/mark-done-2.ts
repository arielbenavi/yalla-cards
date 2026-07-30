import { config } from 'dotenv'; config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
async function main() {
  const prefixes = ['8ef42245', 'b99156e7', 'a73604d0'];
  const { data } = await sb.from('notes').select('id, body').eq('status', 'open');
  const matches = (data ?? []).filter((n: {id: string}) => prefixes.some(p => n.id.startsWith(p)));
  for (const n of matches as {id: string; body: string}[]) {
    const { error } = await sb.from('notes').update({ status: 'done', updated_at: new Date().toISOString() }).eq('id', n.id);
    if (error) console.error('Error:', n.id, error.message);
    else console.log('✅ done:', n.id.slice(0,8), n.body.slice(0,60));
  }
}
main().catch((e: Error) => { console.error(e.message); process.exit(1); });
