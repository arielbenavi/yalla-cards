import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// Video progress on /content, shared by every device (content_progress).
export async function GET() {
  const { data, error } = await supabaseAdmin().from("content_progress").select("url, sec, dur");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const progress = Object.fromEntries((data ?? []).map((r) => [r.url, { sec: r.sec, dur: r.dur }]));
  return NextResponse.json({ progress });
}

// Body: { items: [{ url, sec, dur }] } — one while watching, many for the
// one-time upload of what was kept in the browser before.
export async function POST(request: NextRequest) {
  const { items } = (await request.json()) as { items: { url: string; sec: number; dur: number }[] };
  const rows = (items ?? [])
    .filter((i) => typeof i.url === "string" && Number.isFinite(i.sec) && Number.isFinite(i.dur))
    .map((i) => ({ url: i.url, sec: i.sec, dur: i.dur, updated_at: new Date().toISOString() }));
  if (rows.length === 0) return NextResponse.json({ ok: true, saved: 0 });
  const { error } = await supabaseAdmin().from("content_progress").upsert(rows, { onConflict: "url" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, saved: rows.length });
}
