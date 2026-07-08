"use client";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL, fetchFile } from "@ffmpeg/util";
import { config } from "@/lib/config";

const CORE_BASE = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";

let ffmpegInstance: FFmpeg | null = null;

export async function getFFmpeg(onProgress?: (ratio: number) => void) {
  if (ffmpegInstance) return ffmpegInstance;

  const ffmpeg = new FFmpeg();
  if (onProgress) ffmpeg.on("progress", ({ progress }) => onProgress(progress));

  await ffmpeg.load({
    coreURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, "application/wasm"),
  });

  ffmpegInstance = ffmpeg;
  return ffmpeg;
}

function getAudioDurationSec(blob: Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.preload = "metadata";
    audio.src = URL.createObjectURL(blob);
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(audio.src);
      resolve(audio.duration);
    };
    audio.onerror = () => reject(new Error("could not read audio duration"));
  });
}

// Downsamples the recording to mono/16kHz opus at a low speech bitrate so a
// 60-90 min lesson stays well under both Groq's per-request size limit and a
// reasonable Supabase Storage footprint (~16MB for 90min at 24kbps).
export async function transcodeToOpus(
  file: File,
  onProgress?: (ratio: number) => void
): Promise<{ blob: Blob; durationSec: number }> {
  const ffmpeg = await getFFmpeg(onProgress);
  const inputName = "input" + (file.name.match(/\.[^.]+$/)?.[0] ?? ".m4a");
  const outputName = "output.ogg";

  await ffmpeg.writeFile(inputName, await fetchFile(file));
  await ffmpeg.exec([
    "-i",
    inputName,
    "-ac",
    "1",
    "-ar",
    String(config.transcodeSampleRateHz),
    "-c:a",
    "libopus",
    "-b:a",
    "24k",
    outputName,
  ]);

  const data = await ffmpeg.readFile(outputName);
  const blob = new Blob([new Uint8Array(data as Uint8Array)], { type: "audio/ogg" });

  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);

  const durationSec = await getAudioDurationSec(blob);
  return { blob, durationSec };
}

// Splits an already-transcoded opus blob into fixed-length chunks (stream
// copy, no re-encode) so each chunk sent to Groq/our API route stays well
// under Groq's 25MB limit and Vercel's request body limit.
export async function sliceChunks(
  blob: Blob,
  durationSec: number,
  chunkDurationSec = 15 * 60
): Promise<{ blob: Blob; offsetSec: number }[]> {
  if (durationSec <= chunkDurationSec) {
    return [{ blob, offsetSec: 0 }];
  }

  const ffmpeg = await getFFmpeg();
  const inputName = "chunk-input.ogg";
  await ffmpeg.writeFile(inputName, await fetchFile(blob));

  const chunks: { blob: Blob; offsetSec: number }[] = [];
  let offsetSec = 0;
  let index = 0;

  while (offsetSec < durationSec) {
    const outputName = `chunk-${index}.ogg`;
    await ffmpeg.exec([
      "-i",
      inputName,
      "-ss",
      String(offsetSec),
      "-t",
      String(chunkDurationSec),
      "-c",
      "copy",
      outputName,
    ]);
    const data = await ffmpeg.readFile(outputName);
    chunks.push({ blob: new Blob([new Uint8Array(data as Uint8Array)], { type: "audio/ogg" }), offsetSec });
    await ffmpeg.deleteFile(outputName);

    offsetSec += chunkDurationSec;
    index += 1;
  }

  await ffmpeg.deleteFile(inputName);
  return chunks;
}
