"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { strings } from "@/lib/strings";

type Option = { feature: string; sentence: string; arabic: string };
type Item = {
  base_translit: string;
  base_he: string;
  target_feature: string;
  contrast_with: string;
  prompt_he: string;
  options: Option[];
};

export default function PossessivesPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [contrast, setContrast] = useState<{ label: string } | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [answered, setAnswered] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [sessionId] = useState(() => crypto.randomUUID());
  const shownAt = useRef(Date.now());

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/possessives/queue?size=10")
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items ?? []);
        setContrast(d.contrast);
        setReason(d.reason ?? null);
        setIndex(0);
        setAnswered(null);
        setCorrectCount(0);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => load(), [load]);
  useEffect(() => {
    shownAt.current = Date.now();
  }, [index]);

  const item = items[index];

  function answer(feature: string) {
    if (!item || answered) return;
    const correct = feature === item.target_feature;
    setAnswered(feature);
    if (correct) setCorrectCount((n) => n + 1);

    fetch("/api/possessives/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        stage: 1,
        base_translit: item.base_translit,
        target_feature: item.target_feature,
        chosen_feature: correct ? null : feature,
        contrast_with: item.contrast_with,
        correct,
        latency_ms: Date.now() - shownAt.current,
      }),
    }).catch(() => {});
  }

  if (loading) {
    return <div className="flex flex-1 items-center justify-center text-gray-500">{strings.common.loading}</div>;
  }

  if (reason || items.length === 0) {
    return (
      <div className="flex flex-col gap-4 p-4 max-w-md mx-auto">
        <h1 className="text-2xl font-bold">סיומות שייכות</h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          {reason ?? "אין כרגע תרגילים."}
        </p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex flex-col gap-5 p-4 max-w-md mx-auto">
        <h1 className="text-2xl font-bold">סיימת</h1>
        <p className="text-sm text-gray-500">
          {correctCount} מתוך {items.length} נכונות
        </p>
        <button onClick={load} className="rounded-xl bg-black py-4 text-base font-bold text-white">
          סבב נוסף
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 max-w-md mx-auto">
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>
          {index + 1} / {items.length}
        </span>
        {contrast && <span>{contrast.label}</span>}
      </div>

      <div className="text-center">
        <p className="text-xs text-gray-400 mb-2">איזה משפט אומר</p>
        <p className="text-2xl font-bold">{item.prompt_he}</p>
      </div>

      <div className="flex flex-col gap-3">
        {item.options.map((o) => {
          const picked = answered === o.feature;
          const isTarget = o.feature === item.target_feature;
          const showCorrect = answered && isTarget;
          return (
            <button
              key={o.feature}
              onClick={() => answer(o.feature)}
              disabled={!!answered}
              className={`rounded-2xl border p-4 text-center transition-colors ${
                showCorrect
                  ? "border-green-600 bg-green-50"
                  : picked
                  ? "border-red-500 bg-red-50"
                  : "hover:bg-gray-50"
              }`}
            >
              <p className="nikud-text text-xl">{o.sentence}</p>
              {answered && (
                <p className="text-lg mt-1 text-gray-400" style={{ fontFamily: "serif" }} dir="rtl">
                  {o.arabic}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {answered && (
        <button
          onClick={() => {
            setAnswered(null);
            setIndex((i) => i + 1);
          }}
          className="rounded-xl bg-black py-4 text-base font-bold text-white"
        >
          הבא
        </button>
      )}

      <p className="text-center text-[11px] text-gray-400">תרגול בלבד — לא משנה מועדי FSRS</p>
    </div>
  );
}
