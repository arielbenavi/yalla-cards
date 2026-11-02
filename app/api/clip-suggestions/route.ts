import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

type Word = { word: string; start: number; end: number };

type Row = {
  id: string;
  card_id: string;
  recording_id: string;
  start_sec: number;
  end_sec: number;
  confidence: number;
  signals: Record<string, unknown>;
  cards: { translit_nikud: string; arabic_script: string | null; hebrew_meaning: string; clip_path: string | null } | null;
  recordings: { title: string | null; storage_path: string; source_filename: string | null } | null;
};

const PAGE = 1000;
const CONTEXT_SEC = 4;
const CONFIDENCE_BANDS = [0.85, 0.5] as const;

// The queue behind /recordings/auto: best guess per card, surest first.
export async function GET(request: NextRequest) {
  const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") ?? 20), 60);
  const skip = new Set((request.nextUrl.searchParams.get("skip") ?? "").split(",").filter(Boolean));
  const supabase = supabaseAdmin();

  const rows: Row[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("clip_suggestions")
      .select(
        "id,card_id,recording_id,start_sec,end_sec,confidence,signals,cards!inner(translit_nikud,arabic_script,hebrew_meaning,clip_path),recordings(title,storage_path,source_filename)"
      )
      .eq("status", "pending")
      .is("cards.clip_path", null)
      .order("confidence", { ascending: false })
      .order("id")
      .range(from, from + PAGE - 1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    rows.push(...((data ?? []) as unknown as Row[]));
    if (!data || data.length < PAGE) break;
  }

  const seen = new Set<string>();
  const best = rows.filter((r) => {
    if (seen.has(r.card_id)) return false;
    seen.add(r.card_id);
    return true;
  });
  const page = best.filter((r) => !skip.has(r.card_id)).slice(0, limit);

  const recordingIds = [...new Set(page.map((r) => r.recording_id))];
  const [{ data: transcripts }, { data: decided }, urls] = await Promise.all([
    supabase.from("recordings").select("id,transcript_json").in("id", recordingIds.length ? recordingIds : [""]),
    supabase.from("clip_suggestions").select("status,confidence").in("status", ["approved", "rejected"]),
    Promise.all(
      recordingIds.map(async (id) => {
        const path = page.find((r) => r.recording_id === id)!.recordings!.storage_path;
        const { data } = await supabase.storage.from("recordings").createSignedUrl(path, 60 * 60);
        return [id, data?.signedUrl ?? null] as const;
      })
    ),
  ]);
  const urlOf = new Map(urls);
  const wordsOf = new Map(
    (transcripts ?? []).map((t) => [t.id as string, ((t.transcript_json as { words: Word[] } | null)?.words ?? []) as Word[]])
  );

  // How the guesses did so far, by how sure they were.
  const bands = [
    { label: "high", min: CONFIDENCE_BANDS[0], max: 1.01, approved: 0, rejected: 0 },
    { label: "mid", min: CONFIDENCE_BANDS[1], max: CONFIDENCE_BANDS[0], approved: 0, rejected: 0 },
    { label: "low", min: 0, max: CONFIDENCE_BANDS[1], approved: 0, rejected: 0 },
  ];
  for (const d of decided ?? []) {
    const band = bands.find((b) => Number(d.confidence) >= b.min && Number(d.confidence) < b.max);
    if (band && d.status === "approved") band.approved++;
    if (band && d.status === "rejected") band.rejected++;
  }

  return NextResponse.json({
    remaining: best.length,
    bands,
    items: page.map((r) => {
      const start = Number(r.start_sec);
      const end = Number(r.end_sec);
      return {
        id: r.id,
        card_id: r.card_id,
        recording_id: r.recording_id,
        start,
        end,
        confidence: Number(r.confidence),
        signals: r.signals,
        translit_nikud: r.cards!.translit_nikud,
        arabic_script: r.cards!.arabic_script,
        hebrew_meaning: r.cards!.hebrew_meaning,
        recording_title: r.recordings?.title ?? r.recordings?.source_filename ?? "",
        audio_url: urlOf.get(r.recording_id) ?? null,
        context: (wordsOf.get(r.recording_id) ?? [])
          .filter((w) => w.end >= start - CONTEXT_SEC && w.start <= end + CONTEXT_SEC)
          .map((w) => ({ word: w.word, inside: w.start < end && w.end > start })),
      };
    }),
  });
}
