import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = supabaseAdmin();

  const { data: recording, error } = await supabase
    .from("recordings")
    .select("id, lesson_id, storage_path, duration_sec, transcript_json, title")
    .eq("id", id)
    .single();

  if (error || !recording) {
    return NextResponse.json({ error: error?.message ?? "not found" }, { status: 404 });
  }

  const { data: signed } = await supabase.storage
    .from("recordings")
    .createSignedUrl(recording.storage_path, 60 * 60);

  return NextResponse.json({ recording, audio_url: signed?.signedUrl ?? null });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const { title } = await request.json();
  const supabase = supabaseAdmin();
  const { error } = await supabase.from("recordings").update({ title }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
