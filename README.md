# Yalla Cards

Personal spaced-repetition app for spoken Palestinian Arabic (Jerusalem/Jaffa dialect) via Hebrew transliteration. Single user, deployed on Vercel.

## Stack

- Next.js App Router + TypeScript, deployed on Vercel
- Supabase: Postgres + Storage (lesson recordings + per-card audio clips)
- `ts-fsrs` for spaced-repetition scheduling
- Gemini for parsing lesson notes/photos in `/inbox`
- Groq (`whisper-large-v3`) for transcription
- `ffmpeg.wasm` (client-side) for recording transcode + clip cutting

## Setup

1. Copy `.env.local.example` → `.env.local`, fill all values
2. `npm install && npm run dev`
3. Migrations apply automatically via `scripts/migrate.ts`

## Key design decisions

**FSRS queue:** new cards ordered by insertion date (= lesson order). Don't randomize. Cards marked Easy today are excluded from today's daily queue.

**Audio:** full recordings are Opus/Ogg (small, desktop-only). Per-card clips are MP3 (iOS-compatible). iOS Safari can't play Opus, so the recording detail page won't work on iPhone — that's accepted; review (`/review`) works everywhere.

**`songs.lyrics_parsed`** is `LyricLine[]`:
```ts
type LyricLine = { line: string; words: LyricWord[]; timestamp?: string }
type LyricWord = { ar: string; he: string; translit: string }
```
Non-Arabic lines (English, German): set `words: []`.

## Where to start

- Latest state and next steps: [docs/handoff-2026-11-05.md](docs/handoff-2026-11-05.md)
- Video with tappable transliteration: [docs/watch-plan.md](docs/watch-plan.md)
- Rules for any change: [CLAUDE.md](CLAUDE.md)
