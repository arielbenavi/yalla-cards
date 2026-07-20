"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SongAdminPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [lyricsRaw, setLyricsRaw] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "processing" | "done" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !artist.trim() || !lyricsRaw.trim()) return;

    setSubmitting(true);
    setStatus("processing");

    try {
      const res = await fetch("/api/songs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          artist: artist.trim(),
          lyrics_raw: lyricsRaw.trim(),
          youtube_url: youtubeUrl.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "שגיאה");
      }

      const { id } = await res.json();
      setStatus("done");
      setTimeout(() => router.push(`/songs/${id}`), 800);
    } catch (err) {
      console.error(err);
      setStatus("error");
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">הוספת שיר חדש</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">שם השיר</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border rounded px-3 py-2 text-right"
            placeholder="YAMA"
            required
            disabled={submitting}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">אמן</label>
          <input
            type="text"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            className="border rounded px-3 py-2 text-right"
            placeholder="Dystinct"
            required
            disabled={submitting}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">קישור YouTube (אופציונלי)</label>
          <input
            type="url"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            className="border rounded px-3 py-2 text-right"
            placeholder="https://youtube.com/watch?v=..."
            disabled={submitting}
            dir="ltr"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">הדבק מילות שיר</label>
          <p className="text-xs text-gray-500">
            הדבק את מילות השיר בערבית. אפשר לכלול תרגום עברי לצד כל שורה.
          </p>
          <textarea
            value={lyricsRaw}
            onChange={(e) => setLyricsRaw(e.target.value)}
            className="border rounded px-3 py-2 min-h-[200px] resize-y"
            placeholder={"يا ما\nיא מא\nيا ما راودت نفسي\nיא מא – נפשי התאוותה..."}
            required
            disabled={submitting}
            dir="auto"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !title.trim() || !artist.trim() || !lyricsRaw.trim()}
          className="bg-black text-white px-4 py-2 rounded font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? "שולח..." : "הוסף שיר"}
        </button>

        {status === "processing" && (
          <p className="text-center text-gray-600">נשלח לעיבוד — מנתח מילים עם AI...</p>
        )}
        {status === "done" && (
          <p className="text-center text-green-600">בוצע! מעביר לדף השיר...</p>
        )}
        {status === "error" && (
          <p className="text-center text-red-600">משהו השתבש. נסה שוב.</p>
        )}
      </form>
    </div>
  );
}
