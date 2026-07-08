# Yalla Cards

Personal spaced-repetition app for learning spoken Palestinian Arabic (Jerusalem/Jaffa dialect)
via Hebrew transliteration with nikkud. Single user, password-gated, deployed on Vercel.

## Stack

- Next.js (App Router) + TypeScript on Vercel.
- Supabase: Postgres + Storage (lesson recordings, per-card clips).
- `ts-fsrs` for spaced-repetition scheduling.
- Gemini (text + vision) for parsing lesson notes/photos in `/inbox`.
- Groq (`whisper-large-v3`) for lesson recording transcription.
- `ffmpeg.wasm` client-side for recording transcode and per-card clip cutting.

## Setup

1. Copy `.env.local.example` to `.env.local` and fill in all values (Supabase project URL/keys,
   `APP_PASSWORD`, `AUTH_SECRET`, `GEMINI_API_KEY`, `GROQ_API_KEY`).
2. Run the SQL files in `supabase/migrations/` against your Supabase project, in order.
3. `npm install && npm run dev`.

## Known limitation: Opus playback on iOS Safari

Full lesson recordings are transcoded client-side to mono 16kHz Opus (`.ogg`) before upload, to
keep 60-90 minute lessons small. **iOS Safari cannot play Opus-in-Ogg**, so the full-recording
player on a recording's detail page (`/recordings/[id]`) won't work on an iPhone/iPad.

This is accepted as-is: recording ingest (uploading, transcribing, selecting ranges, and cutting
clips) is a desktop-only workflow in practice — see the in-app notice on mobile. The one thing
that *must* work on a phone is `/review`, and per-card clips there are encoded as mono MP3
specifically because MP3 plays everywhere, including iOS Safari.

If full-recording playback on mobile is ever needed, transcode to AAC/M4A instead of Opus (larger
files, but universally supported) or keep both an Opus and an AAC copy.
