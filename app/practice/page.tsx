"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { strings } from "@/lib/strings";
import { gameLinks, practiceLinks, type NavLink } from "@/lib/nav";

type StatusItem = { task: string; label: string; href: string; days_since: number | null; stale: boolean };

function sinceLabel(days: number | null): string {
  if (days == null) return "עוד לא תרגלת";
  if (days === 0) return "תרגלת היום";
  if (days === 1) return "תרגלת אתמול";
  return `לפני ${days} ימים`;
}

const STATUS_EMOJI: Record<string, string> = { inflections: "🔁", conversation: "💬" };

const PRACTICE_DESCRIPTION: Record<string, string> = {
  "/inflection-drill": "טבלאות הטיה לפי מפגש",
  "/possessives": "הטיית שמות עם סיומות",
  "/translate": "משפטים מהספר לפי מפגש",
  "/simulate": "סיטואציות ושיחות",
  "/focused": "מה שנכשל לאחרונה ומה שעומד להישכח",
  "/picture-game": "זיהוי מילים בתמונות",
  "/numbers": "מספרים בערבית",
  "/letters": "אותיות לפי מיקום במילה",
};

function LinkRows({ title, links }: { title: string; links: NavLink[] }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="px-1 text-sm font-medium text-gray-500">{title}</h2>
      <div className="grid grid-cols-1 divide-y overflow-hidden rounded-2xl border">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="flex items-center justify-between gap-3 p-4 hover:bg-gray-50">
            <span className="flex min-w-0 flex-col">
              <span className="font-bold">{l.label}</span>
              <span className="text-sm text-gray-500">{PRACTICE_DESCRIPTION[l.href]}</span>
            </span>
            <span className="text-gray-300">←</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function PracticePage() {
  const [status, setStatus] = useState<StatusItem[]>([]);

  useEffect(() => {
    fetch("/api/practice-status")
      .then((r) => r.json())
      .then((d) => setStatus(d.items ?? []))
      .catch(() => {});
  }, []);

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
      <LinkRows title="תרגול" links={practiceLinks} />
      <LinkRows title="משחקים" links={gameLinks} />
    </div>
  );
}
