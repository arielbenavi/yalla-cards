"use client";

import { useEffect, useState } from "react";
import { strings } from "@/lib/strings";

type Stats = { due_today: number; streak: number; total_cards: number; mature_cards: number };

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats);
  }, []);

  if (!stats) {
    return <div className="p-4">{strings.common.loading}</div>;
  }

  const items = [
    { label: strings.stats.dueToday, value: stats.due_today },
    { label: strings.stats.streak, value: stats.streak },
    { label: strings.stats.totalCards, value: stats.total_cards },
    { label: strings.stats.matureCards, value: stats.mature_cards },
  ];

  return (
    <div className="flex flex-col gap-6 p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold">{strings.stats.title}</h1>
      <div className="grid grid-cols-2 gap-4">
        {items.map((item) => (
          <div key={item.label} className="border rounded p-4 flex flex-col items-center gap-1">
            <bdi className="text-3xl font-bold">{item.value}</bdi>
            <span className="text-gray-500">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
