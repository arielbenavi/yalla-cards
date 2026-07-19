"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Rating } from "ts-fsrs";
import { strings } from "@/lib/strings";

type ReviewCard = {
  card_srs_id: string;
  direction: "he_to_ar" | "ar_to_he";
  card_id: string;
  hebrew_meaning: string;
  translit_nikud: string;
  arabic_script: string | null;
  item_type: string;
  notes: string | null;
  audio_url: string | null;
};

type Queue = {
  cards: ReviewCard[];
  remaining_due: number;
  remaining_new: number;
};

function AudioIconButton({ onClick, size = "large" }: { onClick: () => void; size?: "large" | "small" }) {
  const dim = size === "large" ? "h-24 w-24" : "h-14 w-14";
  return (
    <button
      onClick={onClick}
      aria-label={strings.review.playAudio}
      className={`flex ${dim} items-center justify-center rounded-full bg-black text-white active:bg-gray-800`}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className={size === "large" ? "h-12 w-12" : "h-7 w-7"}>
        <path d="M3 9v6h4l5 5V4L7 9H3z" />
        <path d="M16.5 12a4.5 4.5 0 0 0-2.5-4.03v8.06A4.5 4.5 0 0 0 16.5 12z" />
        <path d="M14 4.35v2.1a7 7 0 0 1 0 11.1v2.1a9 9 0 0 0 0-15.3z" />
      </svg>
    </button>
  );
}

