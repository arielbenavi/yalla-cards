import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("picture_scenes")
    .select("id, title, image_path, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ scenes: data });
}

export async function POST(request: NextRequest) {
  const { title, image_path } = await request.json();
  const supabase = supabaseAdmin();

  const { data, error } = await supabase
    .from("picture_scenes")
    .insert({ title, image_path })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ scene: data });
}
