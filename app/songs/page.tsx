"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Song = {
  id: string;
  title: string;
  artist: string;
  youtube_url: string | null;
  cover_url: string | null;
  created_at: string;
};

export default function SongsPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/songs")
      .then((r) => r.json())
      .then((d) => setSongs(d.songs ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <span className="text-gray-500">טוען...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">שירים</h1>
        <Link
          href="/songs/admin"
          className="text-sm bg-black text-white px-3 py-1.5 rounded hover:bg-gray-800 transition-colors"
        >
          + הוסף שיר
        </Link>
      </div>

      {songs.length === 0 ? (
        <p className="text-gray-500 text-center py-12">אין עדיין שירים. הוסף שיר ראשון!</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {songs.map((song) => (
            <Link
              key={song.id}
              href={`/songs/${song.id}`}
              className="group flex flex-col gap-2"
            >
              {/* YouTube thumbnails are 16:9 and album art is square, so the
                  frame is fixed and the image is cropped to fill it */}
              <div className="aspect-square w-full overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
                {song.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={song.cover_url}
                    alt={song.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="text-4xl">🎵</span>
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="truncate font-semibold leading-tight">{song.title}</div>
                <div className="truncate text-sm text-gray-500">{song.artist}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
