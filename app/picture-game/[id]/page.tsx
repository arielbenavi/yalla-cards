"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

type Hotzone = {
  id: string;
  label_ar: string;
  label_he: string;
  translit: string | null;
  x_pct: number;
  y_pct: number;
  radius_pct: number;
};

type Feedback = {
  kind: "correct" | "wrong" | "miss";
  message: string;
  correctZone?: Hotzone;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function PictureGamePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [title, setTitle] = useState<string>("");
  const [hotzones, setHotzones] = useState<Hotzone[]>([]);
  const [order, setOrder] = useState<Hotzone[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [highlightCorrect, setHighlightCorrect] = useState(false);
  const [loading, setLoading] = useState(true);

  const imgRef = useRef<HTMLImageElement>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function load() {
      const sceneRes = await fetch(`/api/picture-scenes/${id}`).then((r) => r.json()) as {
        scene: { id: string; title: string; image_path: string } | null;
        hotzones: Hotzone[];
      };

      const { scene, hotzones: hz } = sceneRes;
      if (!scene) { router.push("/picture-game"); return; }

      setTitle(scene.title);
      setHotzones(hz ?? []);

      const shuffled = shuffle(hz ?? []);
      setOrder(shuffled);

      const urlR = await fetch("/api/pictures/signed-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: scene.image_path }),
      }).then((r) => r.json()) as { url: string | null };
      setImageUrl(urlR.url ?? null);
      setLoading(false);
    }
    load();
  }, [id, router]);

  const clearFeedback = useCallback(() => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = null;
    setFeedback(null);
    setHighlightCorrect(false);
  }, []);

  function advance() {
    clearFeedback();
    const next = currentIdx + 1;
    if (next >= order.length) {
      setDone(true);
    } else {
      setCurrentIdx(next);
    }
  }

  function handleImageClick(e: React.MouseEvent<HTMLImageElement>) {
    if (feedback || done) return;
    if (!imgRef.current || order.length === 0) return;

    const rect = imgRef.current.getBoundingClientRect();
    const x_pct = (e.clientX - rect.left) / rect.width;
    const y_pct = (e.clientY - rect.top) / rect.height;

    const target = order[currentIdx];

    // Check each hotzone
    let hitZone: Hotzone | null = null;
    for (const hz of hotzones) {
      const dx = x_pct - hz.x_pct;
      const dy = (y_pct - hz.y_pct) * (imgRef.current.naturalHeight / imgRef.current.naturalWidth);
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= hz.radius_pct) { hitZone = hz; break; }
    }

    if (!hitZone) {
      // Miss
      setFeedback({ kind: "miss", message: "נסה שוב" });
      feedbackTimer.current = setTimeout(clearFeedback, 1200);
      return;
    }

    if (hitZone.id === target.id) {
      // Correct!
      setScore((s) => s + 1);
      setFeedback({ kind: "correct", message: `כל הכבוד! ${target.label_ar}` });
      feedbackTimer.current = setTimeout(advance, 1500);
    } else {
      // Wrong hotzone — show where the correct one is
      setFeedback({
        kind: "wrong",
        message: `לא נכון! מצא את: ${target.label_he}`,
        correctZone: target,
      });
      setHighlightCorrect(true);
      feedbackTimer.current = setTimeout(advance, 2500);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">טוען...</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 p-8 text-center">
        <div className="text-5xl">🎉</div>
        <h1 className="text-3xl font-bold">כל הכבוד!</h1>
        <p className="text-xl text-gray-600">
          {score}/{order.length}
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => {
              setOrder(shuffle(hotzones));
              setCurrentIdx(0);
              setScore(0);
              setDone(false);
              setFeedback(null);
            }}
            className="bg-blue-600 text-white rounded-lg px-6 py-3 font-bold"
          >
            שחק שוב
          </button>
          <button
            onClick={() => router.push("/picture-game")}
            className="border rounded-lg px-6 py-3 font-bold text-gray-600"
          >
            חזרה
          </button>
        </div>
      </div>
    );
  }

  if (hotzones.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 p-8 text-center">
        <p className="text-gray-500">לסצנה זו אין אזורים. הוסף אזורים בממשק המנהל.</p>
        <button onClick={() => router.push("/picture-game")} className="border rounded px-4 py-2">
          חזרה
        </button>
      </div>
    );
  }

  const current = order[currentIdx];

  return (
    <div className="flex flex-col items-center gap-4 p-4 max-w-3xl mx-auto">
      {/* Header */}
      <div className="w-full flex items-center justify-between">
        <button onClick={() => router.push("/picture-game")} className="text-gray-500 text-sm hover:underline">
          ← חזרה
        </button>
        <span className="font-bold">{title}</span>
        <span className="text-sm text-gray-600">
          {score}/{currentIdx} | {currentIdx + 1}/{order.length}
        </span>
      </div>

      {/* Prompt */}
      <div
        className={`w-full text-center py-3 px-4 rounded-xl text-lg font-bold transition-colors ${
          feedback?.kind === "correct"
            ? "bg-green-100 text-green-800"
            : feedback?.kind === "wrong"
            ? "bg-red-100 text-red-800"
            : feedback?.kind === "miss"
            ? "bg-orange-50 text-orange-700"
            : "bg-blue-50 text-blue-900"
        }`}
      >
        {feedback
          ? feedback.message
          : <>טפ על: <span className="text-blue-700">{current.label_he}</span></>}
      </div>

      {/* Image */}
      {imageUrl && (
        <div className="relative w-full">
          <img
            ref={imgRef}
            src={imageUrl}
            alt={title}
            className="w-full rounded-xl object-contain cursor-pointer select-none"
            onClick={handleImageClick}
            draggable={false}
          />

          {/* Correct zone highlight (when wrong answer) */}
          {highlightCorrect && feedback?.correctZone && (
            <div
              className="absolute rounded-full border-4 border-green-400 bg-green-300 bg-opacity-50 pointer-events-none animate-pulse"
              style={{
                left: `${feedback.correctZone.x_pct * 100}%`,
                top: `${feedback.correctZone.y_pct * 100}%`,
                width: `${feedback.correctZone.radius_pct * 2 * 100}%`,
                aspectRatio: "1",
                transform: "translate(-50%, -50%)",
              }}
            />
          )}

          {/* Correct feedback flash */}
          {feedback?.kind === "correct" && (
            <div
              className="absolute rounded-full border-4 border-green-500 bg-green-400 bg-opacity-60 pointer-events-none"
              style={{
                left: `${current.x_pct * 100}%`,
                top: `${current.y_pct * 100}%`,
                width: `${current.radius_pct * 2 * 100}%`,
                aspectRatio: "1",
                transform: "translate(-50%, -50%)",
              }}
            >
              <span className="flex items-center justify-center h-full text-white font-bold text-xs">✓</span>
            </div>
          )}
        </div>
      )}

      {/* Arabic word hint */}
      {!feedback && current.translit && (
        <p className="text-gray-500 text-sm" dir="ltr">{current.translit}</p>
      )}
    </div>
  );
}
