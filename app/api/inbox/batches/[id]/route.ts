import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = supabaseAdmin();
  const { data, error } = await supabase.from("import_batches").select("*").eq("id", id).single();

  if (error || !data) return NextResponse.json({ error: error?.message ?? "not found" }, { status: 404 });
  return NextResponse.json({ batch: data });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const patch = (await request.json()) as { parsed_rows?: unknown; lesson_id?: string | null };

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("import_batches")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ batch: data });
}
