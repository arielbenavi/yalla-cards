/**
 * Loads posts from a seed file into feed_posts, with automatic transliteration and meanings (lib/feed-annotate).
 *   npx tsx scripts/feed-seed.ts scripts/data/feed-seed-2026-11-08.json          # dry run, prints 3
 *   npx tsx scripts/feed-seed.ts scripts/data/feed-seed-2026-11-08.json --apply
 * Safe to rerun: posts already in the table are skipped. Additive only.
 */
import { config } from "dotenv";
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { annotatePosts } from "../lib/feed-annotate";
config({ path: ".env.local" });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });
const APPLY = process.argv.includes("--apply");

(async () => {
  const seed = JSON.parse(readFileSync(process.argv[2], "utf8")) as { names: Record<string, string>; posts: [string, string, string, string][] };
  const { data: have } = await sb.from("feed_posts").select("post_id").eq("platform", "x");
  const known = new Set((have ?? []).map((r) => r.post_id));
  const todo = seed.posts.filter(([id]) => !known.has(id));
  console.log(`${todo.length} new of ${seed.posts.length}`);
  for (let i = 0; i < todo.length; i += 15) {
    const batch = todo.slice(i, i + 15);
    const notes = await annotatePosts(batch.map((p) => p[3]));
    const rows = batch.map(([post_id, author, posted_at, ar], k) => ({
      platform: "x", post_id, author, author_name: seed.names[author] ?? author, url: `https://x.com/${author}/status/${post_id}`,
      posted_at, ar, translit: notes[k].translit, he: notes[k].he, words: notes[k].words, hidden: !notes[k].dialect,
      source: `seed ${process.argv[2].split("/").pop()}, gemini`,
    }));
    if (!APPLY) { console.log(JSON.stringify(rows.slice(0, 3), null, 1)); return; }
    const { error } = await sb.from("feed_posts").insert(rows);
    if (error) throw error;
    console.log(`  inserted ${i + rows.length}`);
  }
})();
