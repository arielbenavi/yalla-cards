import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// The posts for /feed, newest first. Mostly-literary posts are hidden unless ?all=1. Read only.
export async function GET(request: NextRequest) {
  const all = request.nextUrl.searchParams.get("all") === "1";
  let q = supabaseAdmin()
    .from("feed_posts")
    .select("id, post_id, author, author_name, url, posted_at, ar, translit, he, words, hidden")
    .order("posted_at", { ascending: false })
    .limit(150);
  if (!all) q = q.eq("hidden", false);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ posts: data ?? [] });
}
