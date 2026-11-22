"use client";

import { useEffect, useState } from "react";
import { TIPS, type Tip } from "@/lib/tips";
import { EXTRA_PROVERBS, type Proverb } from "@/lib/proverbs";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // "2026-07-30"
}

type Daily = { kind: "tip"; tip: Tip } | { kind: "proverb"; proverb: Proverb };
type Kind = Daily["kind"];

/**
 * Next item from a per-kind shuffled queue kept in localStorage: every item is shown once, in random
 * order, before any repeats. Keys are the item titles, so adding tips or proverbs later just appends them.
 */
function nextFromQueue(kind: Kind, keys: string[]): string {
  const k = `daily_queue_${kind}`;
  let queue: string[] = [];
  try { queue = JSON.parse(localStorage.getItem(k) ?? "[]"); } catch {}
  queue = queue.filter((x) => keys.includes(x));
  if (!queue.length) {
    queue = [...keys];
    for (let i = queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [queue[i], queue[j]] = [queue[j], queue[i]];
    }
  }
  const [head, ...rest] = queue;
  localStorage.setItem(k, JSON.stringify(rest));
  return head;
}

async function pick(kind: Kind): Promise<Daily | null> {
  if (kind === "tip") {
    const key = nextFromQueue("tip", TIPS.map((t) => t.title));
    return { kind: "tip", tip: TIPS.find((t) => t.title === key)! };
  }
  try {
    const { items } = (await (await fetch("/api/proverbs")).json()) as { items: Proverb[] };
    const all = [...items, ...EXTRA_PROVERBS];
    if (!all.length) return null;
    const key = nextFromQueue("proverb", all.map((p) => p.tr));
    return { kind: "proverb", proverb: all.find((p) => p.tr === key)! };
  } catch {
    return null; // offline: skip the proverb this time
  }
}

/**
 * A tip and a proverb every day, never on the same app open: the first open of the day shows one,
 * a later open shows the other. Which comes first alternates day to day.
 */
function kindToShow(): Kind | null {
  const today = todayKey();
  const tipDone = localStorage.getItem("daily_tip_date") === today;
  const provDone = localStorage.getItem("daily_proverb_date") === today;
  if (tipDone && provDone) return null;
  if (tipDone) return "proverb";
  if (provDone) return "tip";
  return localStorage.getItem("daily_first_kind") === "tip" ? "proverb" : "tip";
}

export default function DailyTip() {
  const [daily, setDaily] = useState<Daily | null>(null);

  useEffect(() => {
    const kind = kindToShow();
    if (!kind) return;
    pick(kind).then((d) => {
      if (!d) return;
      const today = todayKey();
      // Mark on show, so the next open moves on to the other kind even if this one is not dismissed.
      localStorage.setItem(`daily_${kind}_date`, today);
      if (localStorage.getItem("daily_first_date") !== today) {
        localStorage.setItem("daily_first_date", today);
        localStorage.setItem("daily_first_kind", kind);
      }
      setDaily(d);
    });
  }, []);

  function dismiss() {
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
