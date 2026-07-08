import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const supabase = supabaseAdmin();

  let query = supabase
    .from("cards")
    .select("id, hebrew_meaning, translit_nikud, item_type, recording_id")
    .order("created_at", { ascending: false })
    .limit(20);

  if (q.trim()) {
    query = query.or(`hebrew_meaning.ilike.%${q}%,translit_nikud.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ cards: data });
}
