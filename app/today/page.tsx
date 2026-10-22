"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { strings } from "@/lib/strings";

type Item = {
  key: string;
  label: string;
  hint: string;
  href: string;
  done: boolean;
  remaining?: number;
  /** Three situations drawn at random, so starting is a tap and not a choice. */
  suggestions?: { label: string; href: string }[];
};

export default function TodayPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/today")
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-gray-500">
        {strings.common.loading}
      </div>
    );
  }

  const doneCount = items.filter((i) => i.done).length;
  const allDone = items.length > 0 && doneCount === items.length;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-8 px-4 py-6">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">היום</h1>
        <p className="mt-1 text-sm text-gray-500">
          {allDone ? "סיימת הכל להיום 🎉" : `${doneCount} מתוך ${items.length}`}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.key} className="flex flex-col gap-2">
            <Link
              href={item.href}
              className={`flex min-h-[72px] items-center gap-4 rounded-2xl border p-4 transition-colors ${
                item.done
                  ? "border-green-600/40 bg-green-50"
                  : "border-gray-200 bg-white shadow-[0_6px_16px_-12px_rgb(29_79_150/0.35)] hover:border-gray-300"
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs ${
                  item.done ? "border-green-600 bg-green-600 text-white" : "border-gray-300"
                }`}
                aria-hidden
              >
                {item.done ? "✓" : ""}
              </span>
              <span className="flex-1">
                <span className="block font-bold">{item.label}</span>
                <span className="block text-xs text-gray-500">{item.hint}</span>
              </span>
              {!item.done && item.remaining ? (
                <span className="shrink-0 rounded-full bg-black px-3 py-1 text-sm font-bold tabular-nums text-white">
                  {item.remaining}
                </span>
              ) : null}
            </Link>

            {/* Three situations, drawn fresh each load (note 3e564c9f). Offered
                only while the task is open: once it is ticked they are clutter,
                and the whole point is to remove the step where he has to
                decide what to practise. */}
            {!item.done && item.suggestions?.length ? (
              <div className="flex flex-wrap gap-2 pr-9">
                {item.suggestions.map((s) => (
                  <Link
                    key={s.href}
                    href={s.href}
                    className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:border-gray-300"
                  >
                    {s.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {/* The review's tick is derived from its own queue, not stored — saying so
          here keeps him from hunting for a button that does not exist. */}
      <p className="text-center text-[11px] text-gray-400">
        החזרה היומית מסומנת לבד כשהתור מתרוקן. תרגול ההטיות, האימון הממוקד ותרגול
        השיחה מסומנים כשמסיימים טבלה, סבב או סיטואציה.
      </p>
    </div>
  );
}
