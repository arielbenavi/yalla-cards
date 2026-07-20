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
        <div className="flex flex-col gap-3">
          {songs.map((song) => (
            <Link
              key={song.id}
              href={`/songs/${song.id}`}
              className="block border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center gap-4">
                {song.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={song.cover_url}
                    alt={song.title}
                    className="w-12 h-12 rounded object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🎵</span>
                  </div>
                )}
                <div>
                  <div className="font-semibold">{song.title}</div>
                  <div className="text-sm text-gray-500">{song.artist}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
