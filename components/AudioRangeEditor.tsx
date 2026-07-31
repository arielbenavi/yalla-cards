"use client";

import { useState } from "react";

/** Admin-only clip-range editor. Shared by /browse and /review so the pencil
 *  icon behaves identically wherever a card with audio is on screen. */
export default function AudioRangeEditor({
  cardId,
  initialStart,
  initialEnd,
  onSaved,
  onClose,
}: {
  cardId: string;
  initialStart: number | null;
  initialEnd: number | null;
  onSaved: (start: number | null, end: number | null) => void;
  onClose: () => void;
}) {
  const [start, setStart] = useState(initialStart?.toString() ?? "");
  const [end, setEnd] = useState(initialEnd?.toString() ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const body = {
      audio_start_sec: start !== "" ? parseFloat(start) : null,
      audio_end_sec: end !== "" ? parseFloat(end) : null,
    };
    try {
      await fetch(`/api/cards/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      onSaved(body.audio_start_sec, body.audio_end_sec);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-xs rounded-2xl bg-white dark:bg-gray-900 shadow-2xl p-6 flex flex-col gap-4">
        <h2 className="font-bold text-base">ערוך טווח הקלטה</h2>
        <div className="flex gap-3">
          <label className="flex flex-col gap-1 flex-1">
            <span className="text-xs text-gray-500">התחלה (שניות)</span>
            <input
              type="number"
              step="0.1"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
              placeholder="0.0"
            />
          </label>
          <label className="flex flex-col gap-1 flex-1">
            <span className="text-xs text-gray-500">סיום (שניות)</span>
            <input
              type="number"
              step="0.1"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
              placeholder="0.0"
            />
          </label>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="border rounded-xl px-4 py-2 text-sm text-gray-600">
            ביטול
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="bg-black text-white rounded-xl px-4 py-2 text-sm font-bold disabled:opacity-50"
          >
            {saving ? "שומר…" : "שמור"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** The pencil affordance that opens the editor. Rendered only for admins. */
export function AudioRangeEditButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="ערוך טווח הקלטה"
      className="flex h-8 w-8 items-center justify-center rounded-full border text-gray-500 hover:bg-gray-100"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    </button>
  );
}
