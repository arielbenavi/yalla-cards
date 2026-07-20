import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = supabaseAdmin();

  const { data: scene, error: sceneErr } = await supabase
    .from("picture_scenes")
    .select("id, title, image_path")
    .eq("id", id)
    .single();

  if (sceneErr) return NextResponse.json({ error: sceneErr.message }, { status: 404 });

  const { data: hotzones, error: hzErr } = await supabase
    .from("picture_hotzones")
    .select("id, label_ar, label_he, translit, x_pct, y_pct, radius_pct")
    .eq("scene_id", id)
    .order("created_at", { ascending: true });

  if (hzErr) return NextResponse.json({ error: hzErr.message }, { status: 500 });

  return NextResponse.json({ scene, hotzones });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = supabaseAdmin();

  const { error } = await supabase.from("picture_scenes").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
