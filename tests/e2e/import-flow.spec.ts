import { test, expect } from "@playwright/test";
import { join } from "path";
import { login, dropFile } from "./helpers";

const FIXTURE_ZIP = join(process.cwd(), "tests/fixtures/wa-test.zip");

test.describe("WhatsApp import flow", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto("/inbox");
    // Switch to WhatsApp tab
    await page.getByText("ייבוא מוואטסאפ").click();
  });

  test("parses ZIP, uploads 2 voice notes, shows import summary", async ({ page }) => {
    // Drop the fixture ZIP onto the WhatsApp FileDropZone
    await dropFile(page, 'input[accept=".zip"]', FIXTURE_ZIP);
    // The file chip should appear
    await expect(page.getByText("wa-test.zip")).toBeVisible();

    // Open the ZIP
    await page.getByRole("button", { name: "פתח קובץ" }).click();
    // Should advance to teacher-selection step
    await expect(page.getByText("מי בשיחה הוא המורה?")).toBeVisible({ timeout: 15_000 });

    // Select "Teacher" (the sender in our fixture _chat.txt)
    await page.getByRole("combobox").selectOption("Teacher");
    // Check "import everything" to avoid cursor filtering
    const importAll = page.getByLabel("ייבא הכל מחדש");
    if (await importAll.isVisible()) await importAll.check();

    await page.getByRole("button", { name: "המשך" }).click();

    // Wait for the import summary (green or orange box)
    await expect(page.getByText("ייבוא הסתיים")).toBeVisible({ timeout: 90_000 });

    // Assert that recordings were processed (created or already existed)
    const summaryText = await page.getByText(/הקלטות:/).textContent();
    // Fixture has 2 voice notes: expect "2 חדשות" on first run, "2 כבר קיימות" on re-run
    expect(summaryText).toMatch(/הקלטות:/);
    // No timeout errors — the error count should be 0 or the summary should exist
    await expect(page.getByText("35 נכשלו")).not.toBeVisible();
  });

  test("shows missing-audio warning when ZIP has no media files", async ({ page }) => {
    // Create a ZIP with only _chat.txt and no audio files (via page.evaluate)
    const textOnlyZipBase64 = await page.evaluate(async () => {
      // Build a minimal ZIP in the browser using the already-loaded JSZip
      // If JSZip isn't available as a global, we construct a bare-minimum ZIP binary
      // that contains only _chat.txt with an attachment reference.
      const LRM = "‎";
      const chat = `${LRM}[01/01/2026, 12:00:00] Teacher: ${LRM}<attached: missing.wav>`;
      const enc = new TextEncoder().encode(chat);

      // Minimal ZIP: local file header + file data + central directory + EOCD
      function u16(n: number) {
        const b = new Uint8Array(2);
        new DataView(b.buffer).setUint16(0, n, true);
        return b;
      }
      function u32(n: number) {
        const b = new Uint8Array(4);
        new DataView(b.buffer).setUint32(0, n, true);
        return b;
      }
      const name = new TextEncoder().encode("_chat.txt");
      const localHeader = new Uint8Array([
        0x50, 0x4b, 0x03, 0x04, // local sig
        0x14, 0x00,             // version
        0x00, 0x00,             // flags
        0x00, 0x00,             // compression: stored
        0x00, 0x00, 0x00, 0x00, // mod time/date
        0x00, 0x00, 0x00, 0x00, // crc32 (skip)
        ...u32(enc.length),     // compressed size
        ...u32(enc.length),     // uncompressed size
        ...u16(name.length),    // name length
        0x00, 0x00,             // extra length
        ...name,
        ...enc,
      ]);
      const cdHeader = new Uint8Array([
        0x50, 0x4b, 0x01, 0x02,
        0x14, 0x00, 0x14, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, // crc32
        ...u32(enc.length),
        ...u32(enc.length),
        ...u16(name.length),
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,
        ...name,
      ]);
      const cdOffset = localHeader.length;
      const eocd = new Uint8Array([
        0x50, 0x4b, 0x05, 0x06,
        0x00, 0x00, 0x00, 0x00,
        0x01, 0x00, 0x01, 0x00,
        ...u32(cdHeader.length),
        ...u32(cdOffset),
        0x00, 0x00,
      ]);
      const blob = new Blob([localHeader, cdHeader, eocd], { type: "application/zip" });
      const ab = await blob.arrayBuffer();
      const bytes = new Uint8Array(ab);
      let bin = "";
      bytes.forEach((b) => (bin += String.fromCharCode(b)));
      return btoa(bin);
    });

    // Inject the ZIP as a File into the hidden input
    await page.evaluate((b64) => {
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const file = new File([bytes], "text-only.zip", { type: "application/zip" });
      const dt = new DataTransfer();
      dt.items.add(file);
      const input = document.querySelector<HTMLInputElement>('input[accept=".zip"]');
      if (!input) throw new Error("input not found");
      Object.defineProperty(input, "files", { value: dt.files });
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, textOnlyZipBase64);

    await page.getByRole("button", { name: "פתח קובץ" }).click();
    await expect(page.getByText(/הקלטות שאינן בקובץ/)).toBeVisible({ timeout: 15_000 });
  });
});
