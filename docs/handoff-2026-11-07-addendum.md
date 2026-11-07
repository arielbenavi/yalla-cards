# Addendum 2026-11-07 (after docs/handoff-2026-11-05.md)

- **iPhone app expiring ("האפליקציה לא זמינה")**:
  - Cause: since 31/10 `mobile/reinstall-daily.sh` failed with `node: command not found` (nvm never selected a version). On days the iPhone was unreachable, `install-iphone.sh` exited with no message (`set -euo pipefail` on a failing grep).
  - Fixed: the script now runs Node 20. launchd runs it at 08:30, 13:30 and 20:30 (`~/Library/LaunchAgents/il.ariel.yalla.reinstall.plist`, not in the repo). The profile is renewed when under 4 days are left. With under 2 days left after a failed run, the Mac shows a notification.
  - Log: `~/Library/Logs/yalla-reinstall.log`.
- **Watch, phrase selection**: tap a word, then "+ המילה הקודמת / הבאה" builds a phrase. The meaning is editable, and the phrase becomes an unverified `phrase` card.
- **Watch scrolling**: the player now scrolls on a phone. `body:has(.yc.embedded)` hides body overflow, so `.watch` scrolls itself.
- **Review**: a deck sentence longer than 12 words is never shown as a card's example.
- **Menu**: on a phone, sign-out is at the bottom of the "עוד" sheet. It stays in the top bar on wide screens only.
- **Cards**:
  - צַבַּאח = בוקר was removed. Backup: `scripts/data/removed-sabah-card.json`.
  - Added: מִתְאַחֵּ'ר and 3 sentences about the teacher who is always late (`scripts/insert-late-2026-11-07.ts`). اخوت means fool / nutcase, not brother.
