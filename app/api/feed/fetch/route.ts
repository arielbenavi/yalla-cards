import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { annotatePosts } from "@/lib/feed-annotate";
import { FEED_ACCOUNTS } from "@/lib/feed-accounts";

export const maxDuration = 300;

// Daily cron (vercel.json): new Arabic posts from FEED_ACCOUNTS through the official X API, one recent-search
// call with since_id so only new posts are paid for (pay-per-use, about $0.005 a post). Does nothing until
// X_BEARER_TOKEN is set in Vercel. Additive only: inserts feed_posts rows, never touches cards or FSRS.
export async function GET(request: NextRequest) {
  const cron = process.env.CRON_SECRET && request.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
  if (!cron && !(await isAdminRequest())) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const token = process.env.X_BEARER_TOKEN;
  if (!token) return NextResponse.json({ skipped: "X_BEARER_TOKEN not set" });

  const sb = supabaseAdmin();
  const { data: last } = await sb.from("feed_posts").select("post_id").eq("platform", "x").order("posted_at", { ascending: false }).limit(1);
  const params = new URLSearchParams({
    query: `(${FEED_ACCOUNTS.map((a) => `from:${a}`).join(" OR ")}) lang:ar -is:retweet -is:reply`,
    max_results: "100",
    "tweet.fields": "created_at,author_id,note_tweet",
    expansions: "author_id",
    "user.fields": "username,name",
  });
  if (last?.[0]) params.set("since_id", last[0].post_id);
  const res = await fetch(`https://api.x.com/2/tweets/search/recent?${params}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return NextResponse.json({ error: `X ${res.status}: ${(await res.text()).slice(0, 300)}` }, { status: 502 });
  type Tweet = { id: string; text: string; created_at: string; author_id: string; note_tweet?: { text: string } };
  const body = (await res.json()) as { data?: Tweet[]; includes?: { users?: { id: string; username: string; name: string }[] } };
  const users = new Map((body.includes?.users ?? []).map((u) => [u.id, u]));
  const tweets = (body.data ?? [])
    .map((t) => ({ ...t, text: (t.note_tweet?.text ?? t.text).replace(/https?:\S+/g, "").trim() }))
    .filter((t) => t.text.length >= 15);
  if (!tweets.length) return NextResponse.json({ inserted: 0 });

  let inserted = 0;
  for (let i = 0; i < tweets.length; i += 15) {
    const batch = tweets.slice(i, i + 15);
    const notes = await annotatePosts(batch.map((t) => t.text));
    const rows = batch.map((t, k) => {
      const u = users.get(t.author_id);
      return {
        platform: "x", post_id: t.id, author: u?.username ?? t.author_id, author_name: u?.name ?? null,
        url: `https://x.com/${u?.username ?? "i"}/status/${t.id}`, posted_at: t.created_at, ar: t.text,
        translit: notes[k].translit, he: notes[k].he, words: notes[k].words, hidden: !notes[k].dialect, source: "x api, gemini",
      };
    });
    const { error } = await sb.from("feed_posts").upsert(rows, { onConflict: "platform,post_id", ignoreDuplicates: true });
    if (error) return NextResponse.json({ error: error.message, inserted }, { status: 500 });
    inserted += rows.length;
  }
  return NextResponse.json({ inserted });
}
