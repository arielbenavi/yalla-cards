import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});
const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function main() {
  const { data: recs } = await sb
    .from('recordings')
    .select('id, created_at, transcript_json')
    .is('title', null)
    .is('lesson_id', null);

  for (const rec of recs ?? []) {
    const words = (rec.transcript_json as any)?.words as { word: string }[] | undefined;
    const date = new Date(rec.created_at).toLocaleDateString('he-IL');

    let title: string | null = null;

    if (words && words.length > 0) {
      try {
        const sample = words.slice(0, 80).map((w) => w.word).join(' ');
        const resp = await claude.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 60,
          messages: [{
            role: 'user',
            content: `זאת הקלטה של שיעור ערבית פלסטינית. הנה תמלול (בתעתיק עברי) של תחילת ההקלטה:\n"${sample}"\n\nכתוב כותרת קצרה בעברית (3–6 מילים) שמתארת על מה ההקלטה. רק הכותרת, ללא הסברים.`,
          }],
        });
        const t = resp.content[0].type === 'text' ? resp.content[0].text.trim() : null;
        if (t) title = t;
      } catch {
        // fall through to date fallback
      }
    }

    if (!title) title = `הקלטה ${date}`;

    const { error } = await sb.from('recordings').update({ title }).eq('id', rec.id);
    if (error) {
      console.error(`❌ ${rec.id}: ${error.message}`);
    } else {
      console.log(`✅ ${rec.id} → ${title}`);
    }
  }
  console.log('\nDone.');
}

main();
