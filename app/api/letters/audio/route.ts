import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Pronunciation audio for the letter drill (note 28e16a9b).
 *
 * Each letter maps to a range inside one of the two מפגש 1 alphabet recordings
 * rather than to an extracted clip: the recordings are already in storage, so
 * there is nothing to cut, upload or keep in sync. The client seeks to
 * `start_sec` and stops itself at `end_sec`.
 *
 * One signed URL per recording, not per letter — there are only two of them,
 * and signing 28 URLs for the same two files is 28 round trips for no gain.
 */
export async function GET() {
  const supabase = supabaseAdmin();

  const { data: rows, error } = await supabase
    .from("letter_audio")
    .select("letter, recording_id, start_sec, end_sec, note");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!rows?.length) return NextResponse.json({ audio: {} });

  const recordingIds = [...new Set(rows.map((r) => r.recording_id))];
  const { data: recs, error: recError } = await supabase
    .from("recordings")
    .select("id, storage_path")
    .in("id", recordingIds);
  if (recError) return NextResponse.json({ error: recError.message }, { status: 500 });

  const urlByRecording = new Map<string, string>();
  await Promise.all(
    (recs ?? []).map(async (r) => {
      const { data } = await supabase.storage
        .from("recordings")
        .createSignedUrl(r.storage_path, 60 * 60);
      if (data?.signedUrl) urlByRecording.set(r.id, data.signedUrl);
    })
  );

  const audio: Record<string, { url: string; start: number; end: number; note: string | null }> = {};
  for (const r of rows) {
    const url = urlByRecording.get(r.recording_id);
    // A letter whose recording failed to sign is omitted rather than returned
    // with an empty url — the button is then simply absent instead of silent.
    if (!url) continue;
    audio[r.letter] = {
      url,
      start: Number(r.start_sec),
      end: Number(r.end_sec),
      note: r.note ?? null,
    };
  }

  return NextResponse.json({ audio });
}
