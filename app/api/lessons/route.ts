import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("lessons")
    .select("id, date, title")
    .order("date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lessons: data });
}

export async function POST(request: NextRequest) {
  const { title, date, notes } = await request.json();
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("lessons")
    .insert({ title, date, notes })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lesson: data });
}
