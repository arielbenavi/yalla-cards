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

// On a phone the line list scrolls, and a tapped word grows into a phrase with an editable meaning
test("watch on a phone: the page scrolls and a phrase can be selected", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 760 });
  await login(page);
  await page.goto("/watch/tafaddalu-meeting-1");
  await expect(page.locator(".watch-lines li").first()).toBeVisible({ timeout: 15000 });
  const scrolled = await page.locator(".watch").evaluate((el) => {
    el.scrollTop = 400;
    return el.scrollTop;
  });
  expect(scrolled).toBeGreaterThan(0);

  await page.locator(".watch-lines li .word-tap").first().click();
  await page.getByRole("button", { name: "+ המילה הבאה" }).click();
  await expect(page.getByTestId("phrase-sheet")).toBeVisible();
  await expect(page.getByTestId("phrase-meaning")).not.toHaveValue("");
  await expect(page.getByTestId("add-phrase")).toBeEnabled();
});
