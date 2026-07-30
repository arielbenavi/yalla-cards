import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import { AUTH_COOKIE, isValidAuthCookie } from "@/lib/auth";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const supabase = supabaseAdmin();
  const cookieStore = await cookies();
  const isAdmin = isValidAuthCookie(cookieStore.get(AUTH_COOKIE)?.value);

  const allowed = ["self_score"] as const;
  const adminOnly = ["audio_start_sec", "audio_end_sec"] as const;
  const updates: Record<string, unknown> = {};

  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }
  if (isAdmin) {
    for (const key of adminOnly) {
      if (key in body) updates[key] = body[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "no valid fields" }, { status: 400 });
  }

  const { error } = await supabase.from("cards").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
