"use client";

import { useEffect, useRef, useState } from "react";
import { strings } from "@/lib/strings";
import { config } from "@/lib/config";
import {
  unzipChatExport,
  parseChatText,
  distinctSenders,
  isVoiceNoteFilename,
  type ChatMessage,
} from "@/lib/whatsapp";
import { uploadAndTranscribeRecording } from "@/lib/recording-upload";

type Row = {
  hebrew_meaning: string;
  translit_nikud: string;
  item_type: "word" | "phrase" | "sentence";
  confidence: "low" | "high";
  notes: string;
  duplicate_of: { id: string; hebrew_meaning: string; translit_nikud: string; similarity: number } | null;
  recording_id: string | null;
};

type Lesson = { id: string; date: string; title: string | null };

const typeLabels: Record<Row["item_type"], string> = {
  word: strings.inbox.typeWord,
  phrase: strings.inbox.typePhrase,
  sentence: strings.inbox.typeSentence,
};

export default function InboxPage() {
  const [tab, setTab] = useState<"paste" | "photo" | "whatsapp">("paste");
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [parsing, setParsing] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [committed, setCommitted] = useState(false);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonId, setLessonId] = useState<string>("");

  const [zipFile, setZipFile] = useState<File | null>(null);
  const [waStep, setWaStep] = useState<"pick-zip" | "pick-teacher" | "processing">("pick-zip");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [mediaFiles, setMediaFiles] = useState<Map<string, File>>(new Map());
  const [senders, setSenders] = useState<string[]>([]);
  const [teacherSender, setTeacherSender] = useState("");
  const [waStatus, setWaStatus] = useState<string | null>(null);
  const [waCursor, setWaCursor] = useState<Date | null>(null);
  const [waImportAll, setWaImportAll] = useState(false);
  const [waPendingCursor, setWaPendingCursor] = useState<{ chatIdentifier: string; lastImportedAt: string } | null>(
    null
  );

  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetch("/api/lessons")
      .then((r) => r.json())
      .then((d) => setLessons(d.lessons ?? []));
  }, []);

  useEffect(() => {
    if (!teacherSender) {
      setWaCursor(null);
      return;
    }
    fetch(`/api/inbox/whatsapp-cursor?chat_identifier=${encodeURIComponent(teacherSender)}`)
      .then((r) => r.json())
      .then((d) => setWaCursor(d.last_imported_at ? new Date(d.last_imported_at) : null));
  }, [teacherSender]);

  async function submitText() {
    setParsing(true);
    setCommitted(false);
    setWaPendingCursor(null);
    const res = await fetch("/api/inbox/parse-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    setParsing(false);
    setRows((data.rows ?? []).map((r: Omit<Row, "recording_id">) => ({ ...r, recording_id: null })));
  }

  async function submitImages() {
    setParsing(true);
    setCommitted(false);
    setWaPendingCursor(null);
    const formData = new FormData();
    files.forEach((f) => formData.append("images", f));
    const res = await fetch("/api/inbox/parse-image", { method: "POST", body: formData });
    const data = await res.json();
    setParsing(false);
    setRows((data.rows ?? []).map((r: Omit<Row, "recording_id">) => ({ ...r, recording_id: null })));
  }

  async function handleUnzip() {
    if (!zipFile) return;
    setWaStatus(strings.inbox.whatsappUnzipping);
    setWaPendingCursor(null);
    setWaImportAll(false);
    try {
      const { chatText, mediaFiles: media } = await unzipChatExport(zipFile);
      const messages = parseChatText(chatText);
      const detectedSenders = distinctSenders(messages);
      setChatMessages(messages);
      setMediaFiles(media);
      setSenders(detectedSenders);
      setTeacherSender(detectedSenders[0] ?? "");
      setWaStep("pick-teacher");
    } finally {
      setWaStatus(null);
    }
  }

  async function processWhatsApp() {
    if (!teacherSender) return;
    setWaStep("processing");
    setCommitted(false);

    const cutoff = waImportAll ? null : waCursor;
    const teacherMessages = chatMessages
      .filter((m) => m.sender === teacherSender)
      .filter((m) => !cutoff || m.timestamp > cutoff);

    if (teacherMessages.length > 0) {
      const maxTimestamp = teacherMessages.reduce(
        (max, m) => (m.timestamp > max ? m.timestamp : max),
        teacherMessages[0].timestamp
      );
      setWaPendingCursor({ chatIdentifier: teacherSender, lastImportedAt: maxTimestamp.toISOString() });
    }

    const textEntries = teacherMessages
      .map((m, index) => ({ m, index }))
      .filter(({ m }) => !m.attachmentFilename && m.text.trim());

    const voiceNoteEntries = teacherMessages
      .filter((m) => m.attachmentFilename && isVoiceNoteFilename(m.attachmentFilename))
      .map((m) => ({ timestamp: m.timestamp, file: mediaFiles.get(m.attachmentFilename!) }))
      .filter((v): v is { timestamp: Date; file: File } => !!v.file);

    const uploadedRecordings: { id: string; timestamp: Date }[] = [];
    for (let i = 0; i < voiceNoteEntries.length; i++) {
      setWaStatus(`${strings.inbox.whatsappUploadingVoiceNotes} (${i + 1}/${voiceNoteEntries.length})`);
      const { file, timestamp } = voiceNoteEntries[i];
      const { id } = await uploadAndTranscribeRecording(file, {
        lessonId: lessonId || null,
        maxAutoTranscribeDurationSec: config.autoTranscribeMaxDurationSec,
      });
      uploadedRecordings.push({ id, timestamp });
    }

    setWaStatus(strings.inbox.whatsappParsing);
    const { rows: parsedRows } = await fetch("/api/inbox/parse-whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: textEntries.map(({ m, index }) => ({ index, text: m.text })),
      }),
    }).then((r) => r.json());

    const withRecording: Row[] = (parsedRows ?? []).map(
      (row: Row & { source_index: number }) => {
        const sourceTimestamp = teacherMessages[row.source_index]?.timestamp;
        let recordingId: string | null = null;
        if (sourceTimestamp && uploadedRecordings.length > 0) {
          let best = uploadedRecordings[0];
          let bestDiff = Math.abs(sourceTimestamp.getTime() - best.timestamp.getTime());
          for (const rec of uploadedRecordings.slice(1)) {
            const diff = Math.abs(sourceTimestamp.getTime() - rec.timestamp.getTime());
            if (diff < bestDiff) {
              best = rec;
              bestDiff = diff;
            }
          }
          recordingId = best.id;
        }
        const { hebrew_meaning, translit_nikud, item_type, confidence, notes, duplicate_of } = row;
        return { hebrew_meaning, translit_nikud, item_type, confidence, notes, duplicate_of, recording_id: recordingId };
      }
    );

    setRows(withRecording);
    setWaStatus(null);
    setWaStep("pick-zip");
    setZipFile(null);
    setChatMessages([]);
    setMediaFiles(new Map());
    setSenders([]);
    setTeacherSender("");
  }

  function playLinkedRecording(recordingId: string) {
    fetch(`/api/recordings/${recordingId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.audio_url && previewAudioRef.current) {
          previewAudioRef.current.src = d.audio_url;
          previewAudioRef.current.play();
        }
      });
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
      {
        hebrew_meaning: "",
        translit_nikud: "",
        item_type: "phrase",
        confidence: "high",
        notes: "",
        duplicate_of: null,
        recording_id: null,
      },
    ]);
  }

  async function commit() {
    setCommitting(true);
    await fetch("/api/inbox/commit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rows: rows.map(({ hebrew_meaning, translit_nikud, item_type, notes, recording_id }) => ({
          hebrew_meaning,
          translit_nikud,
          item_type,
          notes,
          recording_id,
        })),
        lesson_id: lessonId || null,
      }),
    });

    if (waPendingCursor) {
      await fetch("/api/inbox/whatsapp-cursor", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_identifier: waPendingCursor.chatIdentifier,
          last_imported_at: waPendingCursor.lastImportedAt,
        }),
      });
      setWaPendingCursor(null);
      setWaCursor(new Date(waPendingCursor.lastImportedAt));
    }

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
        <button
          onClick={() => setTab("whatsapp")}
          className={tab === "whatsapp" ? "font-bold border-b-2 border-black pb-2" : "text-gray-500 pb-2"}
        >
          {strings.inbox.whatsappTab}
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
      ) : tab === "photo" ? (
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
      ) : (
        <div className="flex flex-col gap-2">
          {waStep === "pick-zip" && (
            <>
              <label className="flex flex-col gap-1">
                <span>{strings.inbox.whatsappZipLabel}</span>
                <input
                  type="file"
                  accept=".zip"
                  onChange={(e) => setZipFile(e.target.files?.[0] ?? null)}
                />
              </label>
              <button
                onClick={handleUnzip}
                disabled={!zipFile || waStatus !== null}
                className="self-start bg-black text-white rounded px-4 py-2 disabled:opacity-50"
              >
                {waStatus ?? strings.inbox.whatsappUnzip}
              </button>
            </>
          )}
          {waStep === "pick-teacher" && (
            <>
              <label className="flex flex-col gap-1">
                <span>{strings.inbox.whatsappTeacherLabel}</span>
                <select
                  value={teacherSender}
                  onChange={(e) => setTeacherSender(e.target.value)}
                  className="border rounded px-3 py-2"
                >
                  {senders.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              {waCursor && (
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-gray-600">
                    {strings.inbox.whatsappCursorNotice} {waCursor.toLocaleDateString("he-IL")}
                  </p>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={waImportAll}
                      onChange={(e) => setWaImportAll(e.target.checked)}
                    />
                    {strings.inbox.whatsappImportAll}
                  </label>
                </div>
              )}
              <button
                onClick={processWhatsApp}
                disabled={!teacherSender}
                className="self-start bg-black text-white rounded px-4 py-2 disabled:opacity-50"
              >
                {strings.inbox.whatsappTeacherContinue}
              </button>
            </>
          )}
          {waStep === "processing" && <p className="text-gray-500">{waStatus}</p>}
        </div>
      )}

      {committed && <p className="text-green-700">{strings.inbox.committed}</p>}

      <audio ref={previewAudioRef} className="hidden" />

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
                <label className="flex flex-col gap-1">
                  <span className="text-sm text-gray-500">{strings.inbox.colNotes}</span>
                  <input
                    value={row.notes}
                    onChange={(e) => updateRow(i, { notes: e.target.value })}
                    className="border rounded px-2 py-1 nikud-text"
                  />
                </label>
                <div className="flex items-center gap-4 flex-wrap">
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
                  {row.recording_id && (
                    <button
                      onClick={() => playLinkedRecording(row.recording_id!)}
                      className="text-sm text-blue-700 underline"
                    >
                      🔊 {strings.inbox.linkedRecording}
                    </button>
                  )}
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
