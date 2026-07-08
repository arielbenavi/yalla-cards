"use client";

import { supabaseBrowser } from "@/lib/supabase-browser";
import { transcodeToOpus, sliceChunks } from "@/lib/transcode";

export type UploadStatus = "transcoding" | "uploading" | "transcribing";

// Shared by the manual /recordings upload flow and the WhatsApp voice-note
// import: transcode to opus, upload direct-to-storage, create the recording
// row, and transcribe it immediately so the resulting card rows can be QA'd
// right away. maxAutoTranscribeDurationSec lets callers skip auto-transcribe
// above a duration (used for WhatsApp voice notes, which are short by nature
// but shouldn't silently kick off a long transcription if one turns out huge);
// the main lesson-recording upload always transcribes regardless of length.
export async function uploadAndTranscribeRecording(
  file: File,
  opts: {
    lessonId?: string | null;
    onStatus?: (status: UploadStatus) => void;
    maxAutoTranscribeDurationSec?: number;
    // If set, recordings at or under this duration get tagged (e.g. WhatsApp
    // voice notes under a minute are auto-tagged "פתגם יומי"). Unset for the
    // plain lesson-recording upload, which never auto-tags.
    autoTag?: { maxDurationSec: number; tag: string };
  } = {}
): Promise<{ id: string; durationSec: number; transcribed: boolean }> {
  opts.onStatus?.("transcoding");
  const { blob, durationSec } = await transcodeToOpus(file);

  opts.onStatus?.("uploading");
  const { path, token } = await fetch("/api/recordings/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ extension: "ogg" }),
  }).then((r) => r.json());

  const supabase = supabaseBrowser();
  const { error: uploadError } = await supabase.storage.from("recordings").uploadToSignedUrl(path, token, blob);
  if (uploadError) throw new Error(uploadError.message);

  const tag =
    opts.autoTag && durationSec <= opts.autoTag.maxDurationSec ? opts.autoTag.tag : null;

  const { recording } = await fetch("/api/recordings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lesson_id: opts.lessonId ?? null, storage_path: path, duration_sec: durationSec, tag }),
  }).then((r) => r.json());

  const shouldTranscribe = durationSec <= (opts.maxAutoTranscribeDurationSec ?? Infinity);
  if (shouldTranscribe) {
    opts.onStatus?.("transcribing");
    const chunks = await sliceChunks(blob, durationSec);
    const allWords: { word: string; start: number; end: number }[] = [];

    for (const chunk of chunks) {
      const formData = new FormData();
      formData.append("chunk", chunk.blob, "chunk.ogg");
      formData.append("offset_sec", String(chunk.offsetSec));
      const { words } = await fetch(`/api/recordings/${recording.id}/transcribe-chunk`, {
        method: "POST",
        body: formData,
      }).then((r) => r.json());
      allWords.push(...(words ?? []));
    }

    await fetch(`/api/recordings/${recording.id}/save-transcript`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ words: allWords }),
    });
  }

  return { id: recording.id, durationSec, transcribed: shouldTranscribe };
}
