import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("recordings")
    .select("id, lesson_id, storage_path, duration_sec, created_at, lesson:lessons(title, date)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ recordings: data });
}

export async function POST(request: NextRequest) {
  const { lesson_id, storage_path, duration_sec } = await request.json();
  const supabase = supabaseAdmin();

  const { data, error } = await supabase
    .from("recordings")
    .insert({ lesson_id: lesson_id || null, storage_path, duration_sec })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ recording: data });
}
