"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

export default function ReviewPage() {
  const [queue, setQueue] = useState<Queue | null>(null);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [grading, setGrading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const loadQueue = useCallback(async () => {
    const res = await fetch("/api/review/queue");
    const data = await res.json();
    setQueue(data);
    setIndex(0);
    setRevealed(false);
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const current = queue?.cards[index];
  const audioOnlyPrompt = current?.direction === "ar_to_he" && !!current.audio_url;

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
      if (e.key === "1") grade(Rating.Again);
      else if (e.key === "2") grade(Rating.Hard);
      else if (e.key === "3") grade(Rating.Good);
      else if (e.key === "4") grade(Rating.Easy);
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
          <bdi>{queue.remaining_due + queue.remaining_new - index}</bdi> {strings.review.remaining}
        </span>
        <span>
          {current.direction === "he_to_ar" ? strings.review.directionHeToAr : strings.review.directionArToHe}
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        {current.direction === "he_to_ar" ? (
          <p className="text-3xl font-bold nikud-text">{current.hebrew_meaning}</p>
        ) : audioOnlyPrompt ? (
          <AudioIconButton onClick={playAudio} />
        ) : (
          <p className="text-3xl font-bold nikud-text">{current.translit_nikud}</p>
        )}

        {revealed && (
          <div className="flex flex-col items-center gap-3">
            {current.direction === "he_to_ar" ? (
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
        <button
          onClick={() => setRevealed(true)}
          className="w-full rounded-xl bg-black py-5 text-lg font-bold text-white"
        >
          {strings.review.showAnswer}
        </button>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => grade(Rating.Again)}
            className="rounded-xl bg-red-600 py-5 text-lg font-bold text-white"
          >
            {strings.review.again}
          </button>
          <button
            onClick={() => grade(Rating.Hard)}
            className="rounded-xl bg-orange-500 py-5 text-lg font-bold text-white"
          >
            {strings.review.hard}
          </button>
          <button
            onClick={() => grade(Rating.Good)}
            className="rounded-xl bg-green-600 py-5 text-lg font-bold text-white"
          >
            {strings.review.good}
          </button>
          <button
            onClick={() => grade(Rating.Easy)}
            className="rounded-xl bg-blue-600 py-5 text-lg font-bold text-white"
          >
            {strings.review.easy}
          </button>
        </div>
      )}
    </div>
  );
}
