# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: import-flow.spec.ts >> WhatsApp import flow >> parses ZIP, uploads 2 voice notes, shows import summary
- Location: tests/e2e/import-flow.spec.ts:15:7

# Error details

```
Error: locator.selectOption: Error: strict mode violation: getByRole('combobox') resolved to 3 elements:
    1) <select class="border rounded px-3 py-2">…</select> aka getByLabel('שיעורללא שיעור')
    2) <select class="border rounded px-3 py-2">…</select> aka getByLabel('מי בשיחה הוא המורה?')
    3) <select class="text-sm border rounded px-2 py-1">…</select> aka locator('span').filter({ hasText: 'הכלגבוהה בלבדנמוכה בלבד' }).getByRole('combobox')

Call log:
  - waiting for getByRole('combobox')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - navigation [ref=e2]:
    - generic [ref=e3]: יאללה כרטיסים
    - generic [ref=e4]:
      - link "חזרה יומית" [ref=e5] [cursor=pointer]:
        - /url: /review
      - link "ייבוא" [ref=e6] [cursor=pointer]:
        - /url: /inbox
      - link "עיון" [ref=e7] [cursor=pointer]:
        - /url: /browse
      - link "מפגשים" [ref=e8] [cursor=pointer]:
        - /url: /lessons
      - link "הקלטות" [ref=e9] [cursor=pointer]:
        - /url: /recordings
      - link "סטטיסטיקה" [ref=e10] [cursor=pointer]:
        - /url: /stats
      - link "משימות" [ref=e11] [cursor=pointer]:
        - /url: /notes
      - link "למורים" [ref=e12] [cursor=pointer]:
        - /url: /teachers
      - link "נטיות" [ref=e13] [cursor=pointer]:
        - /url: /inflections
      - link "שירים" [ref=e14] [cursor=pointer]:
        - /url: /songs
      - link "שיחה" [ref=e15] [cursor=pointer]:
        - /url: /simulate
      - link "משחק תמונות" [ref=e16] [cursor=pointer]:
        - /url: /picture-game
    - button "יציאה" [ref=e18]
  - main [ref=e19]:
    - generic [ref=e20]:
      - heading "תיבת קליטה" [level=1] [ref=e21]
      - generic [ref=e22]:
        - generic [ref=e23]: שיעור
        - combobox "שיעור" [ref=e24]:
          - option "ללא שיעור" [selected]
      - button "הצג ייבואים קודמים" [ref=e25]
      - generic [ref=e26]:
        - button "הדבקת טקסט" [ref=e27]
        - button "העלאת תמונה" [ref=e28]
        - button "ייבוא מוואטסאפ" [ref=e29]
        - button "ייבוא PDF" [ref=e30]
      - generic [ref=e31]:
        - generic [ref=e32]:
          - generic [ref=e33]: מי בשיחה הוא המורה?
          - combobox "מי בשיחה הוא המורה?" [ref=e34]:
            - option "Teacher" [selected]
            - option "Student"
        - button "המשך" [ref=e35]
      - generic [ref=e36]:
        - generic [ref=e37]:
          - heading "תוצאות לעריכה" [level=2] [ref=e38]
          - combobox [ref=e40]:
            - option "הכל" [selected]
            - option "גבוהה בלבד"
            - option "נמוכה בלבד"
        - paragraph [ref=e41]: אין עדיין פריטים לעריכה
        - button "הוסף שורה" [ref=e42]
  - button "Open Next.js Dev Tools" [ref=e48] [cursor=pointer]:
    - img [ref=e49]
  - alert [ref=e52]
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | import { join } from "path";
  3   | import { login, dropFile } from "./helpers";
  4   | 
  5   | const FIXTURE_ZIP = join(process.cwd(), "tests/fixtures/wa-test.zip");
  6   | 
  7   | test.describe("WhatsApp import flow", () => {
  8   |   test.beforeEach(async ({ page }) => {
  9   |     await login(page);
  10  |     await page.goto("/inbox");
  11  |     // Switch to WhatsApp tab
  12  |     await page.getByText("ייבוא מוואטסאפ").click();
  13  |   });
  14  | 
  15  |   test("parses ZIP, uploads 2 voice notes, shows import summary", async ({ page }) => {
  16  |     // Drop the fixture ZIP onto the WhatsApp FileDropZone
  17  |     await dropFile(page, 'input[accept=".zip"]', FIXTURE_ZIP);
  18  |     // The file chip should appear
  19  |     await expect(page.getByText("wa-test.zip")).toBeVisible();
  20  | 
  21  |     // Open the ZIP
  22  |     await page.getByRole("button", { name: "פתח קובץ" }).click();
  23  |     // Should advance to teacher-selection step
  24  |     await expect(page.getByText("מי בשיחה הוא המורה?")).toBeVisible({ timeout: 15_000 });
  25  | 
  26  |     // Select "Teacher" (the sender in our fixture _chat.txt)
> 27  |     await page.getByRole("combobox").selectOption("Teacher");
      |                                      ^ Error: locator.selectOption: Error: strict mode violation: getByRole('combobox') resolved to 3 elements:
  28  |     // Check "import everything" to avoid cursor filtering
  29  |     const importAll = page.getByLabel("ייבא הכל מחדש");
  30  |     if (await importAll.isVisible()) await importAll.check();
  31  | 
  32  |     await page.getByRole("button", { name: "המשך" }).click();
  33  | 
  34  |     // Wait for the import summary (green or orange box)
  35  |     await expect(page.getByText("ייבוא הסתיים")).toBeVisible({ timeout: 90_000 });
  36  | 
  37  |     // Assert that recordings were processed (created or already existed)
  38  |     const summaryText = await page.getByText(/הקלטות:/).textContent();
  39  |     // Fixture has 2 voice notes: expect "2 חדשות" on first run, "2 כבר קיימות" on re-run
  40  |     expect(summaryText).toMatch(/הקלטות:/);
  41  |     // No timeout errors — the error count should be 0 or the summary should exist
  42  |     await expect(page.getByText("35 נכשלו")).not.toBeVisible();
  43  |   });
  44  | 
  45  |   test("shows missing-audio warning when ZIP has no media files", async ({ page }) => {
  46  |     // Create a ZIP with only _chat.txt and no audio files (via page.evaluate)
  47  |     const textOnlyZipBase64 = await page.evaluate(async () => {
  48  |       // Build a minimal ZIP in the browser using the already-loaded JSZip
  49  |       // If JSZip isn't available as a global, we construct a bare-minimum ZIP binary
  50  |       // that contains only _chat.txt with an attachment reference.
  51  |       const LRM = "‎";
  52  |       const chat = `${LRM}[01/01/2026, 12:00:00] Teacher: ${LRM}<attached: missing.wav>`;
  53  |       const enc = new TextEncoder().encode(chat);
  54  | 
  55  |       // Minimal ZIP: local file header + file data + central directory + EOCD
  56  |       function u16(n: number) {
  57  |         const b = new Uint8Array(2);
  58  |         new DataView(b.buffer).setUint16(0, n, true);
  59  |         return b;
  60  |       }
  61  |       function u32(n: number) {
  62  |         const b = new Uint8Array(4);
  63  |         new DataView(b.buffer).setUint32(0, n, true);
  64  |         return b;
  65  |       }
  66  |       const name = new TextEncoder().encode("_chat.txt");
  67  |       const localHeader = new Uint8Array([
  68  |         0x50, 0x4b, 0x03, 0x04, // local sig
  69  |         0x14, 0x00,             // version
  70  |         0x00, 0x00,             // flags
  71  |         0x00, 0x00,             // compression: stored
  72  |         0x00, 0x00, 0x00, 0x00, // mod time/date
  73  |         0x00, 0x00, 0x00, 0x00, // crc32 (skip)
  74  |         ...u32(enc.length),     // compressed size
  75  |         ...u32(enc.length),     // uncompressed size
  76  |         ...u16(name.length),    // name length
  77  |         0x00, 0x00,             // extra length
  78  |         ...name,
  79  |         ...enc,
  80  |       ]);
  81  |       const cdHeader = new Uint8Array([
  82  |         0x50, 0x4b, 0x01, 0x02,
  83  |         0x14, 0x00, 0x14, 0x00, 0x00, 0x00, 0x00, 0x00,
  84  |         0x00, 0x00, 0x00, 0x00,
  85  |         0x00, 0x00, 0x00, 0x00, // crc32
  86  |         ...u32(enc.length),
  87  |         ...u32(enc.length),
  88  |         ...u16(name.length),
  89  |         0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  90  |         0x00, 0x00, 0x00, 0x00,
  91  |         ...name,
  92  |       ]);
  93  |       const cdOffset = localHeader.length;
  94  |       const eocd = new Uint8Array([
  95  |         0x50, 0x4b, 0x05, 0x06,
  96  |         0x00, 0x00, 0x00, 0x00,
  97  |         0x01, 0x00, 0x01, 0x00,
  98  |         ...u32(cdHeader.length),
  99  |         ...u32(cdOffset),
  100 |         0x00, 0x00,
  101 |       ]);
  102 |       const blob = new Blob([localHeader, cdHeader, eocd], { type: "application/zip" });
  103 |       const ab = await blob.arrayBuffer();
  104 |       const bytes = new Uint8Array(ab);
  105 |       let bin = "";
  106 |       bytes.forEach((b) => (bin += String.fromCharCode(b)));
  107 |       return btoa(bin);
  108 |     });
  109 | 
  110 |     // Inject the ZIP as a File into the hidden input
  111 |     await page.evaluate((b64) => {
  112 |       const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  113 |       const file = new File([bytes], "text-only.zip", { type: "application/zip" });
  114 |       const dt = new DataTransfer();
  115 |       dt.items.add(file);
  116 |       const input = document.querySelector<HTMLInputElement>('input[accept=".zip"]');
  117 |       if (!input) throw new Error("input not found");
  118 |       Object.defineProperty(input, "files", { value: dt.files });
  119 |       input.dispatchEvent(new Event("change", { bubbles: true }));
  120 |     }, textOnlyZipBase64);
  121 | 
  122 |     await page.getByRole("button", { name: "פתח קובץ" }).click();
  123 |     await expect(page.getByText(/הקלטות שאינן בקובץ/)).toBeVisible({ timeout: 15_000 });
  124 |   });
  125 | });
  126 | 
```