"use client";

import { useEffect, useState } from "react";
import { TIPS, type Tip } from "@/lib/tips";
import { PROVERBS, type Proverb } from "@/lib/proverbs";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // "2026-07-30"
}

function dayNumber(): number {
  const d = new Date();
  return Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86_400_000);
}

/** A fixed shuffle of 0..n-1, so the proverbs come in a random order that never repeats until all were shown. */
function shuffled(n: number, seed: number): number[] {
  const a = Array.from({ length: n }, (_, i) => i);
  let x = seed;
  for (let i = n - 1; i > 0; i--) {
    x = (x * 1103515245 + 12345) % 2147483648;
    const j = x % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Daily = { kind: "tip"; tip: Tip } | { kind: "proverb"; proverb: Proverb };

/** Even days a tip, odd days a proverb: never both on the same day, never one right after the other. */
function pickDaily(): Daily {
  const day = dayNumber();
  const half = Math.floor(day / 2);
  if (day % 2 === 0) return { kind: "tip", tip: TIPS[half % TIPS.length] };
  const order = shuffled(PROVERBS.length, new Date().getFullYear());
  return { kind: "proverb", proverb: PROVERBS[order[half % PROVERBS.length]] };
}

export default function DailyTip() {
  const [daily, setDaily] = useState<Daily | null>(null);

  useEffect(() => {
    const today = todayKey();
    const lastShown = localStorage.getItem("daily_tip_date");
    if (lastShown === today) return;
    setDaily(pickDaily());
  }, []);

  function dismiss() {
    localStorage.setItem("daily_tip_date", todayKey());
    setDaily(null);
  }

  if (!daily) return null;
  const isTip = daily.kind === "tip";

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
            <span className="text-xl" aria-hidden>{isTip ? "💡" : "📜"}</span>
            <span className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
              {isTip ? "טיפ יומי" : "פתגם יומי"}
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

        {daily.kind === "tip" ? (
          <>
            <h2 className="text-base font-bold leading-snug nikud-text">{daily.tip.title}</h2>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed nikud-text">{daily.tip.body}</p>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold leading-snug nikud-text">{daily.proverb.tr}</h2>
            <p className="text-xl font-arabic text-gray-600 dark:text-gray-400" dir="rtl" lang="ar">{daily.proverb.ar}</p>
            <p className="text-base font-medium">{daily.proverb.he}</p>
            {daily.proverb.note && <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{daily.proverb.note}</p>}
            <p className="text-xs text-gray-400">מקור: מילון מדרסה</p>
          </>
        )}

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
