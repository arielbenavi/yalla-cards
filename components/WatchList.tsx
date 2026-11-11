"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { strings } from "@/lib/strings";

type Item = { slug: string; title: string; series: string | null; duration_sec: number | null };

const minutes = (s: number | null) => (s ? `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}` : "");

/**
 * The videos with tappable transliteration, grouped by series. One list for both places that show
 * them, /watch and the top of תכנים (Ariel, 2026-11-10: "שיהיה אותו אובייקט").
 */
export default function WatchList() {
  const [items, setItems] = useState<Item[] | null>(null);
  useEffect(() => {
    fetch("/api/media/list")
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]));
  }, []);
  if (!items) return <p className="px-1 text-sm text-gray-400">{strings.common.loading}</p>;
  const groups = new Map<string, Item[]>();
  for (const i of items) groups.set(i.series ?? "סרטונים", [...(groups.get(i.series ?? "סרטונים") ?? []), i]);
  return (
    <div className="flex flex-col gap-4" data-testid="watch-list">
      {[...groups.entries()].map(([series, list]) => (
        <section key={series} className="flex flex-col gap-2">
          <h3 className="px-1 text-sm font-medium text-gray-500">{series}</h3>
          <div className="grid grid-cols-1 divide-y overflow-hidden rounded-2xl border">
            {list.map((i, n) => (
              <Link key={i.slug} href={`/watch/${i.slug}`} className="flex items-center justify-between gap-3 p-4 hover:bg-gray-50">
                <span className="font-bold">
                  {list.length > 1 && <span className="ml-2 text-gray-400">{n + 1}.</span>}
                  {i.title}
                </span>
                <span className="text-sm text-gray-400">{minutes(i.duration_sec)}</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
