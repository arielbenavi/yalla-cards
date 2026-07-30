---
name: songs
description: Add new Arabic songs from the Spotify playlist to the yalla-cards songs table. Run this at the start of each session or when the user asks to sync songs.
tools:
  - Bash
  - WebSearch
  - WebFetch
  - Read
  - Write
  - mcp__claude-in-chrome__tabs_context_mcp
  - mcp__claude-in-chrome__navigate
  - mcp__claude-in-chrome__read_page
  - mcp__claude-in-chrome__find
  - mcp__claude-in-chrome__form_input
  - mcp__claude-in-chrome__computer
  - mcp__claude-in-chrome__javascript_tool
---

# songs — Arabic song importer

Adds new songs from the Spotify "Aravit" playlist to the yalla-cards DB.

## Playlist
`https://open.spotify.com/playlist/1lrb8fvvb7rTKCklDf5FTj`

## Step 1 — Which songs are already in the DB?

```bash
cd /Users/arismac/Sync/win_mac_sync/dev/yalla-cards && npx tsx scripts/list-songs.ts
```

Note the song titles already in the DB.

## Step 2 — Which songs are in the playlist?

Navigate to the playlist URL in the browser. Read the page to extract song titles + artists. Compare with the DB list. Any song in the playlist but NOT in the DB is **new**.

## Step 3 — For each new song

### 3a. Get lyrics

WebSearch for `[song name] [artist] lyrics`. Find an Arabic lyrics page. WebFetch it. Extract every line of the Arabic lyrics in order.

### 3b. Send to chatifai

Invoke the `chatifai` agent (see `.claude/agents/chatifai.md`). Use the full-lyrics template:

```
תתרגם בבקשה שורה שורה ככה שאתה לא מדלג על אף שורה, עם תעתיק עברי מנוקד מלא ותרגום עברי לכל שורה, ופירוק לפי מילים (ערבית | עברית | תעתיק לטיני) לכל שורה. בפורמט:
שורה: [Arabic line]
תעתיק: [Hebrew nikud]
תרגום: [Hebrew translation]
מילים: [ar=X | he=Y | translit=Z, ar=... | he=... | translit=...]

[PASTE LYRICS]
```

Verify the bot responded to **every line**. If the response seems cut off, send a follow-up:
```
תמשיך מהשורה [LAST LINE] — אל תדלג על אף שורה
```

### 3c. Build lyrics_parsed JSON

From chatifai's response, build the JSON array:
```json
[
  {
    "line": "Hebrew nikud of the Arabic line",
    "words": [
      {"ar": "arabic word", "he": "Hebrew meaning", "translit": "latin romanization"},
      ...
    ]
  }
]
```

The `line` field is the **Hebrew nikud transliteration** of the Arabic line (NOT the Arabic script or the Hebrew translation).

### 3d. Find YouTube URL

WebSearch for `[song name] [artist] youtube`. Get the video URL.

### 3e. Insert into DB

Write a script `scripts/add-song-[slug].ts` using this pattern:

```typescript
import { config } from 'dotenv'; config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as any } });

const lyrics_parsed = [
  // ... chatifai output here
];

async function main() {
  const { data, error } = await sb.from('songs').insert({
    title: 'SONG TITLE',
    artist: 'ARTIST',
    youtube_url: 'https://www.youtube.com/watch?v=...',
    lyrics_parsed,
  }).select('id').single();
  if (error) { console.error('❌', error.message); return; }
  console.log('✅ Inserted song', data.id);
}
main().catch((e) => { console.error(e.message); process.exit(1); });
```

Run: `cd /Users/arismac/Sync/win_mac_sync/dev/yalla-cards && npx tsx scripts/add-song-[slug].ts`

## Verification

After inserting, run `npx tsx scripts/list-songs.ts` again to confirm the new song appears. Check the count of lines in `lyrics_parsed` matches the lyrics.

## Notes

- Never skip lines — chatifai must cover the full song
- The `line` field is Hebrew nikud of the Arabic (not Hebrew translation, not Arabic script)
- Each word object: `ar` = Arabic script, `he` = Hebrew meaning, `translit` = Latin romanization
