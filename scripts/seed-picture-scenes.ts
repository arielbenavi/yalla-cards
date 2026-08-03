// Seeds the picture game (note 5e4b20e5) — both tables were completely empty,
// so the screen had nothing to show.
//
// The scenes are drawn, not sourced: scripts/data/picture-scenes.ts defines each
// object once and that single definition places both the artwork and the hotzone.
// A sourced photo would need its click targets positioned by hand against an
// image nobody can re-measure later, and the two would drift apart the first time
// the picture changed.
//
// Idempotent: a scene already present is updated in place rather than duplicated,
// and its hotzones are replaced wholesale so the coordinates always match the SVG
// that was just uploaded.
//
//   npx tsx scripts/seed-picture-scenes.ts          # dry run
//   npx tsx scripts/seed-picture-scenes.ts --apply
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { SCENES, renderScene, W, H } from "./data/picture-scenes";

config({ path: ".env.local" });

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: class {} as any },
});

const APPLY = process.argv.includes("--apply");
const BUCKET = "pictures";

async function ensureBucket() {
  const { data } = await sb.storage.listBuckets();
  if ((data ?? []).some((b) => b.name === BUCKET)) return;
  // The 0015 migration says this has to be made by hand in the dashboard. It
  // does not — the storage API can create it, and leaving it as a manual step is
  // why the feature shipped with no way to add content.
  const { error } = await sb.storage.createBucket(BUCKET, { public: false });
  if (error) throw new Error(`יצירת באקט ${BUCKET} נכשלה: ${error.message}`);
  console.log(`נוצר באקט ${BUCKET}`);
}

async function main() {
  console.log(`${SCENES.length} סצנות · ${SCENES.reduce((n, s) => n + s.items.length, 0)} אזורי לחיצה\n`);
  for (const s of SCENES) {
    console.log(`  ${s.title}`);
    console.log(`    ${s.items.map((i) => `${i.he} (${i.translit})`).join(" · ")}`);
  }

  if (!APPLY) {
    console.log("\ndry run — הוסף --apply כדי לכתוב");
    return;
  }

  await ensureBucket();

  for (const scene of SCENES) {
    const path = `scenes/${scene.slug}.svg`;
    const svg = renderScene(scene);

    const { error: upErr } = await sb.storage
      .from(BUCKET)
      .upload(path, new Blob([svg], { type: "image/svg+xml" }), {
        contentType: "image/svg+xml",
        upsert: true,
      });
    if (upErr) throw new Error(`העלאת ${path} נכשלה: ${upErr.message}`);

    const { data: existing } = await sb
      .from("picture_scenes")
      .select("id")
      .eq("image_path", path)
      .maybeSingle();

    let sceneId = existing?.id;
    if (sceneId) {
      await sb.from("picture_scenes").update({ title: scene.title }).eq("id", sceneId);
      // Replaced rather than merged: the coordinates belong to the SVG that was
      // just written, and a stale hotzone points at empty wall.
      await sb.from("picture_hotzones").delete().eq("scene_id", sceneId);
    } else {
      const { data, error } = await sb
        .from("picture_scenes")
        .insert({ title: scene.title, image_path: path })
        .select("id")
        .single();
      if (error) throw error;
      sceneId = data.id;
    }

    const { error: hzErr } = await sb.from("picture_hotzones").insert(
      scene.items.map((i) => ({
        scene_id: sceneId,
        label_ar: i.ar,
        label_he: i.he,
        translit: i.translit,
        x_pct: (i.hx ?? i.x) / W,
        y_pct: (i.hy ?? i.y) / H,
        radius_pct: i.r,
      }))
    );
    if (hzErr) throw hzErr;

    console.log(`✅ ${scene.title} — ${scene.items.length} אזורים`);
  }
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
