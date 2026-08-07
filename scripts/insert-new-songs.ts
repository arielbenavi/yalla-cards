// Adds the songs Ariel supplied lyrics for (note efbd5595).
//
// Inserted with `lyrics_parsed: []`. The transliteration and word glosses come
// from chatifai in a separate pass — a song with raw lyrics and no parse is
// honestly incomplete, whereas a song parsed by guesswork is quietly wrong.
//
// `song_word_srs.word_index` is positional, so filling the parse later is only
// safe while a song has no review rows. A new song has none, which is why the
// two-step order is fine here and would not be for YAMA.
//
//   npx tsx scripts/insert-new-songs.ts          # dry run
//   npx tsx scripts/insert-new-songs.ts --apply
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { NEW_SONGS } from "./data/new-songs";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const APPLY = process.argv.includes("--apply");

const videoId = (url: string) => url.match(/[?&]v=([\w-]+)/)?.[1] ?? null;

async function main() {
  const { data: existing, error } = await sb.from("songs").select("title");
  if (error) throw error;
  const have = new Set((existing ?? []).map((s) => (s.title ?? "").trim()));

  const toAdd = NEW_SONGS.filter((s) => !have.has(s.title));
  console.log(`${NEW_SONGS.length} שירים · ${NEW_SONGS.length - toAdd.length} קיימים · ${toAdd.length} להוספה\n`);

  for (const s of toAdd) {
    const lines = s.lyrics_raw.split("\n").filter(Boolean).length;
    console.log(`  ${s.title} — ${s.artist} · ${lines} שורות`);
    console.log(`      ${s.dialect}`);
    if (s.note) console.log(`      ${s.note}`);
  }

  if (!APPLY) {
    console.log("\ndry run — הוסף --apply כדי לכתוב");
    return;
  }

  for (const s of toAdd) {
    const id = videoId(s.youtube_url);
    const { error: e } = await sb.from("songs").insert({
      title: s.title,
      artist: s.artist,
      lyrics_raw: s.lyrics_raw,
      lyrics_parsed: [],
      youtube_url: s.youtube_url || null,
      cover_url: id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : null,
    });
    if (e) throw e;
  }
  console.log(`\n✅ נוספו ${toAdd.length} שירים · lyrics_parsed ריק עד לתעתיק מ-chatifai`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
