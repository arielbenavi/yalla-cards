import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const { extension } = (await request.json()) as { extension: string };
  const path = `${randomUUID()}.${extension.replace(/[^a-z0-9]/gi, "")}`;

  const supabase = supabaseAdmin();
  const { data, error } = await supabase.storage.from("recordings").createSignedUploadUrl(path);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ path, token: data.token, signedUrl: data.signedUrl });
}
