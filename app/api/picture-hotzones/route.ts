import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const { scene_id, label_ar, label_he, translit, x_pct, y_pct, radius_pct } =
    await request.json();
  const supabase = supabaseAdmin();

  const { data, error } = await supabase
    .from("picture_hotzones")
    .insert({ scene_id, label_ar, label_he, translit: translit || null, x_pct, y_pct, radius_pct: radius_pct ?? 0.08 })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ hotzone: data });
}
