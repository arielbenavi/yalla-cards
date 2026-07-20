import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// Returns a short-lived signed URL for viewing an image in the pictures bucket.
export async function POST(request: NextRequest) {
  const { path } = (await request.json()) as { path: string };
  const supabase = supabaseAdmin();
  const { data, error } = await supabase.storage
    .from("pictures")
    .createSignedUrl(path, 3600); // 1 hour

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ url: data.signedUrl });
}
