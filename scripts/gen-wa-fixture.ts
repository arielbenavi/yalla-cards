/**
 * Generates tests/fixtures/wa-test.zip — a minimal WhatsApp export with two
 * short WAV silence clips and an iOS-format _chat.txt that includes the
 * U+200E LRM prefix on attachment lines (the real bug this tests).
 *
 * Run once: npx tsx scripts/gen-wa-fixture.ts
 */
import JSZip from "jszip";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

function makeWav(durationSec = 0.1, sampleRate = 44100): Buffer {
  const n = Math.ceil(durationSec * sampleRate);
  const buf = Buffer.alloc(44 + n * 2, 0);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16); // chunk size
  buf.writeUInt16LE(1, 20);  // PCM
  buf.writeUInt16LE(1, 22);  // mono
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28); // byte rate
  buf.writeUInt16LE(2, 32);  // block align
  buf.writeUInt16LE(16, 34); // bits per sample
  buf.write("data", 36);
  buf.writeUInt32LE(n * 2, 40);
  // samples are zero (silence)
  return buf;
}

async function main() {
  const LRM = "‎";
  // iOS WhatsApp export format: lines start with LRM, attachment bodies also
  // have LRM before <attached:>
  const chat = [
    `${LRM}[01/01/2026, 12:00:00] Teacher: שלום כיתה`,
    `${LRM}[01/01/2026, 12:01:00] Teacher: ${LRM}<attached: AUDIO-2026-01-01-12-01-00.wav>`,
    `${LRM}[01/01/2026, 12:02:00] Student: תודה`,
    `${LRM}[01/01/2026, 12:03:00] Teacher: ${LRM}<attached: AUDIO-2026-01-01-12-03-00.wav>`,
    `${LRM}[01/01/2026, 12:04:00] Student: 👍`,
  ].join("\r\n");

  const zip = new JSZip();
  zip.file("_chat.txt", chat);
  zip.file("AUDIO-2026-01-01-12-01-00.wav", makeWav(0.1));
  zip.file("AUDIO-2026-01-01-12-03-00.wav", makeWav(0.1));

  const out = join(process.cwd(), "tests/fixtures/wa-test.zip");
  await mkdir(join(process.cwd(), "tests/fixtures"), { recursive: true });
  await writeFile(out, await zip.generateAsync({ type: "nodebuffer" }));
  console.log(`✓ wrote ${out}  (2 WAV clips + _chat.txt with LRM prefixes)`);
}

main().catch(console.error);
