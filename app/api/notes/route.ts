import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("status", "open")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ notes: data });
}

export async function POST(request: NextRequest) {
  const { body, tag } = (await request.json()) as { body: string; tag?: string };
  if (!body?.trim()) return NextResponse.json({ error: "body required" }, { status: 400 });
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("notes")
    .insert({ body: body.trim(), tag: tag?.trim() || null })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ note: data });
}
