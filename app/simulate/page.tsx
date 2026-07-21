"use client";

import { useEffect, useState, useCallback } from "react";
import { strings } from "@/lib/strings";

type SimCard = {
  id: string;
  hebrew_meaning: string;
  translit_nikud: string;
  arabic_script: string | null;
  item_type: string;
  notes: string | null;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function SimulatePage() {
  const [cards, setCards] = useState<SimCard[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetch("/api/browse?limit=500").then((r) => r.json());
    const all: SimCard[] = (data.cards ?? []).filter((c: SimCard) => c.translit_nikud);
    setCards(shuffle(all));
    setIndex(0);
    setRevealed(false);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function next() {
    setIndex((i) => Math.min(i + 1, cards.length - 1));
    setRevealed(false);
  }

  function prev() {
    setIndex((i) => Math.max(i - 1, 0));
    setRevealed(false);
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-gray-500">
        {strings.common.loading}
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-gray-500">
        אין כרטיסים
      </div>
    );
  }

  const current = cards[index];

  return (
    <div className="flex flex-col flex-1 p-4 gap-4 max-w-md mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">{strings.nav.simulate}</h1>
        <button
          onClick={load}
          className="text-sm text-gray-500 border rounded px-3 py-1 hover:bg-gray-50"
        >
          ערבב מחדש
        </button>
      </div>

      {/* Progress */}
      <div className="text-sm text-gray-400 text-center">
        <bdi>{index + 1}</bdi> / <bdi>{cards.length}</bdi>
      </div>

      {/* Card */}
      <div
        className="flex flex-col flex-1 items-center justify-center gap-6 text-center border rounded-2xl p-6 cursor-pointer select-none"
        onClick={() => !revealed && setRevealed(true)}
      >
        {/* Prompt: Hebrew */}
        <p className="text-3xl font-bold nikud-text leading-relaxed">
          {current.hebrew_meaning}
        </p>

        {!revealed && (
          <p className="text-sm text-gray-400 mt-4">הקש לגילוי</p>
        )}

        {/* Answer */}
        {revealed && (
          <div className="flex flex-col items-center gap-3 border-t pt-6 w-full">
            <p className="text-2xl nikud-text">{current.translit_nikud}</p>
            {current.arabic_script && (
              <p className="text-xl text-gray-500">{current.arabic_script}</p>
            )}
            {current.notes && (
              <p className="text-sm text-gray-400 nikud-text">{current.notes}</p>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-2">
        <button
          onClick={prev}
          disabled={index === 0}
          className="rounded-xl border py-4 px-6 text-xl font-bold disabled:opacity-30"
        >
          ←
        </button>
        <button
          onClick={() => setRevealed(true)}
          disabled={revealed}
          className="flex-1 rounded-xl bg-black text-white py-4 text-base font-bold disabled:opacity-30 disabled:cursor-default"
        >
          {revealed ? "גלוי" : strings.review.showAnswer}
        </button>
        <button
          onClick={next}
          disabled={index === cards.length - 1}
          className="rounded-xl border py-4 px-6 text-xl font-bold disabled:opacity-30"
        >
          →
        </button>
      </div>
    </div>
  );
}
