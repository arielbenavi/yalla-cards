"use client";

import { fetchFile } from "@ffmpeg/util";
import { getFFmpeg } from "@/lib/transcode";

// Cuts [startSec, endSec) out of the full recording and re-encodes it as a
// small standalone mono MP3 (64kbps — plays everywhere including iOS Safari,
// unlike Opus). Uses ffmpeg.wasm (already loaded for recordings ingest)
// rather than Web Audio's decodeAudioData: decodeAudioData would decode the
// *entire* source file to float32 PCM at the AudioContext's native rate
// (44.1/48kHz) before we could slice it — for a 90min recording that's
// ~350MB in browser memory just to cut one clip, and it also produced
// oversized WAV output. ffmpeg seeks and trims the compressed stream
// directly, so memory use stays proportional to the source file's
// compressed size (~16MB for a 90min lesson), not its decoded size.
export async function createClip(fullAudioUrl: string, startSec: number, endSec: number): Promise<Blob> {
  const ffmpeg = await getFFmpeg();
  const inputName = "clip-src.ogg";
  const outputName = "clip-out.mp3";
  const duration = Math.max(0.1, endSec - startSec);

  await ffmpeg.writeFile(inputName, await fetchFile(fullAudioUrl));
  await ffmpeg.exec([
    "-ss",
    String(startSec),
    "-i",
    inputName,
    "-t",
    String(duration),
    "-ac",
    "1",
    "-c:a",
    "libmp3lame",
    "-b:a",
    "64k",
    outputName,
  ]);

  const data = await ffmpeg.readFile(outputName);
  const blob = new Blob([new Uint8Array(data as Uint8Array)], { type: "audio/mpeg" });

  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);

  return blob;
}
