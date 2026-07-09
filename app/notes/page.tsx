"use client";

import { useEffect, useState } from "react";
import { strings } from "@/lib/strings";

type Note = {
  id: string;
  body: string;
  tag: string | null;
  status: "open" | "done" | "dismissed";
  created_at: string;
};

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [body, setBody] = useState("");
  const [tag, setTag] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadNotes() {
    const data = await fetch("/api/notes").then((r) => r.json());
    setNotes(data.notes ?? []);
  }

  useEffect(() => {
    loadNotes();
  }, []);

  async function addNote() {
    if (!body.trim()) return;
    setSaving(true);
    await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, tag: tag || undefined }),
    });
    setBody("");
    setTag("");
    await loadNotes();
    setSaving(false);
  }

  async function updateStatus(id: string, status: "done" | "dismissed") {
    await fetch(`/api/notes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <div className="flex flex-col gap-6 p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">{strings.notes.title}</h1>

      <div className="flex flex-col gap-2 border rounded p-3">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={strings.notes.addPlaceholder}
          rows={3}
          className="border rounded px-3 py-2 text-base"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) addNote();
          }}
        />
        <input
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          placeholder={strings.notes.tagPlaceholder}
          className="border rounded px-3 py-1 text-sm"
        />
        <button
          onClick={addNote}
          disabled={saving || !body.trim()}
          className="self-start bg-black text-white rounded px-4 py-2 disabled:opacity-50"
        >
          {strings.notes.add}
        </button>
      </div>

      {notes.length === 0 ? (
        <p className="text-gray-500">{strings.notes.empty}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {notes.map((note) => (
            <div key={note.id} className="flex flex-col gap-1 border rounded p-3">
              {note.tag && (
                <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 self-start">
                  {note.tag}
                </span>
              )}
              <p className="whitespace-pre-wrap">{note.body}</p>
              <p className="text-xs text-gray-400">
                {new Date(note.created_at).toLocaleString("he-IL")}
              </p>
              <div className="flex gap-3 mt-1">
                <button
                  onClick={() => updateStatus(note.id, "done")}
                  className="text-sm text-green-700 underline"
                >
                  {strings.notes.done}
                </button>
                <button
                  onClick={() => updateStatus(note.id, "dismissed")}
                  className="text-sm text-gray-500 underline"
                >
                  {strings.notes.dismiss}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
