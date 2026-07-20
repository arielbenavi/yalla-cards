"use client";

// Cuts [startSec, endSec) from the source audio using the Web Audio API and
// returns a mono WAV blob. No ffmpeg — avoids webpack/Turbopack blob-URL
// module-resolution issues with @ffmpeg/ffmpeg's internal dynamic imports.
export async function createClip(audioUrl: string, startSec: number, endSec: number): Promise<Blob> {
  const response = await fetch(audioUrl);
  const arrayBuffer = await response.arrayBuffer();

  const ctx = new AudioContext();
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
  await ctx.close();

  const sampleRate = audioBuffer.sampleRate;
  const startSample = Math.floor(startSec * sampleRate);
  const endSample = Math.min(Math.ceil(endSec * sampleRate), audioBuffer.length);
  const length = Math.max(1, endSample - startSample);

  // Downmix to mono using channel 0
  const clipBuffer = new AudioBuffer({ length, numberOfChannels: 1, sampleRate });
  clipBuffer.copyToChannel(audioBuffer.getChannelData(0).slice(startSample, endSample), 0);

  return encodeWav(clipBuffer);
}

function encodeWav(buf: AudioBuffer): Blob {
  const samples = buf.getChannelData(0);
  const byteCount = samples.length * 2;
  const ab = new ArrayBuffer(44 + byteCount);
  const v = new DataView(ab);

  const str = (off: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i)); };
  str(0, "RIFF");
  v.setUint32(4, 36 + byteCount, true);
  str(8, "WAVE");
  str(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);          // PCM
  v.setUint16(22, 1, true);          // mono
  v.setUint32(24, buf.sampleRate, true);
  v.setUint32(28, buf.sampleRate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  str(36, "data");
  v.setUint32(40, byteCount, true);

  let off = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    v.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    off += 2;
  }

  return new Blob([ab], { type: "audio/wav" });
}
