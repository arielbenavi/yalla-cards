import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path");
  if (!path) return NextResponse.json({ error: "path required" }, { status: 400 });

  const supabase = supabaseAdmin();
  const { data, error } = await supabase.storage.from("imports").createSignedUrl(path, 60 * 10);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ url: data.signedUrl });
}
