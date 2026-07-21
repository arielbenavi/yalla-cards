import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("recordings")
    .select("id, lesson_id, storage_path, duration_sec, tag, title, created_at, transcript_json, lesson:lessons(title, date), clips:cards!recording_id(audio_start_sec,audio_end_sec)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Compute word coverage for each recording
  const recordings = (data ?? []).map((r) => {
    const words: { start: number; end: number }[] = r.transcript_json?.words ?? [];
    const clips: { audio_start_sec: number; audio_end_sec: number }[] = r.clips ?? [];
    const total = words.length;
    const linked = total === 0 ? 0 : words.filter((w) =>
      clips.some((c) => w.start < c.audio_end_sec && w.end > c.audio_start_sec)
    ).length;
    const { transcript_json: _omit, ...rest } = r;
    return { ...rest, coverage_total: total, coverage_linked: linked };
  });

  return NextResponse.json({ recordings });
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
