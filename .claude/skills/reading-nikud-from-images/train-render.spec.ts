import { test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "fs";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const OUT = "/tmp/nikud-train"; // set to a scratchpad folder

test("render", async ({ page }) => {
  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: class {} as never } });
  const rows: { translit_nikud: string }[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("cards").select("translit_nikud").eq("chatifai_verified", true).range(f, f + 999);
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  const pool = [...new Set(rows.map((r) => r.translit_nikud.trim()))].filter((t) => t.split(/\s+/).length <= 3 && /[ְ-ׇ]/.test(t) && !/[=()؀-ۿ/]/.test(t));
  const pick = pool.sort(() => Math.random() - 0.5).slice(0, 100);
  writeFileSync(`${OUT}/answers.json`, JSON.stringify(pick));
  await page.setViewportSize({ width: 1500, height: 900 });
  await page.setContent(`<html dir=rtl><body style="margin:0;background:#fff"><div id=g style="display:grid;grid-template-columns:repeat(2,1fr);gap:0 20px;font:bold 25px 'Times New Roman',serif;padding:10px;width:1400px"></div></body></html>`);
  await page.evaluate((w) => {
    const g = document.getElementById("g")!;
    w.forEach((t: string, i: number) => {
      const d = document.createElement("div");
      d.style.cssText = "height:56px;line-height:56px;white-space:nowrap;border-bottom:1px solid #ddd";
      d.innerHTML = `<span style="font:12px Arial;color:#888;margin-left:14px">${i + 1}</span>`;
      d.append(t);
      g.append(d);
    });
  }, pick);
  await page.locator("#g").screenshot({ path: `${OUT}/all.png` });
});
