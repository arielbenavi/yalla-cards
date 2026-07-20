"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Rating } from "ts-fsrs";

type LyricWord = { ar: string; he: string; translit: string };
type LyricLine = { line: string; words: LyricWord[] };

type Song = {
  id: string;
  title: string;
  artist: string;
  lyrics_raw: string;
  lyrics_parsed: LyricLine[] | null;
  youtube_url: string | null;
  cover_url: string | null;
};

type DrillItem = {
  srs_id: string;
  word_index: number;
  ar: string;
  he: string;
  translit: string;
  state: number;
};

type PopupState = {
  word: LyricWord;
  x: number;
  y: number;
} | null;

function getYoutubeEmbedId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
    return u.searchParams.get("v");
  } catch {
    return null;
  }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildOptions(correct: string, allWords: LyricWord[]): string[] {
  const distractors = shuffle(
    allWords
      .map((w) => w.he)
      .filter((h) => h && h !== correct)
      .filter((v, i, a) => a.indexOf(v) === i)
  ).slice(0, 3);

  while (distractors.length < 3) {
    distractors.push("—");
  }

  return shuffle([correct, ...distractors]);
}

export default function SongDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [popup, setPopup] = useState<PopupState>(null);
  const [drillMode, setDrillMode] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [drillItems, setDrillItems] = useState<DrillItem[]>([]);
  const [allWords, setAllWords] = useState<LyricWord[]>([]);
  const [drillIndex, setDrillIndex] = useState(0);
  const [drillLoading, setDrillLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [drillDone, setDrillDone] = useState(false);

  useEffect(() => {
    fetch(`/api/songs/${id}`)
      .then((r) => r.json())
      .then((d) => setSong(d.song ?? null))
      .finally(() => setLoading(false));
  }, [id]);

  // Close popup on outside click
  useEffect(() => {
    if (!popup) return;
    const handler = () => setPopup(null);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [popup]);

  const handleWordClick = useCallback(
    (e: React.MouseEvent, word: LyricWord) => {
      e.stopPropagation();
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setPopup({ word, x: rect.left + rect.width / 2, y: rect.bottom + window.scrollY + 8 });
    },
    []
  );

  async function startDrill() {
    if (!song) return;
    setEnrolling(true);

    // Enroll first
    await fetch(`/api/songs/${id}/enroll`, { method: "POST" });

    // Fetch due items
    setDrillLoading(true);
    const res = await fetch(`/api/songs/${id}/review`);
    const data = await res.json();
    setDrillLoading(false);
    setEnrolling(false);

    const items: DrillItem[] = data.items ?? [];
    const words: LyricWord[] = data.all_words ?? [];

    if (items.length === 0) {
      alert("אין מילים לתרגול כרגע. נסה שוב מאוחר יותר.");
      return;
    }

    setAllWords(words);
    setDrillItems(items);
    setDrillIndex(0);
    setDrillDone(false);
    setSelected(null);
    setOptions(buildOptions(items[0].he, words));
    setDrillMode(true);
  }

  async function submitAnswer(chosen: string) {
    if (selected !== null) return; // already answered
    setSelected(chosen);

    const current = drillItems[drillIndex];
    const correct = chosen === current.he;
    const rating: Rating = correct ? Rating.Good : Rating.Again;

    await fetch(`/api/songs/${id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ srs_id: current.srs_id, rating }),
    });

    setTimeout(() => {
      const next = drillIndex + 1;
      if (next >= drillItems.length) {
        setDrillDone(true);
      } else {
        setDrillIndex(next);
        setSelected(null);
        setOptions(buildOptions(drillItems[next].he, allWords));
      }
    }, 1000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <span className="text-gray-500">טוען...</span>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <p className="text-red-500">שיר לא נמצא.</p>
        <button onClick={() => router.push("/songs")} className="mt-4 text-sm underline">
          חזרה לשירים
        </button>
      </div>
    );
  }

  const flatWords = song.lyrics_parsed?.flatMap((l) => l.words) ?? [];
  const youtubeId = song.youtube_url ? getYoutubeEmbedId(song.youtube_url) : null;

  // --- DRILL MODE ---
  if (drillMode) {
    if (drillLoading) {
      return (
        <div className="flex items-center justify-center p-16">
          <span className="text-gray-500">טוען תרגול...</span>
        </div>
      );
    }

    if (drillDone) {
      return (
        <div className="max-w-md mx-auto p-8 text-center">
          <div className="text-4xl mb-4">🎉</div>
          <h2 className="text-xl font-bold mb-2">כל הכבוד!</h2>
          <p className="text-gray-600 mb-6">סיימת את תרגול המילים להיום.</p>
          <button
            onClick={() => setDrillMode(false)}
            className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 transition-colors"
          >
            חזרה לשיר
          </button>
        </div>
      );
    }

    const current = drillItems[drillIndex];
    if (!current) return null;

    return (
      <div className="max-w-md mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setDrillMode(false)} className="text-sm text-gray-500 underline">
            חזרה לשיר
          </button>
          <span className="text-sm text-gray-500">
            {drillIndex + 1} / {drillItems.length}
          </span>
        </div>

        <div className="border rounded-xl p-8 text-center mb-6">
          <p className="text-sm text-gray-400 mb-2">מה המשמעות של</p>
          <p className="text-4xl font-bold mb-1" dir="rtl">
            {current.ar}
          </p>
          <p className="text-gray-500 text-sm" dir="ltr">
            {current.translit}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {options.map((opt) => {
            let cls =
              "border rounded-lg px-4 py-3 text-center font-medium transition-colors cursor-pointer ";
            if (selected !== null) {
              if (opt === current.he) {
                cls += "bg-green-100 border-green-500 text-green-800";
              } else if (opt === selected) {
                cls += "bg-red-100 border-red-500 text-red-800";
              } else {
                cls += "opacity-40";
              }
            } else {
              cls += "hover:bg-gray-50 dark:hover:bg-gray-800";
            }
            return (
              <button key={opt} className={cls} onClick={() => submitAnswer(opt)}>
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // --- SONG VIEW ---
  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Back */}
      <button onClick={() => router.push("/songs")} className="text-sm text-gray-500 underline mb-4 block">
        ← שירים
      </button>

      {/* Song header */}
      <h1 className="text-3xl font-bold mb-1">{song.title}</h1>
      <p className="text-gray-500 mb-6">{song.artist}</p>

      {/* YouTube embed */}
      {youtubeId && (
        <div className="aspect-video mb-6 rounded-xl overflow-hidden">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={song.title}
          />
        </div>
      )}

      {/* Start drill button */}
      <button
        onClick={startDrill}
        disabled={enrolling || !song.lyrics_parsed}
        className="w-full bg-black text-white px-4 py-3 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-6"
      >
        {enrolling ? "מכין תרגול..." : "התחל תרגול"}
      </button>

      {!song.lyrics_parsed && (
        <p className="text-center text-sm text-amber-600 mb-4">
          המילים עדיין מעובדות. רענן את הדף תוך מספר שניות.
        </p>
      )}

      {/* Lyrics */}
      {song.lyrics_parsed ? (
        <div className="space-y-4 relative" dir="rtl">
          {song.lyrics_parsed.map((line, li) => (
            <div key={li} className="leading-relaxed">
              <div className="flex flex-wrap gap-1.5">
                {line.words.map((word, wi) => (
                  <button
                    key={wi}
                    onClick={(e) => handleWordClick(e, word)}
                    className="text-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded px-0.5 transition-colors cursor-pointer"
                    dir="rtl"
                  >
                    {word.ar}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Word popup */}
          {popup && (
            <div
              className="fixed z-50 bg-white dark:bg-gray-900 border rounded-lg shadow-xl p-4 min-w-[160px] text-center"
              style={{
                left: `${popup.x}px`,
                top: `${popup.y}px`,
                transform: "translateX(-50%)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-2xl font-bold mb-1" dir="rtl">
                {popup.word.ar}
              </p>
              <p className="text-base text-gray-700 dark:text-gray-300 mb-1">{popup.word.he}</p>
              <p className="text-sm text-gray-400" dir="ltr">
                {popup.word.translit}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 whitespace-pre-wrap text-sm" dir="rtl">
          {song.lyrics_raw}
        </div>
      )}

      {/* Flat word count note */}
      {flatWords.length > 0 && (
        <p className="mt-6 text-xs text-gray-400 text-center">
          {flatWords.length} מילים בשיר — לחץ על מילה לפרטים
        </p>
      )}
    </div>
  );
}
