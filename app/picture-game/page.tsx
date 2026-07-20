"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Scene = { id: string; title: string; image_path: string };

export default function PictureGameListPage() {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/picture-scenes").then((r) => r.json());
      const list: Scene[] = res.scenes ?? [];
      setScenes(list);
      setLoading(false);

      // Fetch signed URLs for thumbnails in parallel
      const entries = await Promise.all(
        list.map(async (s) => {
          const r = await fetch("/api/pictures/signed-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path: s.image_path }),
          }).then((x) => x.json());
          return [s.id, r.url as string] as const;
        })
      );
      setThumbUrls(Object.fromEntries(entries));
    }
    load();
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">משחק תמונות</h1>
        <Link
          href="/picture-game/admin"
          className="text-sm text-blue-600 hover:underline"
        >
          עריכה (מנהל)
        </Link>
      </div>

      {loading && <p className="text-gray-500">טוען...</p>}

      {!loading && scenes.length === 0 && (
        <p className="text-gray-500">אין סצנות עדיין. הוסף סצנה בממשק המנהל.</p>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {scenes.map((scene) => (
          <Link
            key={scene.id}
            href={`/picture-game/${scene.id}`}
            className="block rounded-xl overflow-hidden shadow hover:shadow-md transition-shadow border"
          >
            {thumbUrls[scene.id] ? (
              <img
                src={thumbUrls[scene.id]}
                alt={scene.title}
                className="w-full h-36 object-cover"
              />
            ) : (
              <div className="w-full h-36 bg-gray-200 animate-pulse" />
            )}
            <div className="p-2 text-center font-bold">{scene.title}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
