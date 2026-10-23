import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json();
  // Only the fields sent are changed — the lessons page sends title and date
  // alone, and must not wipe a lesson's source, teacher or meeting.
  const patch = Object.fromEntries(
    ["title", "date", "notes", "source", "teacher", "meeting"].filter((k) => k in body).map((k) => [k, body[k]])
  );

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("lessons")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lesson: data });
}
