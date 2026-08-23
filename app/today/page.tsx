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
    <div className="mx-auto flex max-w-md flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-bold">היום</h1>
        <p className="mt-1 text-sm text-gray-500">
          {allDone ? "סיימת הכל להיום 🎉" : `${doneCount} מתוך ${items.length}`}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <div key={item.key} className="flex flex-col gap-2">
            <Link
              href={item.href}
              className={`flex items-center gap-3 rounded-xl border p-4 transition-colors ${
                item.done ? "border-green-600 bg-green-50" : "hover:bg-gray-50"
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
                <span className="shrink-0 rounded-full bg-black px-2 py-1 text-xs text-white">
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
                    className="rounded-full border px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors"
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
