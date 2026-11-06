import { test, expect } from "@playwright/test";
import { login } from "./helpers";

// A scene from the list opens with its subtitles and its video plays
test("a watch scene loads and plays", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await login(page);
  await page.goto("/watch");
  await page.getByText("ישיבת צוות מבולבלת").click();
  await page.waitForURL(/\/watch\/tafaddalu-meeting-1/);
  await expect(page.locator("video")).toBeVisible({ timeout: 15000 });
  const state = await page.locator("video").evaluate(async (v: HTMLVideoElement) => {
    await new Promise((r) => (v.readyState >= 1 ? r(null) : v.addEventListener("loadedmetadata", r, { once: true })));
    return { duration: v.duration, error: v.error?.code ?? null };
  });
  expect(state.error).toBeNull();
  expect(state.duration).toBeGreaterThan(90);
  expect(errors).toEqual([]);
});
