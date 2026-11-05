import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// Every item for /watch, grouped there by series. Read only.
export async function GET() {
  const { data, error } = await supabaseAdmin()
    .from("media_items")
    .select("slug, title, series, sort, duration_sec, created_at")
    .not("slug", "like", "test-%")
    .order("series")
    .order("sort");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}
