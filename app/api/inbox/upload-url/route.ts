import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase";

// Signed upload URLs for the 'imports' bucket (photo uploads + rendered PDF
// page images), mirroring /api/recordings/upload-url for the 'recordings'
// bucket -- kept as a separate route since the two buckets have different
// retention/purpose rather than genericizing over a bucket param.
export async function POST(request: NextRequest) {
  const { extension } = (await request.json()) as { extension: string };
  const path = `${randomUUID()}.${extension.replace(/[^a-z0-9]/gi, "")}`;

  const supabase = supabaseAdmin();
  const { data, error } = await supabase.storage.from("imports").createSignedUploadUrl(path);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ path, token: data.token, signedUrl: data.signedUrl });
}
