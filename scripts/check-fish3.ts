import { config } from 'dotenv'; config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
async function main() {
  const ids = [
    '66a756e0-7d1e-49cb-81d3-f0f180b04aec', // יש פִי
    '6e937d97-4666-4d72-b03e-9cfcfdfd0aab', // ב.../יש פִי
    'c720107c-bcdc-42c2-811a-884141ad4a48', // אין פִש
    'a0c775e1-d3d7-44c8-b5e0-f239cf8e06bf', // אין מַאפִי
  ];
  const { data } = await sb.from('card_srs').select('id, card_id, direction, state, reps').in('card_id', ids);
  (data ?? []).forEach((r: {id: string; card_id: string; direction: string; state: number; reps: number}) => {
    console.log(r.card_id.slice(0,8), r.direction, 'state:', r.state, 'reps:', r.reps);
  });
}
main().catch((e: Error) => { console.error(e.message); process.exit(1); });
