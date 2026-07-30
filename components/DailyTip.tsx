"use client";

import { useEffect, useState } from "react";
import { TIPS, type Tip } from "@/lib/tips";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // "2026-07-30"
}

function pickTip(): Tip {
  const d = new Date();
  const dayOfYear = Math.floor(
    (d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86_400_000
  );
  return TIPS[dayOfYear % TIPS.length];
}

export default function DailyTip() {
  const [tip, setTip] = useState<Tip | null>(null);

  useEffect(() => {
    const today = todayKey();
    const lastShown = localStorage.getItem("daily_tip_date");
    if (lastShown === today) return;
    setTip(pickTip());
  }, []);

  function dismiss() {
    localStorage.setItem("daily_tip_date", todayKey());
    setTip(null);
  }

  if (!tip) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={dismiss}
      />

      {/* Card */}
      <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 shadow-2xl p-6 flex flex-col gap-3 border border-gray-100 dark:border-gray-800">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden>💡</span>
            <span className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
              טיפ יומי
            </span>
          </div>
          <button
            onClick={dismiss}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg leading-none"
            aria-label="סגור"
          >
            ✕
          </button>
        </div>

        <h2 className="text-base font-bold leading-snug nikud-text">{tip.title}</h2>
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed nikud-text">
          {tip.body}
        </p>

        <button
          onClick={dismiss}
          className="mt-1 self-end rounded-xl bg-black dark:bg-white text-white dark:text-black px-5 py-2 text-sm font-bold"
        >
          הבנתי
        </button>
      </div>
    </div>
  );
}
