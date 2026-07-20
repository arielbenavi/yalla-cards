import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("ar_to_he direction toggle", () => {
  test("toggle ar_to_he on one card, verify state, toggle off, verify removed", async ({ page }) => {
    await login(page);
    await page.goto("/browse");

    // Switch to list mode
    await page.getByRole("button", { name: "רשימה" }).click();

    // Wait for cards to load (network idle)
    await page.waitForLoadState("networkidle");

    // Check cards are present
    const toggles = page.locator('[data-testid="ar-to-he-toggle"]');
    const count = await toggles.count();
    if (count === 0) {
      // No cards in DB — skip gracefully
      return;
    }

    const firstToggle = toggles.first();

    // Determine initial state
    const initialChecked = (await firstToggle.getAttribute("aria-checked")) === "true";

    // If already ON, toggle OFF first so we start from a known OFF state
    if (initialChecked) {
      await firstToggle.click();
      await expect(firstToggle).toHaveAttribute("aria-checked", "false", { timeout: 10_000 });
    }

    // --- Toggle ON ---
    await firstToggle.click();
    await expect(firstToggle).toHaveAttribute("aria-checked", "true", { timeout: 10_000 });

    // --- Toggle OFF ---
    await firstToggle.click();
    await expect(firstToggle).toHaveAttribute("aria-checked", "false", { timeout: 10_000 });
  });
});
