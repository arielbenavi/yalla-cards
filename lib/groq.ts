import Groq from "groq-sdk";
import { toFile } from "groq-sdk/uploads";

export type TranscriptWord = { word: string; start: number; end: number };

type VerboseTranscription = {
  text: string;
  words?: TranscriptWord[];
};

export async function transcribeChunk(
  chunkBytes: Uint8Array,
  filename: string
): Promise<TranscriptWord[]> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

  const response = (await groq.audio.transcriptions.create({
    model: "whisper-large-v3",
    file: await toFile(chunkBytes, filename),
    response_format: "verbose_json",
    timestamp_granularities: ["word"],
  })) as unknown as VerboseTranscription;

  return response.words ?? [];
}
