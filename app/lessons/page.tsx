"use client";

import { useEffect, useState } from "react";
import { strings } from "@/lib/strings";

type Lesson = { id: string; date: string; title: string | null };

const SEED_FIRST_MONDAY = "2026-07-06";

function nextMondayAfter(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

export default function LessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  async function refresh() {
    const data = await fetch("/api/lessons").then((r) => r.json());
    setLessons(data.lessons ?? []);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function addNextLesson() {
    setAdding(true);
    // lessons are returned newest-first; the latest by date is the last one
    const latest = [...lessons].sort((a, b) => (a.date < b.date ? 1 : -1))[0];
    const nextNumber = lessons.length + 1;
    const nextDate = latest ? nextMondayAfter(latest.date) : SEED_FIRST_MONDAY;

    await fetch("/api/lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: `שיעור ${nextNumber}`, date: nextDate }),
    });
    setAdding(false);
    refresh();
  }

  async function updateLesson(id: string, patch: Partial<Lesson>) {
    setLessons((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  async function saveLesson(lesson: Lesson) {
    setSaving(lesson.id);
    await fetch(`/api/lessons/${lesson.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: lesson.title, date: lesson.date }),
    });
    setSaving(null);
    refresh();
  }

  const sorted = [...lessons].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="flex flex-col gap-6 p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{strings.lessons.title}</h1>
        <button
          onClick={addNextLesson}
          disabled={adding}
          className="bg-black text-white rounded px-4 py-2 disabled:opacity-50"
        >
          {strings.lessons.addNext}
        </button>
      </div>

      {sorted.length === 0 ? (
        <p className="text-gray-500">{strings.lessons.empty}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map((lesson) => (
            <div key={lesson.id} className="flex items-center gap-2 border rounded p-3">
              <label className="flex flex-col gap-1 flex-1">
                <span className="text-sm text-gray-500">{strings.lessons.titleLabel}</span>
                <input
                  value={lesson.title ?? ""}
                  onChange={(e) => updateLesson(lesson.id, { title: e.target.value })}
                  className="border rounded px-2 py-1"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-gray-500">{strings.lessons.dateLabel}</span>
                <input
                  type="date"
                  value={lesson.date}
                  onChange={(e) => updateLesson(lesson.id, { date: e.target.value })}
                  className="border rounded px-2 py-1"
                />
              </label>
              <button
                onClick={() => saveLesson(lesson)}
                disabled={saving === lesson.id}
                className="self-end bg-black text-white rounded px-3 py-1 text-sm disabled:opacity-50"
              >
                {strings.lessons.save}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
