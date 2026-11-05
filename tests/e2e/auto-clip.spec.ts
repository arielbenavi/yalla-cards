import { test, expect } from "@playwright/test";
import { login } from "./helpers";

// Everything the screen reads and writes is mocked, so this never touches a real
// card or the real queue. Clip upload is mocked too.
function wav(seconds: number) {
  const rate = 8000;
  const data = Buffer.alloc(rate * seconds * 2);
  for (let i = 0; i < rate * seconds; i++) data.writeInt16LE(Math.round(Math.sin(i / 8) * 8000), i * 2);
  const h = Buffer.alloc(44);
  h.write("RIFF", 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write("WAVEfmt ", 8);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22);
  h.writeUInt32LE(rate, 24);
  h.writeUInt32LE(rate * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write("data", 36);
  h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}

const item = (id: string, confidence: number, translit: string) => ({
  id,
  card_id: `card-${id}`,
  recording_id: "rec-1",
  start: 2,
  end: 3,
  confidence,
  signals: { heard: "مرحبا", meaning_near: true },
  translit_nikud: translit,
  arabic_script: "مرحبا",
  hebrew_meaning: "שלום",
  recording_title: "הקלטה לדוגמה",
  audio_url: "http://localhost:3000/mock-audio.wav",
  context: [{ word: "לפני", inside: false }, { word: "مرحبا", inside: true }],
});

test("the queue shows the surest guess, nudges replay, approve sends the moved edges", async ({ page }) => {
  await login(page);
  const patches: { url: string; body: Record<string, unknown> }[] = [];
  let items = [item("a", 0.93, "מַרְחַבַּא"), item("b", 0.41, "שוּ")];

  await page.route("**/mock-audio.wav", (r) => r.fulfill({ body: wav(8), contentType: "audio/wav" }));
  await page.route("**/api/clip-suggestions?**", (r) =>
    r.fulfill({ json: { remaining: items.length, bands: [{ label: "high", approved: 3, rejected: 1 }], items } })
  );
  await page.route("**/api/clip-suggestions/*", async (r) => {
    patches.push({ url: r.request().url(), body: r.request().postDataJSON() });
    items = items.slice(1);
    await r.fulfill({ json: { ok: true } });
  });
  await page.route("**/api/recordings/upload-url", (r) => r.fulfill({ json: { path: "clip.wav", token: "t" } }));
  await page.route("**/storage/v1/object/upload/sign/**", (r) => r.fulfill({ json: { Key: "recordings/clip.wav" } }));

  await page.goto("/recordings/auto", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("מַרְחַבַּא")).toBeVisible();
  await expect(page.getByTestId("confidence")).toHaveText("93%");
  await expect(page.getByText("בטוח 3/4")).toBeVisible();
  await expect(page.getByTestId("waveform")).toBeVisible();

  await page.getByRole("button", { name: "התחלה +0.1" }).click();
  await page.getByRole("button", { name: "סיום +0.5" }).click();
  await expect(page.getByTestId("edge-התחלה")).toHaveText("2.10s");
  await expect(page.getByTestId("edge-סיום")).toHaveText("3.50s");

  await page.getByRole("button", { name: "✓ אשר" }).click();
  await expect(page.getByText("שוּ")).toBeVisible();
  expect(patches[0].url).toContain("/api/clip-suggestions/a");
  expect(patches[0].body).toMatchObject({ action: "approve", start: 2.1, end: 3.5, clip_path: "clip.wav" });

  await page.getByRole("button", { name: "✗ לא זה" }).click();
  await expect.poll(() => patches[1]?.body.action).toBe("reject");
  await expect(page.getByText("אין כרטיסים שמחכים לאישור")).toBeVisible();
});

test("a card that got its clip does not come back, even from a refill that raced the approval", async ({ page }) => {
  await login(page);
  const first = item("a", 0.93, "מַרְחַבַּא");
  const sameCardNextGuess = { ...item("a2", 0.8, "מַרְחַבַּא שוב"), card_id: first.card_id };
  let items = [first, item("b", 0.5, "שוּ")];

  await page.route("**/mock-audio.wav", (r) => r.fulfill({ body: wav(8), contentType: "audio/wav" }));
  await page.route("**/api/clip-suggestions?**", (r) => r.fulfill({ json: { remaining: items.length, bands: [], items } }));
  await page.route("**/api/clip-suggestions/*", async (r) => {
    // What a refill sent just before the approval landed still carries the card's next guess
    items = [sameCardNextGuess, item("b", 0.5, "שוּ")];
    await r.fulfill({ json: { ok: true } });
  });
  await page.route("**/api/recordings/upload-url", (r) => r.fulfill({ json: { path: "clip.wav", token: "t" } }));
  await page.route("**/storage/v1/object/upload/sign/**", (r) => r.fulfill({ json: { Key: "recordings/clip.wav" } }));

  await page.goto("/recordings/auto", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("waveform")).toBeVisible();
  await page.getByRole("button", { name: "✓ אשר" }).click();
  await expect(page.getByText("שוּ")).toBeVisible();
  await expect(page.getByText("מַרְחַבַּא שוב")).toHaveCount(0);
});
