import { config } from 'dotenv'; config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
async function main() {
  const { data } = await sb.from('songs').select('title, artist, lyrics_parsed').order('created_at').limit(3);
  for (const s of data ?? []) {
    console.log(`\n=== ${s.title} ===`);
    const lines = (s.lyrics_parsed ?? []).slice(0, 3);
    console.log(JSON.stringify(lines, null, 2));
  }
}
main().catch((e: Error) => { console.error(e.message); process.exit(1); });
