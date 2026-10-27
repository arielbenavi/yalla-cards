export const config = {
  // 40, not 12 (Ariel, 2026-10-24): 1,416 cards had never been shown. ~150–180
  // reviews a day at steady state; the whole backlog in about five weeks.
  newCardsPerDay: 40,
  // A sentence card costs several word cards' effort and comes back as often,
  // so long items (≥ longItemWords words) are capped at this share of each
  // day's new cards (Ariel, 2026-10-27). Due cards are never held back.
  newLongShare: 0.25,
  longItemWords: 4,
  matureScheduledDaysThreshold: 21,
  groqMaxFileSizeBytes: 25 * 1024 * 1024, // Groq whisper-large-v3 file size cap
  transcodeSampleRateHz: 16000,
  audioNudgeSec: 0.5,
  autoTranscribeMaxDurationSec: 10 * 60, // voice notes are short; skip auto-transcribe above this
  defaultWhatsappTeacherName: "R.D",
  dailyProverbTag: "פתגם יומי",
  dailyProverbMaxDurationSec: 60,
};
