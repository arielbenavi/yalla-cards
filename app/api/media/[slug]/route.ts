import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// A video or audio item with its subtitles, for /watch/<slug>. Read only.
export async function GET(_: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const supabase = supabaseAdmin();
  const { data: item, error } = await supabase
    .from("media_items")
    .select("id, slug, title, storage_path, source_url, glosses")
    .eq("slug", slug)
    .single();
  if (error || !item) return NextResponse.json({ error: error?.message ?? "not found" }, { status: 404 });

  const [{ data: segments, error: segError }, signed] = await Promise.all([
    supabase.from("media_segments").select("id, idx, start_sec, end_sec, ar, translit, he, verified").eq("item_id", item.id).order("idx"),
    item.storage_path && !item.storage_path.startsWith("http")
      ? supabase.storage.from("recordings").createSignedUrl(item.storage_path, 60 * 60 * 4)
      : Promise.resolve({ data: null }),
  ]);
  if (segError) return NextResponse.json({ error: segError.message }, { status: 500 });
  // A full address plays from where the video already lives (nothing of ours is stored)
  const external = item.storage_path?.startsWith("http") ? item.storage_path : null;
  return NextResponse.json({ item, segments: segments ?? [], media_url: external ?? signed.data?.signedUrl ?? null });
}
