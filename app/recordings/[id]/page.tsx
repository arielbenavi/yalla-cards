"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { strings } from "@/lib/strings";
import { config } from "@/lib/config";
import { createClip } from "@/lib/clip";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { isMobileDevice } from "@/lib/device";

type Word = { word: string; start: number; end: number };
type Recording = {
  id: string;
  storage_path: string;
  duration_sec: number | null;
  transcript_json: { words: Word[] } | null;
  title: string | null;
};
type Clip = { id: string; audio_start_sec: number; audio_end_sec: number; translit_nikud: string; hebrew_meaning: string };
type CardResult = { id: string; hebrew_meaning: string; translit_nikud: string };

export default function RecordingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [recording, setRecording] = useState<Recording | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [anchor, setAnchor] = useState<Word | null>(null);
  const [start, setStart] = useState<number | null>(null);
  const [end, setEnd] = useState<number | null>(null);
  const [mode, setMode] = useState<"attach" | "create">("create");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CardResult[]>([]);
  const [newMeaning, setNewMeaning] = useState("");
  const [newTranslit, setNewTranslit] = useState("");
  const [attached, setAttached] = useState(false);
  const [attachedTimer, setAttachedTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [attaching, setAttaching] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [titleInput, setTitleInput] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [clips, setClips] = useState<Clip[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  useEffect(() => {
    fetch(`/api/recordings/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setRecording(d.recording);
        setAudioUrl(d.audio_url);
        setClips(d.clips ?? []);
      });
  }, [id]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/cards/search?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((d) => setResults(d.cards ?? []));
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  async function transcribeNow() {
    if (!audioUrl) return;
    setTranscribing(true);
    try {
      const blob = await fetch(audioUrl).then((r) => r.blob());
      const form = new FormData();
      form.append("chunk", blob, "audio.ogg");
      form.append("offset_sec", "0");
      const res = await fetch(`/api/recordings/${id}/transcribe-chunk`, { method: "POST", body: form });
      if (!res.ok) throw new Error("transcription failed");
      const { words } = await res.json();
      if (words?.length) {
        await fetch(`/api/recordings/${id}/save-transcript`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ words }),
        });
        // Reload recording to show transcript
        const d = await fetch(`/api/recordings/${id}`).then((r) => r.json());
        setRecording(d.recording);
      }
    } finally {
      setTranscribing(false);
    }
  }

  function seekTo(t: number) {
    if (audioRef.current) {
      audioRef.current.currentTime = t;
      audioRef.current.play();
    }
  }

  function selectWord(word: Word) {
    if (isMobile) return;
    if (anchor === null) {
      // First double-click: anchor this word, show single-word preview
      setAnchor(word);
      setStart(word.start);
      setEnd(word.end);
    } else {
      // Second double-click: finalize range between anchor and this word
      const a = anchor;
      setAnchor(null);
      if (word.start >= a.start) {
        setStart(a.start);
        setEnd(word.end);
      } else {
        setStart(word.start);
        setEnd(a.end);
      }
    }
  }

  function clearSelection() {
    setAnchor(null);
    setStart(null);
    setEnd(null);
  }

  function nudge(which: "start" | "end", delta: number) {
    if (which === "start" && start !== null) setStart(Math.max(0, start + delta));
    if (which === "end" && end !== null) setEnd(Math.max(0, end + delta));
  }

  async function uploadClip(): Promise<string | null> {
    if (start === null || end === null || !audioUrl) return null;

    const clipBlob = await createClip(audioUrl, start, end);

    const { path, token } = await fetch("/api/recordings/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ extension: "wav" }),
    }).then((r) => r.json());

    const supabase = supabaseBrowser();
    const { error } = await supabase.storage.from("recordings").uploadToSignedUrl(path, token, clipBlob);
    if (error) return null;

    return path;
  }

  async function attachToCard(cardId: string) {
    if (start === null || end === null) return;
    setAttaching(true);
    const clipPath = await uploadClip();
    await fetch(`/api/recordings/${id}/attach`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        card_id: cardId,
        audio_start_sec: start,
        audio_end_sec: end,
        clip_path: clipPath,
      }),
    });
    setAttaching(false);
    flashAttached();
  }

  function flashAttached() {
    setAttached(true);
    if (attachedTimer) clearTimeout(attachedTimer);
    setAttachedTimer(setTimeout(() => setAttached(false), 3000));
    // Refresh clips so new highlight appears immediately
    fetch(`/api/recordings/${id}`)
      .then((r) => r.json())
      .then((d) => setClips(d.clips ?? []));
  }

  async function createFromRange() {
    if (start === null || end === null) return;
    setAttaching(true);
    const clipPath = await uploadClip();
    await fetch(`/api/recordings/${id}/attach`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hebrew_meaning: newMeaning,
        translit_nikud: newTranslit,
        audio_start_sec: start,
        audio_end_sec: end,
        clip_path: clipPath,
      }),
    });
    setAttaching(false);
    flashAttached();
    setNewMeaning("");
    setNewTranslit("");
  }

  if (!recording) {
    return <div className="p-4">{strings.common.loading}</div>;
  }

  const words = recording.transcript_json?.words ?? [];

  async function saveTitle(value: string) {
    await fetch(`/api/recordings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: value.trim() || null }),
    });
    setRecording((r) => r ? { ...r, title: value.trim() || null } : r);
    setTitleInput(null);
  }

  return (
    <div className="flex flex-col gap-6 p-4 max-w-2xl mx-auto">
      {titleInput !== null ? (
        <input
          autoFocus
          value={titleInput}
          onChange={(e) => setTitleInput(e.target.value)}
          onBlur={() => saveTitle(titleInput)}
          onKeyDown={(e) => { if (e.key === "Enter") saveTitle(titleInput); if (e.key === "Escape") setTitleInput(null); }}
          className="text-2xl font-bold border-b border-gray-300 outline-none bg-transparent"
          placeholder="שם ההקלטה…"
        />
      ) : (
        <h1
          className="text-2xl font-bold cursor-pointer hover:opacity-70"
          title="לחץ לעריכת שם"
          onClick={() => setTitleInput(recording.title ?? "")}
        >
          {recording.title || strings.recordings.detailTitle}
          <span className="text-base font-normal text-gray-400 mr-2">✏️</span>
        </h1>
      )}

      {audioUrl && <audio ref={audioRef} src={audioUrl} controls className="w-full" />}

      <div>
        <h2 className="text-lg font-bold mb-2">{strings.recordings.transcript}</h2>
        {words.length === 0 ? (
          <div className="flex items-center gap-3">
            <p className="text-gray-500">{strings.recordings.noTranscript}</p>
            {audioUrl && (
              <button
                onClick={transcribeNow}
                disabled={transcribing}
                className="text-sm border rounded px-3 py-1 hover:bg-gray-50 disabled:opacity-50"
              >
                {transcribing ? "מתמלל…" : "תמלל עכשיו"}
              </button>
            )}
          </div>
        ) : (
          <p className="nikud-text leading-loose">
            {words.map((w, i) => {
              const selected = start !== null && end !== null && w.start >= start && w.end <= end;
              const isAnchor = anchor !== null && w.start === anchor.start;
              const linkedClip = clips.find((c) => w.start < c.audio_end_sec && w.end > c.audio_start_sec);
              const isLinked = !!linkedClip;
              return (
                <span key={i} title={isLinked ? `${linkedClip!.translit_nikud} — ${linkedClip!.hebrew_meaning}` : undefined}>
                  <button
                    onClick={() => seekTo(w.start)}
                    onDoubleClick={() => selectWord(w)}
                    className={
                      isAnchor
                        ? "bg-orange-300 rounded px-0.5"
                        : selected
                        ? "bg-yellow-300 rounded px-0.5"
                        : isLinked
                        ? "bg-yellow-100 rounded px-0.5 underline decoration-yellow-400"
                        : "hover:bg-gray-100 rounded px-0.5"
                    }
                  >
                    {w.word}
                  </button>{" "}
                </span>
              );
            })}
          </p>
        )}
      </div>

      {isMobile && words.length > 0 && (
        <p className="text-orange-700 bg-orange-50 border border-orange-400 rounded p-3">
          {strings.recordings.mobileClipNotice}
        </p>
      )}

      {!isMobile && start !== null && end !== null && (
        <div className="border rounded p-3 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">{strings.recordings.selectRange}</h3>
            <button onClick={clearSelection} className="text-sm text-gray-500 hover:text-gray-800">
              ✕ נקה
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span>{strings.recordings.startLabel}:</span>
            <bdi>{start.toFixed(2)}s</bdi>
            <button onClick={() => seekTo(start)} title="האזן מנקודת ההתחלה" className="border rounded px-2">🔊</button>
            <button onClick={() => nudge("start", -config.audioNudgeSec)} className="border rounded px-2">
              {strings.recordings.nudgeBack}
            </button>
            <button onClick={() => nudge("start", config.audioNudgeSec)} className="border rounded px-2">
              {strings.recordings.nudgeForward}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span>{strings.recordings.endLabel}:</span>
            <bdi>{end.toFixed(2)}s</bdi>
            <button onClick={() => seekTo(Math.max(0, end - 1.5))} title="האזן לפני נקודת הסיום" className="border rounded px-2">🔊</button>
            <button onClick={() => nudge("end", -config.audioNudgeSec)} className="border rounded px-2">
              {strings.recordings.nudgeBack}
            </button>
            <button onClick={() => nudge("end", config.audioNudgeSec)} className="border rounded px-2">
              {strings.recordings.nudgeForward}
            </button>
          </div>

          <div className="flex gap-4 border-b">
            <button
              onClick={() => setMode("attach")}
              className={mode === "attach" ? "font-bold border-b-2 border-black pb-2" : "text-gray-500 pb-2"}
            >
              {strings.recordings.attachExisting}
            </button>
            <button
              onClick={() => setMode("create")}
              className={mode === "create" ? "font-bold border-b-2 border-black pb-2" : "text-gray-500 pb-2"}
            >
              {strings.recordings.createNew}
            </button>
          </div>

          {mode === "attach" ? (
            <div className="flex flex-col gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={strings.recordings.searchCards}
                className="border rounded px-3 py-2 nikud-text"
              />
              {results.map((c) => (
                <button
                  key={c.id}
                  onClick={() => attachToCard(c.id)}
                  disabled={attaching}
                  className="text-start border rounded px-3 py-2 hover:bg-gray-50 disabled:opacity-50"
                >
                  {c.translit_nikud} — {c.hebrew_meaning}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <input
                value={newTranslit}
                onChange={(e) => setNewTranslit(e.target.value)}
                placeholder={strings.inbox.colTranslit}
                className="border rounded px-3 py-2 nikud-text"
              />
              <input
                value={newMeaning}
                onChange={(e) => setNewMeaning(e.target.value)}
                placeholder={strings.inbox.colMeaning}
                className="border rounded px-3 py-2 nikud-text"
              />
              <button
                onClick={createFromRange}
                disabled={attaching}
                className="self-start bg-black text-white rounded px-4 py-2 disabled:opacity-50"
              >
                {attaching ? strings.recordings.clipping : strings.recordings.attach}
              </button>
            </div>
          )}

          {attached && <p className="text-green-700">{strings.recordings.attached}</p>}
        </div>
      )}
    </div>
  );
}
