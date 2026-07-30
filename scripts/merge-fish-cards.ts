/**
 * Merges "יש/אין" related cards into one card with slash alternatives.
 * Cards to merge:
 *   66a756e0 - "יש" / פִי (master — has state 2 SRS)
 *   6e937d97 - "ב.../יש" / פִי (duplicate, no SRS — delete)
 *   c720107c - "אין" / פִש (state 3, 3 reps — merge into master, delete)
 *   a0c775e1 - "אין" / מַאפִי (state 3, 3 reps — merge into master, delete)
 * Result: one card "יש / אין" / "פִי / פִש / מַאפִי" / "في / فش / ما في"
 */
import { config } from 'dotenv'; config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });

const MASTER_ID   = '66a756e0-7d1e-49cb-81d3-f0f180b04aec';
const DUPLICATE_ID = '6e937d97-4666-4d72-b03e-9cfcfdfd0aab';
const AIN1_ID     = 'c720107c-bcdc-42c2-811a-884141ad4a48';
const AIN2_ID     = 'a0c775e1-d3d7-44c8-b5e0-f239cf8e06bf';

async function main() {
  // 1. Update master card to consolidated form
  const { error: upErr } = await sb.from('cards').update({
    hebrew_meaning: 'יש / אין',
    translit_nikud: 'פִי / פִש / מַאפִי',
    arabic_script:  'في / فش / ما في',
  }).eq('id', MASTER_ID);
  if (upErr) { console.error('❌ update master:', upErr.message); return; }
  console.log('✅ Master card updated to "יש / אין" / "פִי / פִש / מַאפִי"');

  // 2. Delete card_srs rows for the cards being merged/deleted
  for (const cid of [DUPLICATE_ID, AIN1_ID, AIN2_ID]) {
    const { error } = await sb.from('card_srs').delete().eq('card_id', cid);
    if (error) console.warn('⚠  card_srs delete for', cid.slice(0,8), error.message);
    else console.log('✅ card_srs removed for', cid.slice(0,8));
  }

  // 3. Delete the cards being merged
  for (const cid of [DUPLICATE_ID, AIN1_ID, AIN2_ID]) {
    const { error } = await sb.from('cards').delete().eq('id', cid);
    if (error) console.warn('⚠  card delete for', cid.slice(0,8), error.message);
    else console.log('✅ card deleted:', cid.slice(0,8));
  }

  console.log('\nDone. One card now covers יש/אין with slash alternatives.');
}
main().catch((e: Error) => { console.error(e.message); process.exit(1); });
