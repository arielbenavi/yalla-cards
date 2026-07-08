import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import type { BatchRow, RawInput } from "@/lib/batches";

export async function GET() {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("import_batches")
    .select("id, source, lesson_id, parsed_rows, created_at, updated_at, lesson:lessons(title, date)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const batches = (data ?? []).map((b) => {
    const rows = (b.parsed_rows ?? []) as BatchRow[];
    return {
      id: b.id,
      source: b.source,
      lesson_id: b.lesson_id,
      lesson: Array.isArray(b.lesson) ? b.lesson[0] : b.lesson,
      created_at: b.created_at,
      updated_at: b.updated_at,
      total_rows: rows.length,
      committed_rows: rows.filter((r) => r.committed).length,
    };
  });

  return NextResponse.json({ batches });
}

export async function POST(request: NextRequest) {
  const { source, lesson_id, raw_input, parsed_rows } = (await request.json()) as {
    source: string;
    lesson_id: string | null;
    raw_input: RawInput;
    parsed_rows: BatchRow[];
  };

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("import_batches")
    .insert({ source, lesson_id: lesson_id || null, raw_input, parsed_rows })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ batch: data });
}
