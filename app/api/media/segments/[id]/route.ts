import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

// Edits one subtitle line. A saved line counts as checked by a person, unless the
// request says otherwise. Admin only; nothing here touches cards or FSRS.
const TEXT = ["ar", "translit", "he"] as const;
const TIME = ["start_sec", "end_sec"] as const;

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: "admin only" }, { status: 403 });
  const { id } = await context.params;
  const body = await request.json();
  const update: Record<string, string | number | boolean> = { verified: body.verified !== false };
  for (const k of TEXT) if (typeof body[k] === "string") update[k] = body[k].trim();
  for (const k of TIME) if (typeof body[k] === "number" && body[k] >= 0) update[k] = body[k];
  const { data, error } = await supabaseAdmin()
    .from("media_segments")
    .update(update)
    .eq("id", id)
    .select("id, idx, start_sec, end_sec, ar, translit, he, verified")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ segment: data });
}
