import { Page } from "@playwright/test";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

export const APP_PASSWORD = process.env.APP_PASSWORD ?? "";

/** Log in and land on /review (or wherever the app redirects after auth). */
export async function login(page: Page) {
  await page.goto("/login");
  await page.locator('input[type="password"]').fill(APP_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/(review|inbox|recordings)/);
}

/**
 * Set files on a FileDropZone by targeting its hidden <input type="file">.
 * selector: a CSS selector that uniquely identifies the drop zone's container.
 */
export async function dropFile(page: Page, inputSelector: string, ...paths: string[]) {
  await page.locator(inputSelector).setInputFiles(paths);
}