function ReviewPageInner() {
  const searchParams = useSearchParams();
  const modeAll = searchParams.get("mode") === "all";
  const idsParam = searchParams.get("ids") ?? "";
  const modeSelected = !!idsParam;

  const [queue, setQueue] = useState<Queue | null>(null);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [grading, setGrading] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [dirFlipped, setDirFlipped] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const loadQueue = useCallback(async () => {
    const url = modeSelected
      ? `/api/review/queue?mode=selected&ids=${idsParam}`
      : modeAll
      ? "/api/review/queue?mode=all"
      : "/api/review/queue";
    const res = await fetch(url);
    const data = await res.json();
    setQueue(data);
    setIndex(0);
    setRevealed(false);
    setHintUsed(false);
  }, [modeAll, modeSelected, idsParam]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const current = queue?.cards[index];
  const effectiveDir: "he_to_ar" | "ar_to_he" = current
    ? dirFlipped
      ? current.direction === "he_to_ar" ? "ar_to_he" : "he_to_ar"
      : current.direction
    : "he_to_ar";
  const audioOnlyPrompt = effectiveDir === "ar_to_he" && !!current?.audio_url;

  const playAudio = useCallback(() => {
    if (!current?.audio_url) return;
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play();
  }, [current]);

  async function grade(rating: number) {
    if (!current || grading) return;
    setGrading(true);
    await fetch("/api/review/grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ card_srs_id: current.card_srs_id, rating }),
    });
    // Always reload the queue after each grade so learning-step cards
    // (e.g. those rated Again at 1m/10m intervals) re-appear when due,
    // rather than only being re-fetched when the initial queue is exhausted.
    await loadQueue();
    setGrading(false);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!current) return;
      if (e.key === " " && !revealed) {
        e.preventDefault();
        setRevealed(true);
        return;
      }
      if (!revealed) return;
      if (hintUsed) {
        if (e.key === "2") grade(Rating.Hard);
      } else {
        if (e.key === "1") grade(Rating.Again);
        else if (e.key === "2") grade(Rating.Hard);
        else if (e.key === "3") grade(Rating.Good);
        else if (e.key === "4") grade(Rating.Easy);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, revealed, grading]);

  if (!queue) {
    return <div className="flex flex-1 items-center justify-center">{strings.common.loading}</div>;
  }

  if (!current) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-4 text-center">
        <h1 className="text-2xl font-bold">{strings.review.doneTitle}</h1>
        <p className="text-gray-500">{strings.review.doneSubtitle}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col p-4 gap-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
      <div className="flex justify-between text-sm text-gray-500">
        <span>
          <bdi>{queue.cards.length - index}</bdi> {strings.review.remaining}
        </span>
        <span className="flex items-center gap-2">
          {modeAll && <span className="text-xs bg-gray-100 dark:bg-gray-800 rounded px-1.5 py-0.5">כל הקארדים</span>}
          {modeSelected && <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded px-1.5 py-0.5">נבחרו</span>}
          <button
            onClick={() => { setDirFlipped((f) => !f); setRevealed(false); setHintUsed(false); }}
            className={`rounded px-2 py-0.5 text-xs font-medium border transition-colors ${
              dirFlipped ? "bg-black text-white border-black" : "border-gray-300 text-gray-500"
            }`}
          >
            {dirFlipped ? "ת→ע" : "ע→ת"}
          </button>
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        {effectiveDir === "he_to_ar" ? (
          <p className="text-3xl font-bold nikud-text">{current.hebrew_meaning}</p>
        ) : audioOnlyPrompt ? (
          <AudioIconButton onClick={playAudio} />
        ) : (
          <p className="text-3xl font-bold nikud-text">{current.translit_nikud}</p>
        )}

        {revealed && (
          <div className="flex flex-col items-center gap-3">
            {effectiveDir === "he_to_ar" ? (
              <>
                <p className="text-2xl nikud-text">{current.translit_nikud}</p>
                {current.notes && <p className="text-base text-gray-500">{current.notes}</p>}
              </>
            ) : audioOnlyPrompt ? (
              <>
                <p className="text-2xl font-bold nikud-text">{current.translit_nikud}</p>
                <p className="text-2xl nikud-text">{current.hebrew_meaning}</p>
              </>
            ) : (
              <p className="text-2xl nikud-text">{current.hebrew_meaning}</p>
            )}
            {current.audio_url && !audioOnlyPrompt && <AudioIconButton onClick={playAudio} size="small" />}
          </div>
        )}

        {current.audio_url && <audio ref={audioRef} src={current.audio_url} className="hidden" />}
      </div>

      {!revealed ? (
        <div className="flex flex-col gap-2">
          {hintUsed && effectiveDir === "he_to_ar" && (
            <p className="text-center text-sm text-gray-400 nikud-text">
              רמז: {current.translit_nikud.split(/\s+/)[0]}…
            </p>
          )}
          <div className="flex gap-2">
            {!hintUsed && (
              <button
                onClick={() => setHintUsed(true)}
                className="rounded-xl border border-gray-300 px-5 py-5 text-base font-bold text-gray-600"
              >
                רמז
              </button>
            )}
            <button
              onClick={() => setRevealed(true)}
              className="flex-1 rounded-xl bg-black py-5 text-lg font-bold text-white"
            >
              {strings.review.showAnswer}
            </button>
          </div>
        </div>
      ) : hintUsed ? (
        <button
          onClick={() => grade(Rating.Hard)}
          disabled={grading}
          className="w-full rounded-xl bg-orange-500 py-5 text-lg font-bold text-white disabled:opacity-50"
        >
          {strings.review.hard}
        </button>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          <button onClick={() => grade(Rating.Again)} className="rounded-xl bg-red-600 py-5 text-lg font-bold text-white">
            {strings.review.again}
          </button>
          <button onClick={() => grade(Rating.Hard)} className="rounded-xl bg-orange-500 py-5 text-lg font-bold text-white">
            {strings.review.hard}
          </button>
          <button onClick={() => grade(Rating.Good)} className="rounded-xl bg-green-600 py-5 text-lg font-bold text-white">
            {strings.review.good}
          </button>
          <button onClick={() => grade(Rating.Easy)} className="rounded-xl bg-blue-600 py-5 text-lg font-bold text-white">
            {strings.review.easy}
          </button>
        </div>
      )}
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<div className="flex flex-1 items-center justify-center">{strings.common.loading}</div>}>
      <ReviewPageInner />
    </Suspense>
  );
}
