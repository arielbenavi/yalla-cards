"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { strings } from "@/lib/strings";

type StatusItem = { task: string; label: string; href: string; days_since: number | null; stale: boolean };

function sinceLabel(days: number | null): string {
  if (days == null) return "עוד לא תרגלת";
  if (days === 0) return "תרגלת היום";
  if (days === 1) return "תרגלת אתמול";
  return `לפני ${days} ימים`;
}

const STATUS_EMOJI: Record<string, string> = { inflections: "🔁", conversation: "💬" };

type PracticeCard = {
  href: string;
  emoji: string;
  title: string;
  description: string;
  progress?: string | null;
  available: boolean;
};

export default function PracticePage() {
  const [pictureSceneCount, setPictureSceneCount] = useState<number | null>(null);

  const [status, setStatus] = useState<StatusItem[]>([]);

  useEffect(() => {
    fetch("/api/practice-status")
      .then((r) => r.json())
      .then((d) => setStatus(d.items ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/picture-scenes")
      .then((r) => r.json())
      .then((d) => setPictureSceneCount((d.scenes ?? []).length))
      .catch(() => setPictureSceneCount(null));
  }, []);

  const cards: PracticeCard[] = [
    {
      href: "/picture-game",
      emoji: "🖼️",
      title: strings.nav.pictureGame,
      description: "זיהוי מילים בתמונות אמיתיות",
      progress: pictureSceneCount != null ? `${pictureSceneCount} תמונות` : null,
      available: true,
    },
    {
      href: "/numbers",
      emoji: "🔢",
      title: strings.nav.numbers,
      description: "תרגול מספרים בערבית",
      progress: null,
      available: true,
    },
    {
      href: "/letters",
      emoji: "🔤",
      title: strings.nav.letters,
      description: "זיהוי אותיות ערביות לפי מיקומן במילה",
      progress: null,
      available: true,
    },
  ];

  return (
    <div className="flex flex-col flex-1 p-4 gap-6 max-w-md mx-auto w-full">
      <h1 className="text-xl font-bold">{strings.nav.practice}</h1>
      {status.length > 0 && (
        <div className="grid grid-cols-1 gap-3" data-testid="practice-status">
          {status.map((item) => (
            <Link
              key={item.task}
              href={item.href}
              className="relative flex items-center gap-4 rounded-2xl border p-5 hover:bg-gray-50"
            >
              <span className="flex-shrink-0 text-4xl">{STATUS_EMOJI[item.task]}</span>
              <div className="flex min-w-0 flex-col gap-1">
                <span className="text-base font-bold">{item.label}</span>
                <span className={`text-sm ${item.stale ? "font-medium text-red-700" : "text-gray-500"}`}>{sinceLabel(item.days_since)}</span>
              </div>
              {item.stale && <span className="absolute left-4 top-4 h-2.5 w-2.5 rounded-full bg-red-600" />}
              <span className="mr-auto text-gray-300">←</span>
            </Link>
          ))}
        </div>
      )}
      <div className="grid grid-cols-1 gap-3">
        {cards.map((card) =>
          card.available ? (
            <Link
              key={card.href}
              href={card.href}
              className="flex items-center gap-4 border rounded-2xl p-5 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
            >
              <span className="text-4xl flex-shrink-0">{card.emoji}</span>
              <div className="flex flex-col gap-1 min-w-0">
                <span className="font-bold text-base">{card.title}</span>
                <span className="text-sm text-gray-500">{card.description}</span>
                {card.progress && (
                  <span className="text-xs text-gray-400">{card.progress}</span>
                )}
              </div>
              <span className="text-gray-300 mr-auto">←</span>
            </Link>
          ) : (
            <div
              key={card.href}
              className="flex items-center gap-4 border rounded-2xl p-5 opacity-50 cursor-not-allowed"
            >
              <span className="text-4xl flex-shrink-0">{card.emoji}</span>
              <div className="flex flex-col gap-1 min-w-0">
                <span className="font-bold text-base">{card.title}</span>
                <span className="text-sm text-gray-500">{card.description}</span>
                {card.progress && (
                  <span className="text-xs text-gray-400">{card.progress}</span>
                )}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
