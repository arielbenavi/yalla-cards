// The songs page already renders cover_url; every song just had it null while
// every song had a youtube_url. YouTube serves each video's own thumbnail at a
// predictable path, so no extra API, key or third-party image source is needed
// — and it is the artwork for the very video the card already links to.
//
// maxresdefault does not exist for every video, so each candidate is fetched
// and the first one that actually returns an image wins. YouTube answers a
// missing maxresdefault with a 120x90 grey placeholder rather than a 404, so
// the size is checked too.
//
//   npx tsx scripts/backfill-song-covers.ts          # dry run
//   npx tsx scripts/backfill-song-covers.ts --apply
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const APPLY = process.argv.includes("--apply");

/** Handles watch?v=, youtu.be/, /embed/ and /shorts/ forms. */
export function youtubeId(url: string | null): string | null {
  if (!url) return null;
  const patterns = [
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /\/embed\/([A-Za-z0-9_-]{11})/,
    /\/shorts\/([A-Za-z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

/** Best quality that actually exists for this video. */
async function bestThumbnail(id: string): Promise<string | null> {
  const candidates = [
    `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
    `https://img.youtube.com/vi/${id}/sddefault.jpg`,
    `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
  ];

  for (const url of candidates) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const len = Number(res.headers.get("content-length") ?? 0);
      // The grey "no thumbnail" placeholder is a couple of KB; real art is more
      if (len > 5_000) return url;
    } catch {
      // try the next size
    }
  }
  return null;
}

/** Spotify's oEmbed endpoint returns the album art without any key or client
 *  credentials, so a Spotify-linked song does not need the Web API. */
async function spotifyThumbnail(url: string): Promise<string | null> {
  try {
    const clean = url.split("?")[0];
    const res = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(clean)}`);
    if (!res.ok) return null;
    const data = (await res.json()) as { thumbnail_url?: string };
    return data.thumbnail_url ?? null;
  } catch {
    return null;
  }
}

async function main() {
  const { data: songs } = await sb
    .from("songs")
    .select("id, title, youtube_url, cover_url")
    .order("title");

  let found = 0;
  const updates: { id: string; title: string; cover_url: string }[] = [];

  for (const s of songs ?? []) {
    if (s.cover_url) {
      console.log(`  ⏭ ${String(s.title).padEnd(24)} כבר יש`);
      continue;
    }
    // The column is called youtube_url but at least one song holds a Spotify
    // link, so fall back to Spotify's cover art rather than skipping it
    const id = youtubeId(s.youtube_url);
    let url: string | null = null;
    let source = "";

    if (id) {
      url = await bestThumbnail(id);
      source = url ? url.split("/").pop()!.replace(".jpg", "") : "";
    } else if (s.youtube_url?.includes("open.spotify.com")) {
      url = await spotifyThumbnail(s.youtube_url);
      source = "spotify";
    }

    if (!url) {
      console.log(`  ✗ ${String(s.title).padEnd(24)} לא נמצאה עטיפה — ${s.youtube_url ?? "אין קישור"}`);
      continue;
    }
    console.log(`  ✓ ${String(s.title).padEnd(24)} ${source}`);
    updates.push({ id: s.id, title: s.title, cover_url: url });
    found++;
  }

  console.log(`\n${found} עטיפות נמצאו`);
  if (!APPLY) {
    console.log("dry run — pass --apply to write");
    return;
  }

  for (const u of updates) {
    const { error } = await sb.from("songs").update({ cover_url: u.cover_url }).eq("id", u.id);
    if (error) throw error;
  }
  console.log(`✅ ${updates.length} עודכנו`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
