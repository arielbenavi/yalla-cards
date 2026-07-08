import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const chatIdentifier = request.nextUrl.searchParams.get("chat_identifier");
  if (!chatIdentifier) {
    return NextResponse.json({ error: "chat_identifier required" }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("whatsapp_import_cursor")
    .select("last_imported_at")
    .eq("chat_identifier", chatIdentifier)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ last_imported_at: data?.last_imported_at ?? null });
}

export async function PATCH(request: NextRequest) {
  const { chat_identifier, last_imported_at } = (await request.json()) as {
    chat_identifier: string;
    last_imported_at: string;
  };

  if (!chat_identifier || !last_imported_at) {
    return NextResponse.json({ error: "chat_identifier and last_imported_at required" }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { error } = await supabase
    .from("whatsapp_import_cursor")
    .upsert({ chat_identifier, last_imported_at, updated_at: new Date().toISOString() });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
