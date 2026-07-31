import { config } from 'dotenv'; config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
async function main() {
  const { data } = await sb.from('songs').select('id, title, artist, youtube_url').order('created_at');
  (data ?? []).forEach((s: {id: string; title: string; artist: string; youtube_url: string|null}) =>
    console.log(`• ${s.title} — ${s.artist}`)
  );
  console.log(`\nTotal: ${(data ?? []).length}`);
}
main().catch((e: Error) => { console.error(e.message); process.exit(1); });
