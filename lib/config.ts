export const config = {
  newCardsPerDay: 12,
  matureScheduledDaysThreshold: 21,
  groqMaxFileSizeBytes: 25 * 1024 * 1024, // Groq whisper-large-v3 file size cap
  transcodeSampleRateHz: 16000,
  audioNudgeSec: 0.5,
  autoTranscribeMaxDurationSec: 10 * 60, // voice notes are short; skip auto-transcribe above this
};
