import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { login } from "./helpers";

dotenv.config({ path: ".env.local" });

function adminClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
    realtime: { transport: class {} as any },
  });
}

test.describe("picture game", () => {
  test("every scene has hotzones and a reachable image", async ({ page }) => {
    await login(page);

    // Both tables were empty for the entire life of the feature and nothing
    // said so — the screen just rendered nothing. This is the check that would
    // have caught it.
    const { scenes } = await page.request.get("/api/picture-scenes").then((r) => r.json());
    expect(scenes.length, "no scenes seeded").toBeGreaterThan(0);

    for (const s of scenes) {
      const signed = await page.request.post("/api/pictures/signed-url", {
        data: { path: s.image_path },
      });
      expect(signed.ok(), `no signed URL for ${s.title}`).toBe(true);

      const detail = await page.request.get(`/api/picture-scenes/${s.id}`).then((r) => r.json());
      expect(detail.hotzones?.length ?? 0, `${s.title} has no hotzones`).toBeGreaterThan(0);
    }
  });

  test("hotzones sit inside the image and carry all three scripts", async () => {
    const sb = adminClient();
    const { data: zones } = await sb.from("picture_hotzones").select("*");

    expect(zones?.length).toBeGreaterThan(0);
    for (const z of zones ?? []) {
      // A coordinate outside 0..1 is a click target the learner can never hit
      expect(z.x_pct, `${z.label_he} x out of frame`).toBeGreaterThan(0);
      expect(z.x_pct).toBeLessThan(1);
      expect(z.y_pct, `${z.label_he} y out of frame`).toBeGreaterThan(0);
      expect(z.y_pct).toBeLessThan(1);

      expect(z.label_he?.trim(), "missing Hebrew").toBeTruthy();
      expect(z.label_ar?.trim(), `${z.label_he} missing Arabic`).toBeTruthy();
      expect(z.translit?.trim(), `${z.label_he} missing transliteration`).toBeTruthy();

      // The scripts must not be swapped — this has happened in three other
      // tables on this project
      expect(/[ء-ي]/.test(z.label_ar), `${z.label_he}: Arabic field is not Arabic`).toBe(true);
      expect(/[א-ת]/.test(z.translit), `${z.label_he}: transliteration is not Hebrew`).toBe(true);
      expect(/[ء-ي]/.test(z.translit), `${z.label_he}: Arabic inside the transliteration`).toBe(
        false
      );
    }
  });

  test("no two hotzones in a scene overlap", async () => {
    const sb = adminClient();
    const { data: zones } = await sb.from("picture_hotzones").select("*");

    const byScene = new Map<string, typeof zones>();
    for (const z of zones ?? []) {
      if (!byScene.has(z.scene_id)) byScene.set(z.scene_id, []);
      byScene.get(z.scene_id)!.push(z);
    }

    // Overlapping targets make the game unwinnable in a way that looks like the
    // learner being wrong rather than the data being wrong.
    for (const [scene, list] of byScene) {
      for (let i = 0; i < list!.length; i++) {
        for (let j = i + 1; j < list!.length; j++) {
          const a = list![i];
          const b = list![j];
          // Aspect-corrected: radius is a fraction of width, y is of height
          const dx = a.x_pct - b.x_pct;
          const dy = ((a.y_pct - b.y_pct) * 600) / 800;
          const dist = Math.hypot(dx, dy);
          expect(
            dist,
            `${scene}: ${a.label_he} and ${b.label_he} overlap`
          ).toBeGreaterThan((a.radius_pct + b.radius_pct) * 0.5);
        }
      }
    }
  });
});
