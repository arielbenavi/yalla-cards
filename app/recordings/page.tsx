"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { strings } from "@/lib/strings";
import { uploadAndTranscribeRecording, type UploadStatus } from "@/lib/recording-upload";
import { FileDropZone } from "@/components/FileDropZone";

type Lesson = { id: string; date: string; title: string | null };
type Recording = {
  id: string;
  storage_path: string;
  duration_sec: number | null;
  tag: string | null;
  title: string | null;
  source_filename: string | null;
  created_at: string;
  lesson: { title: string | null; date: string } | null;
  clips: { audio_start_sec: number; audio_end_sec: number }[] | null;
  has_transcript: boolean;
  coverage_total: number;
  coverage_linked: number;
};

export default function RecordingsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [lessonId, setLessonId] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState("");
  const [clipsFilter, setClipsFilter] = useState<"" | "has" | "none">("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [transcribingIds, setTranscribingIds] = useState<Set<string>>(new Set());
  const [bulkTranscribing, setBulkTranscribing] = useState(false);

  async function refresh() {
    const [lessonsRes, recordingsRes] = await Promise.all([
      fetch("/api/lessons").then((r) => r.json()),
      fetch("/api/recordings").then((r) => r.json()),
    ]);
    setLessons(lessonsRes.lessons ?? []);
    setRecordings(recordingsRes.recordings ?? []);
  }

  useEffect(() => {
    refresh();
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setIsAdmin(Boolean(d.isAdmin)))
      .catch(() => {});
  }, []);

  const statusLabels: Record<UploadStatus, string> = {
    transcoding: strings.recordings.transcoding,
    uploading: strings.recordings.uploading,
    transcribing: strings.recordings.transcribing,
  };

  const tags = Array.from(new Set(recordings.map((r) => r.tag).filter((t): t is string => !!t)));
  const filteredRecordings = recordings.filter((r) => {
    if (tagFilter && r.tag !== tagFilter) return false;
    const clipCount = r.clips?.length ?? 0;
    if (clipsFilter === "has" && clipCount === 0) return false;
    if (clipsFilter === "none" && clipCount > 0) return false;
    return true;
  });

  async function handleUpload() {
    if (!file) return;
    try {
      await uploadAndTranscribeRecording(file, {
        lessonId: lessonId || null,
        title: title.trim() || null,
        onStatus: (s) => setStatus(statusLabels[s]),
      });
      setFile(null);
      setTitle("");
      await refresh();
      await sweepUntitledAndUntranscribed();
    } finally {
      setStatus(null);
    }
  }

  // Runs after every upload so the list never accumulates recordings that are
  // both untitled and untranscribed — the WhatsApp import path skips
  // auto-transcription above its duration cap and never supplies a title.
  async function sweepUntitledAndUntranscribed() {
    const fresh: Recording[] = await fetch("/api/recordings")
      .then((r) => r.json())
      .then((d) => d.recordings ?? []);

    const untitled = fresh.filter((r) => !r.title && r.source_filename);
    for (const r of untitled) {
      const derived = r.source_filename!.replace(/\.[^.]+$/, "").trim();
      if (!derived) continue;
      await fetch(`/api/recordings/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: derived }),
      });
    }

    const untranscribed = fresh.filter((r) => !r.has_transcript);
    for (const r of untranscribed) {
      await transcribeOne(r.id);
    }

    if (untitled.length > 0 || untranscribed.length > 0) await refresh();
  }

  async function transcribeOne(recordingId: string) {
    setTranscribingIds((prev) => new Set(prev).add(recordingId));
    try {
      const d = await fetch(`/api/recordings/${recordingId}`).then((r) => r.json());
      const audioUrl: string | null = d.audio_url;
      if (!audioUrl) return;
      const blob = await fetch(audioUrl).then((r) => r.blob());
      const form = new FormData();
      form.append("chunk", blob, "audio.ogg");
      form.append("offset_sec", "0");
      const res = await fetch(`/api/recordings/${recordingId}/transcribe-chunk`, { method: "POST", body: form });
      if (!res.ok) return;
      const { words } = await res.json();
      if (words?.length) {
        await fetch(`/api/recordings/${recordingId}/save-transcript`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ words }),
        });
        setRecordings((prev) =>
          prev.map((r) => (r.id === recordingId ? { ...r, has_transcript: true } : r))
        );
      }
    } finally {
      setTranscribingIds((prev) => {
        const next = new Set(prev);
        next.delete(recordingId);
        return next;
      });
    }
  }

  async function transcribeAll() {
    const untranscribed = recordings.filter((r) => !r.has_transcript);
    setBulkTranscribing(true);
    for (const r of untranscribed) {
      await transcribeOne(r.id);
    }
    setBulkTranscribing(false);
  }

  const untranscribedCount = recordings.filter((r) => !r.has_transcript).length;

  return (
    <div className="flex flex-col gap-6 p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">{strings.recordings.title}</h1>

      {isAdmin && (
        <div className="flex flex-col gap-2 border rounded p-3">
          <label className="flex flex-col gap-1">
            <span>{strings.recordings.lessonLabel}</span>
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
          <label className="flex flex-col gap-1">
            <span>שם ההקלטה</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="למשל: שיעור 12 — בשוק"
              className="border rounded px-3 py-2"
            />
          </label>
          <FileDropZone
            accept="audio/*"
            value={file ? [file] : []}
            onChange={(fs) => {
              const f = fs[0] ?? null;
              setFile(f);
              if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, ""));
            }}
            hint="קבצי MP3, M4A, WAV, OGG וכד׳"
          />
          <div className="flex items-center gap-3">
            <button
              onClick={handleUpload}
              disabled={!file || status !== null}
              className="self-start bg-black text-white rounded px-4 py-2 disabled:opacity-50"
            >
              {status ?? strings.recordings.upload}
            </button>
            {untranscribedCount > 0 && (
              <button
                onClick={transcribeAll}
                disabled={bulkTranscribing}
                className="text-sm border rounded px-3 py-2 hover:bg-gray-50 disabled:opacity-50"
              >
                {bulkTranscribing ? "מתמלל..." : `תמלל הכל (${untranscribedCount})`}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 items-center">
        {tags.length > 0 && (
          <label className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{strings.recordings.tagFilterLabel}</span>
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="">{strings.recordings.tagFilterAll}</option>
              {tags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="flex items-center gap-2">
          <span className="text-sm text-gray-500">קליפים</span>
          <select
            value={clipsFilter}
            onChange={(e) => setClipsFilter(e.target.value as "" | "has" | "none")}
            className="border rounded px-3 py-2"
          >
            <option value="">הכל</option>
            <option value="has">יש קליפים</option>
            <option value="none">אין קליפים</option>
          </select>
        </label>
      </div>

      <div className="flex flex-col gap-2">
        {filteredRecordings.length === 0 ? (
          <p className="text-gray-500">{strings.recordings.noRecordings}</p>
        ) : (
          filteredRecordings.map((r) => (
            <Link
              key={r.id}
              href={`/recordings/${r.id}`}
              className="border rounded p-3 flex justify-between hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              <span className="flex items-center gap-2 flex-wrap">
                {r.title || r.lesson?.title || r.lesson?.date || strings.inbox.noLesson}
                {r.tag && (
                  <span className="text-xs bg-gray-100 border rounded-full px-2 py-0.5 text-gray-600">
                    {r.tag}
                  </span>
                )}
                {(r.clips?.length ?? 0) > 0 && (
                  <span className="text-xs bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5 text-blue-600">
                    {r.clips!.length} קליפים
                  </span>
                )}
                {transcribingIds.has(r.id) && (
                  <span className="text-xs bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5 text-blue-600">
                    בתהליך תמלול
                  </span>
                )}
                {r.coverage_total > 0 && (
                  <span
                    className={`text-xs rounded-full px-2 py-0.5 border ${
                      r.coverage_linked === 0
                        ? "bg-gray-50 border-gray-200 text-gray-400"
                        : r.coverage_linked / r.coverage_total >= 0.5
                        ? "bg-yellow-50 border-yellow-300 text-yellow-700"
                        : "bg-yellow-50 border-yellow-200 text-yellow-600"
                    }`}
                  >
                    {Math.round((r.coverage_linked / r.coverage_total) * 100)}% משויך
                  </span>
                )}
              </span>
              <span className="text-gray-500 text-sm">
                {r.duration_sec ? `${Math.round(r.duration_sec / 60)} min` : ""}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
