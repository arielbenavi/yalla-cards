"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { strings } from "@/lib/strings";

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
      progress: "בקרוב",
      available: false,
    },
  ];

  return (
    <div className="flex flex-col flex-1 p-4 gap-6 max-w-md mx-auto w-full">
      <h1 className="text-xl font-bold">{strings.nav.practice}</h1>
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
