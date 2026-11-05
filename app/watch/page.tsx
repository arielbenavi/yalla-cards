"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { strings } from "@/lib/strings";

type Item = { slug: string; title: string; series: string | null; duration_sec: number | null };

const minutes = (s: number | null) => (s ? `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}` : "");

/** Short scenes with transliteration you can tap, grouped by series. */
export default function WatchList() {
  const [items, setItems] = useState<Item[] | null>(null);
  useEffect(() => {
    fetch("/api/media/list")
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]));
  }, []);
  if (!items) return <div className="flex flex-1 items-center justify-center">{strings.common.loading}</div>;
  const groups = new Map<string, Item[]>();
  for (const i of items) groups.set(i.series ?? "סרטונים", [...(groups.get(i.series ?? "סרטונים") ?? []), i]);
  return (
    <div className="flex flex-col flex-1 p-4 gap-5 max-w-md mx-auto w-full">
      <div>
        <h1 className="text-xl font-bold">סרטונים עם תעתיק</h1>
        <p className="text-sm text-gray-500 mt-1">לחיצה על מילה עוצרת את הסרטון, מתרגמת, ומאפשרת להוסיף אותה ככרטיס.</p>
      </div>
      {[...groups.entries()].map(([series, list]) => (
        <section key={series} className="flex flex-col gap-2">
          <h2 className="px-1 text-sm font-medium text-gray-500">{series}</h2>
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
