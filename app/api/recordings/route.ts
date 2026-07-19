import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("recordings")
    .select("id, lesson_id, storage_path, duration_sec, tag, created_at, lesson:lessons(title, date), clips:cards!recording_id(count)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ recordings: data });
}

export async function POST(request: NextRequest) {
  const { lesson_id, storage_path, duration_sec, tag, source_filename } = await request.json();
  const supabase = supabaseAdmin();

  // Dedup: if re-importing the same ZIP, skip re-uploading already-stored files
  if (source_filename) {
    const { data: existing } = await supabase
      .from("recordings")
      .select("id, storage_path")
      .eq("source_filename", source_filename)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ recording: existing, deduplicated: true });
    }
  }

  const { data, error } = await supabase
    .from("recordings")
    .insert({ lesson_id: lesson_id || null, storage_path, duration_sec, tag: tag || null, source_filename: source_filename || null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ recording: data });
}
