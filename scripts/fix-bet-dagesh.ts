// ב in these columns is always ب, so it is always a b: every pointed word gets a dagesh in
// its ב (Ariel, 2026-11-05). A word with no nikud at all may be Hebrew, so it is listed and
// left alone. An Arabic shadda on ב becomes the Hebrew dagesh it stands for. The Arabic and
// FSRS are not touched. Old values go to scripts/data/bet-dagesh-before.json.
//   npx tsx scripts/fix-bet-dagesh.ts          # dry run
//   npx tsx scripts/fix-bet-dagesh.ts --apply
import { config } from "dotenv";
import { writeFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { fixBet } from "../lib/word-lookup";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const APPLY = process.argv.includes("--apply");
const MARKS = /[\u0591-\u05C7]/;
const fix = fixBet;

(async () => {
  const rows: { id: string; translit_nikud: string; plural_form: string | null; hebrew_meaning: string }[] = [];
  for (let f = 0; ; f += 1000) {
    const { data, error } = await sb.from("cards").select("id,translit_nikud,plural_form,hebrew_meaning").range(f, f + 999);
    if (error) throw error;
    rows.push(...(data as typeof rows));
    if (data!.length < 1000) break;
  }
  const changes = rows.flatMap((c) => {
    const translit_nikud = fix(c.translit_nikud);
    const plural_form = c.plural_form && fix(c.plural_form);
    return translit_nikud === c.translit_nikud && plural_form === c.plural_form ? [] : [{ id: c.id, before: c, translit_nikud, plural_form }];
  });
  const left = rows.filter((c) => c.translit_nikud.split(/\s+/).some((w) => /ב/.test(w) && !MARKS.test(w)));
  changes.slice(0, 40).forEach((c) => console.log(c.before.translit_nikud.slice(0, 40), "→", c.translit_nikud.slice(0, 40)));
  console.log(`${changes.length} of ${rows.length} cards change`);
  console.log(`left alone, a word with ב and no nikud (${left.length}):`);
  left.slice(0, 25).forEach((c) => console.log("  ", c.translit_nikud.slice(0, 60), "=", c.hebrew_meaning.slice(0, 24)));
  if (!APPLY) process.exit(0);
  writeFileSync("scripts/data/bet-dagesh-before.json", JSON.stringify(changes.map((c) => ({ id: c.id, translit_nikud: c.before.translit_nikud, plural_form: c.before.plural_form })), null, 1));
  for (const c of changes) {
    const { error } = await sb.from("cards").update({ translit_nikud: c.translit_nikud, plural_form: c.plural_form }).eq("id", c.id);
    if (error) throw error;
  }
  // The same for subtitle lines, which are read beside the cards
  const { data: segments, error: segError } = await sb.from("media_segments").select("id,translit");
  if (segError) throw segError;
  let lines = 0;
  for (const seg of segments ?? []) {
    const translit = seg.translit && fix(seg.translit);
    if (translit === seg.translit) continue;
    const { error } = await sb.from("media_segments").update({ translit }).eq("id", seg.id);
    if (error) throw error;
    lines++;
  }
  console.log(`✅ updated, and ${lines} subtitle lines`);
  process.exit(0);
})();
