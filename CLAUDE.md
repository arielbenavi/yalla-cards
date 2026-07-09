@AGENTS.md

## Session start checklist

At the start of every session, before doing anything else:
1. Call `GET /api/notes` (or run a one-off query: `SELECT id, body, tag, created_at FROM notes WHERE status = 'open' ORDER BY created_at DESC`) to read open notes.
2. Address or triage each open note in your first reply — fix bugs inline if straightforward, otherwise acknowledge and ask the owner for priority.
