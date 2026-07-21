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
  created_at: string;
  lesson: { title: string | null; date: string } | null;
  clips: { count: number }[] | null;
};

export default function RecordingsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [lessonId, setLessonId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState("");
  const [clipsFilter, setClipsFilter] = useState<"" | "has" | "none">("");

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
  }, []);

  const statusLabels: Record<UploadStatus, string> = {
    transcoding: strings.recordings.transcoding,
    uploading: strings.recordings.uploading,
    transcribing: strings.recordings.transcribing,
  };

  const tags = Array.from(new Set(recordings.map((r) => r.tag).filter((t): t is string => !!t)));
  const filteredRecordings = recordings.filter((r) => {
    if (tagFilter && r.tag !== tagFilter) return false;
    if (clipsFilter === "has" && (r.clips?.[0]?.count ?? 0) === 0) return false;
    if (clipsFilter === "none" && (r.clips?.[0]?.count ?? 0) > 0) return false;
    return true;
  });

  async function handleUpload() {
    if (!file) return;

    try {
      await uploadAndTranscribeRecording(file, {
        lessonId: lessonId || null,
        onStatus: (s) => setStatus(statusLabels[s]),
      });
      setFile(null);
      refresh();
    } finally {
      setStatus(null);
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">{strings.recordings.title}</h1>

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
        <FileDropZone
          accept="audio/*"
          value={file ? [file] : []}
          onChange={(fs) => setFile(fs[0] ?? null)}
          hint="קבצי MP3, M4A, WAV, OGG וכד׳"
        />
        <button
          onClick={handleUpload}
          disabled={!file || status !== null}
          className="self-start bg-black text-white rounded px-4 py-2 disabled:opacity-50"
        >
          {status ?? strings.recordings.upload}
        </button>
      </div>

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
              className="border rounded p-3 flex justify-between hover:bg-gray-50"
            >
              <span className="flex items-center gap-2 flex-wrap">
                {r.title || r.lesson?.title || r.lesson?.date || strings.inbox.noLesson}
                {r.tag && (
                  <span className="text-xs bg-gray-100 border rounded-full px-2 py-0.5 text-gray-600">
                    {r.tag}
                  </span>
                )}
                {(r.clips?.[0]?.count ?? 0) > 0 && (
                  <span className="text-xs bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5 text-blue-600">
                    {r.clips![0].count} קליפים
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
