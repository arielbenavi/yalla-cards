// Note 43226423: Ariel found "מילת עזר להווה מתמשך" sitting in the middle of
// the Hebrew translation line of Tisma'ani. That string is an explanation, not
// a gloss — عم marks the progressive and contributes no Hebrew word.
//
// The word is not removed: `word_index` in song_word_srs is positional, so
// dropping a word would silently re-point every later scheduling row at the
// wrong word. Only the text moves — `he` empties, `note` carries the grammar.
//
//   npx tsx scripts/fix-song-particle-gloss.ts
//   npx tsx scripts/fix-song-particle-gloss.ts --apply
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});
const APPLY = process.argv.includes("--apply");

/** A gloss slot holding a grammar lesson rather than a meaning. */
const EXPLANATION = /^(מילת|מילית)\s+עזר|הווה מתמשך|תחילית|סיומת|שם הפועל|בניין/;

async function main() {
  const { data, error } = await sb.from("songs").select("id,title,lyrics_parsed");
  if (error) throw error;

  let changed = 0;
  for (const song of data!) {
    const lines: any[] = Array.isArray(song.lyrics_parsed) ? song.lyrics_parsed : [];
    if (!lines.length) continue;
    let touched = false;

    for (const line of lines) {
      for (const w of line.words ?? []) {
        if (!w.he || !EXPLANATION.test(w.he.trim())) continue;
        console.log(`${song.title}: ${w.ar} — "${w.he}" → he:"" note:"${w.he}"`);
        w.note = w.he;
        w.he = "";
        touched = true;
        changed++;
      }
    }

    if (touched && APPLY) {
      const { error: e } = await sb.from("songs").update({ lyrics_parsed: lines }).eq("id", song.id);
      if (e) throw e;
    }
  }

  console.log(`\n${changed} glosses ${APPLY ? "moved to note" : "would move (dry run — add --apply)"}`);
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
