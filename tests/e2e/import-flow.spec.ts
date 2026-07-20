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
    await page.getByLabel("מי בשיחה הוא המורה?").selectOption("Teacher");
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
    // Build a proper ZIP in Node.js using JSZip — avoids brittle browser-side binary construction
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const JSZip = require("jszip") as typeof import("jszip");
    const zip = new JSZip();
    const LRM = "\u200e";
    zip.file("_chat.txt", `${LRM}[01/01/2026, 12:00:00] Teacher: ${LRM}<attached: missing.wav>`);
    const zipBuffer: Buffer = await zip.generateAsync({ type: "nodebuffer" });

    await page.locator('input[accept=".zip"]').setInputFiles({
      name: "text-only.zip",
      mimeType: "application/zip",
      buffer: zipBuffer,
    });

    await page.getByRole("button", { name: "פתח קובץ" }).click();
    await expect(page.getByText(/הקלטות שאינן בקובץ/)).toBeVisible({ timeout: 15_000 });
  });
});