"use client";

import { useEffect, useState } from "react";
import { strings } from "@/lib/strings";

type Row = {
  hebrew_meaning: string;
  translit_nikud: string;
  item_type: "word" | "phrase" | "sentence";
  confidence: "low" | "high";
  duplicate_of: { id: string; hebrew_meaning: string; translit_nikud: string; similarity: number } | null;
};

type Lesson = { id: string; date: string; title: string | null };

const typeLabels: Record<Row["item_type"], string> = {
  word: strings.inbox.typeWord,
  phrase: strings.inbox.typePhrase,
  sentence: strings.inbox.typeSentence,
};

export default function InboxPage() {
  const [tab, setTab] = useState<"paste" | "photo">("paste");
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [parsing, setParsing] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [committed, setCommitted] = useState(false);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonId, setLessonId] = useState<string>("");

  useEffect(() => {
    fetch("/api/lessons")
      .then((r) => r.json())
      .then((d) => setLessons(d.lessons ?? []));
  }, []);

  async function submitText() {
    setParsing(true);
    setCommitted(false);
    const res = await fetch("/api/inbox/parse-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    setParsing(false);
    setRows(data.rows ?? []);
  }

  async function submitImages() {
    setParsing(true);
    setCommitted(false);
    const formData = new FormData();
    files.forEach((f) => formData.append("images", f));
    const res = await fetch("/api/inbox/parse-image", { method: "POST", body: formData });
    const data = await res.json();
    setParsing(false);
    setRows(data.rows ?? []);
  }

  function updateRow(i: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function deleteRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addRow() {
    setRows((prev) => [
      ...prev,
      { hebrew_meaning: "", translit_nikud: "", item_type: "phrase", confidence: "high", duplicate_of: null },
    ]);
  }

  async function commit() {
    setCommitting(true);
    await fetch("/api/inbox/commit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rows: rows.map(({ hebrew_meaning, translit_nikud, item_type }) => ({
          hebrew_meaning,
          translit_nikud,
          item_type,
        })),
        lesson_id: lessonId || null,
      }),
    });
    setCommitting(false);
    setCommitted(true);
    setRows([]);
    setText("");
    setFiles([]);
  }

  return (
    <div className="flex flex-col gap-6 p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold">{strings.inbox.title}</h1>

      <label className="flex flex-col gap-1">
        <span>{strings.inbox.lessonLabel}</span>
        <select
          value={lessonId}
          onChange={(e) => setLessonId(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">{strings.inbox.noLesson}</option>
          {lessons.map((l) => (
            <option key={l.id} value={l.id}>
              {l.title || l.date}
            </option>
          ))}
        </select>
      </label>

      <div className="flex gap-4 border-b">
        <button
          onClick={() => setTab("paste")}
          className={tab === "paste" ? "font-bold border-b-2 border-black pb-2" : "text-gray-500 pb-2"}
        >
          {strings.inbox.pasteTab}
        </button>
        <button
          onClick={() => setTab("photo")}
          className={tab === "photo" ? "font-bold border-b-2 border-black pb-2" : "text-gray-500 pb-2"}
        >
          {strings.inbox.photoTab}
        </button>
      </div>

      {tab === "paste" ? (
        <div className="flex flex-col gap-2">
          <label className="flex flex-col gap-1">
            <span>{strings.inbox.pasteLabel}</span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              className="border rounded px-3 py-2 nikud-text"
            />
          </label>
          <button
            onClick={submitText}
            disabled={parsing || !text.trim()}
            className="self-start bg-black text-white rounded px-4 py-2 disabled:opacity-50"
          >
            {parsing ? strings.inbox.parsing : strings.inbox.pasteSubmit}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <label className="flex flex-col gap-1">
            <span>{strings.inbox.photoLabel}</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            />
          </label>
          <button
            onClick={submitImages}
            disabled={parsing || files.length === 0}
            className="self-start bg-black text-white rounded px-4 py-2 disabled:opacity-50"
          >
            {parsing ? strings.inbox.parsing : strings.inbox.photoSubmit}
          </button>
        </div>
      )}

      {committed && <p className="text-green-700">{strings.inbox.committed}</p>}

      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-bold">{strings.inbox.tableTitle}</h2>
        {rows.length === 0 ? (
          <p className="text-gray-500">{strings.inbox.emptyState}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {rows.map((row, i) => (
              <div
                key={i}
                className={`flex flex-col gap-2 border rounded p-3 ${
                  row.confidence === "low" ? "border-orange-400 bg-orange-50" : ""
                }`}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-sm text-gray-500">{strings.inbox.colTranslit}</span>
                    <input
                      value={row.translit_nikud}
                      onChange={(e) => updateRow(i, { translit_nikud: e.target.value })}
                      className="border rounded px-2 py-1 nikud-text"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-sm text-gray-500">{strings.inbox.colMeaning}</span>
                    <input
                      value={row.hebrew_meaning}
                      onChange={(e) => updateRow(i, { hebrew_meaning: e.target.value })}
                      className="border rounded px-2 py-1 nikud-text"
                    />
                  </label>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{strings.inbox.colType}</span>
                    <select
                      value={row.item_type}
                      onChange={(e) => updateRow(i, { item_type: e.target.value as Row["item_type"] })}
                      className="border rounded px-2 py-1"
                    >
                      {(Object.keys(typeLabels) as Row["item_type"][]).map((t) => (
                        <option key={t} value={t}>
                          {typeLabels[t]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <span className="text-sm text-gray-500">
                    {strings.inbox.colConfidence}:{" "}
                    {row.confidence === "low" ? strings.inbox.confidenceLow : strings.inbox.confidenceHigh}
                  </span>
                  <button onClick={() => deleteRow(i)} className="text-sm text-red-600 ms-auto">
                    {strings.inbox.deleteRow}
                  </button>
                </div>
                {row.duplicate_of && (
                  <p className="text-sm text-orange-700">
                    {strings.inbox.duplicateWarning}: {row.duplicate_of.translit_nikud} —{" "}
                    {row.duplicate_of.hebrew_meaning}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
        <button onClick={addRow} className="self-start text-sm underline text-gray-600">
          {strings.inbox.addRow}
        </button>
      </div>

      {rows.length > 0 && (
        <button
          onClick={commit}
          disabled={committing}
          className="bg-green-700 text-white rounded px-4 py-3 font-bold disabled:opacity-50"
        >
          {committing ? strings.inbox.committing : strings.inbox.commit}
        </button>
      )}
    </div>
  );
}
