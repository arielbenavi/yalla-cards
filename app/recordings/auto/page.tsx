"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import Link from "next/link";
import { strings } from "@/lib/strings";
import { clipFromBuffer } from "@/lib/clip";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Item = {
  id: string;
  card_id: string;
  recording_id: string;
  start: number;
  end: number;
  confidence: number;
  signals: { matched?: string; heard?: string; heard_score?: number; meaning_near?: boolean };
  translit_nikud: string;
  arabic_script: string | null;
  hebrew_meaning: string;
  recording_title: string;
  audio_url: string | null;
  context: { word: string; inside: boolean }[];
};
type Band = { label: "high" | "mid" | "low"; approved: number; rejected: number };

const t = strings.recordings.auto;
const NUDGES = [-0.5, -0.1, 0.1, 0.5];
const EDGE_PLAY_SEC = 1.2;
const WAVE_MARGIN_SEC = 2.5;
const MAX_DECODED = 4;

export default function AutoClipPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [remaining, setRemaining] = useState(0);
  const [bands, setBands] = useState<Band[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [buffer, setBuffer] = useState<AudioBuffer | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const skipped = useRef(new Set<string>());
  const handled = useRef(new Set<string>());
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const decoded = useRef(new Map<string, Promise<AudioBuffer>>());

  const item = items[0] ?? null;

  const audioCtx = useCallback(() => {
    if (!ctxRef.current) ctxRef.current = new AudioContext();
    return ctxRef.current;
  }, []);

  const decode = useCallback(
    (it: Item): Promise<AudioBuffer> => {
      const cache = decoded.current;
      const hit = cache.get(it.recording_id);
      if (hit) return hit;
      const promise = fetch(it.audio_url!)
        .then((r) => r.arrayBuffer())
        .then((b) => audioCtx().decodeAudioData(b));
      cache.set(it.recording_id, promise);
      if (cache.size > MAX_DECODED) cache.delete(cache.keys().next().value!);
      return promise;
    },
    [audioCtx]
  );

  const play = useCallback(
    (from: number, to: number, audio: AudioBuffer | null = buffer) => {
      if (!audio) return;
      const ctx = audioCtx();
      void ctx.resume();
      sourceRef.current?.stop();
      const source = ctx.createBufferSource();
      source.buffer = audio;
      source.connect(ctx.destination);
      source.start(0, Math.max(0, from), Math.max(0.05, to - from));
      sourceRef.current = source;
    },
    [audioCtx, buffer]
  );

  const fetchQueue = useCallback(async () => {
    const res = await fetch(`/api/clip-suggestions?limit=20&skip=${[...skipped.current].join(",")}`);
    const data = await res.json();
    setRemaining(data.remaining ?? 0);
    setBands(data.bands ?? []);
    setItems((data.items ?? []).filter((i: Item) => !handled.current.has(i.id)));
    setLoaded(true);
  }, []);

  useEffect(() => {
    void fetchQueue();
  }, [fetchQueue]);

  // A new item: its range, its audio, and the next one's audio ready ahead of time.
  const itemId = item?.id;
  useEffect(() => {
    if (!item) return;
    setStart(item.start);
    setEnd(item.end);
    setBuffer(null);
    setFailed(false);
    let live = true;
    decode(item).then((audio) => {
      if (!live) return;
      setBuffer(audio);
      if (ctxRef.current?.state === "running") play(item.start, item.end, audio);
    });
    if (items[1]) void decode(items[1]);
    return () => {
      live = false;
    };
    // Only when the item at the head changes, not on every list update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);

  function advance() {
    const rest = items.slice(1);
    setItems(rest);
    if (rest.length < 4) void fetchQueue();
  }

  function nudge(edge: "start" | "end", delta: number) {
    if (edge === "start") {
      const next = Math.max(0, Math.min(start + delta, end - 0.05));
      setStart(next);
      play(next, Math.min(next + EDGE_PLAY_SEC, end));
    } else {
      const next = Math.max(start + 0.05, end + delta);
      setEnd(next);
      play(Math.max(start, next - EDGE_PLAY_SEC), next);
    }
  }

  async function decide(action: "reject" | "no_audio") {
    if (!item || busy) return;
    setBusy(true);
    const res = await fetch(`/api/clip-suggestions/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setBusy(false);
    if (!res.ok) return setFailed(true);
    handled.current.add(item.id);
    setRemaining((n) => (action === "no_audio" ? n - 1 : n));
    advance();
  }

  async function approve() {
    if (!item || !buffer || busy) return;
    setBusy(true);
    try {
      const blob = clipFromBuffer(buffer, start, end);
      const { path, token } = await fetch("/api/recordings/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extension: "wav" }),
      }).then((r) => r.json());
      const { error } = await supabaseBrowser().storage.from("recordings").uploadToSignedUrl(path, token, blob);
      if (error) throw error;
      const res = await fetch(`/api/clip-suggestions/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", start, end, clip_path: path }),
      });
      if (!res.ok) throw new Error(await res.text());
      handled.current.add(item.id);
      setRemaining((n) => n - 1);
      advance();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  function skip() {
    if (!item) return;
    skipped.current.add(item.card_id);
    advance();
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey) return;
      if (e.code === "Space") {
        e.preventDefault();
        play(start, end);
      } else if (e.key === "Enter") {
        e.preventDefault();
        void approve();
      } else if (e.code === "KeyX") {
        void decide("reject");
      } else if (e.code === "KeyS") {
        skip();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="max-w-2xl mx-auto p-4 flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <span className="text-sm text-gray-500" data-testid="remaining">
          {t.remaining} {remaining}
        </span>
      </div>
      <BandSummary bands={bands} />

      {loaded && !item && <p className="text-gray-500">{t.empty}</p>}

      {item && (
        <div className="border rounded-lg p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-2xl nikud-text">{item.translit_nikud}</p>
              {item.arabic_script && <p className="text-xl" dir="rtl" lang="ar">{item.arabic_script}</p>}
              <p className="text-gray-600">{item.hebrew_meaning}</p>
            </div>
            <ConfidenceChip value={item.confidence} />
          </div>

          <div className="text-sm text-gray-600 flex flex-col gap-1">
            <p className="font-medium">
              <Link href={`/recordings/${item.recording_id}`} className="hover:underline">{item.recording_title}</Link>
            </p>
            <p className="leading-7">
              {item.context.map((w, i) => (
                <span key={i} className={w.inside ? "font-bold text-black bg-yellow-100 rounded px-0.5" : ""}>{w.word} </span>
              ))}
            </p>
            {item.signals.heard && <p>{t.heard}: <span lang="ar">{item.signals.heard}</span></p>}
            {item.signals.meaning_near && <p>✓ {t.meaningNear}</p>}
          </div>

          {buffer ? (
            <Waveform buffer={buffer} start={start} end={end} onChange={(s, e) => { setStart(s); setEnd(e); }} onRelease={(s, e) => play(s, e)} />
          ) : (
            <p className="text-sm text-gray-500 h-24 flex items-center">{t.loading}</p>
          )}

          <EdgeRow label={t.start} value={start} onNudge={(d) => nudge("start", d)} />
          <EdgeRow label={t.end} value={end} onNudge={(d) => nudge("end", d)} />

          <div className="flex gap-2 flex-wrap">
            <button onClick={() => play(start, end)} disabled={!buffer} className="border rounded px-4 py-2 disabled:opacity-50">🔊 {t.play}</button>
            <button onClick={() => play(start - 2, end + 2)} disabled={!buffer} className="border rounded px-4 py-2 disabled:opacity-50">{t.playContext}</button>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => void approve()} disabled={!buffer || busy} className="bg-black text-white rounded px-6 py-2 font-medium disabled:opacity-50">✓ {t.approve}</button>
            <button onClick={() => void decide("reject")} disabled={busy} className="border rounded px-4 py-2 disabled:opacity-50">✗ {t.reject}</button>
            <button onClick={() => void decide("no_audio")} disabled={busy} className="border rounded px-4 py-2 text-gray-600 disabled:opacity-50">{t.noAudio}</button>
            <button onClick={skip} className="border rounded px-4 py-2 text-gray-600">{t.skip}</button>
          </div>
          {failed && <p className="text-red-600 text-sm">{t.saveFailed}</p>}
          <p className="text-xs text-gray-400 hidden md:block">{t.keys}</p>
        </div>
      )}
    </div>
  );
}

function ConfidenceChip({ value }: { value: number }) {
  const color = value >= 0.85 ? "bg-green-100 text-green-800" : value >= 0.5 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800";
  return <span data-testid="confidence" className={`shrink-0 rounded-full px-3 py-1 text-sm font-medium ${color}`}><bdi>{Math.round(value * 100)}%</bdi></span>;
}

function BandSummary({ bands }: { bands: Band[] }) {
  const shown = bands.filter((b) => b.approved + b.rejected > 0);
  if (!shown.length) return null;
  return (
    <p className="text-xs text-gray-500">
      {t.accuracy}: {shown.map((b) => `${t[b.label]} ${b.approved}/${b.approved + b.rejected}`).join(" · ")}
    </p>
  );
}

function EdgeRow({ label, value, onNudge }: { label: string; value: number; onNudge: (delta: number) => void }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="w-14 text-sm">{label}</span>
      <div dir="ltr" className="flex items-center gap-1">
        {NUDGES.map((d) => (
          <button key={d} onClick={() => onNudge(d)} aria-label={`${label} ${d > 0 ? "+" : ""}${d}`} className="border rounded px-2.5 py-1.5 text-sm tabular-nums">
            {d > 0 ? `▶ ${d}` : `${Math.abs(d)} ◀`}
          </button>
        ))}
        <span className="text-sm tabular-nums ms-2" data-testid={`edge-${label}`}>{value.toFixed(2)}s</span>
      </div>
    </div>
  );
}

// Time runs left to right here regardless of the page's direction, as on any audio tool.
function Waveform({
  buffer,
  start,
  end,
  onChange,
  onRelease,
}: {
  buffer: AudioBuffer;
  start: number;
  end: number;
  onChange: (start: number, end: number) => void;
  onRelease: (start: number, end: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragging = useRef<"start" | "end" | null>(null);
  const [view, setView] = useState({ from: Math.max(0, start - WAVE_MARGIN_SEC), to: end + WAVE_MARGIN_SEC });

  // Widen the view when an edge leaves it, or on a new range far from it.
  useEffect(() => {
    if (dragging.current) return;
    setView((v) =>
      start < v.from || end > v.to || v.to - v.from > (end - start) + 3 * WAVE_MARGIN_SEC
        ? { from: Math.max(0, start - WAVE_MARGIN_SEC), to: end + WAVE_MARGIN_SEC }
        : v
    );
  }, [start, end]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const scale = window.devicePixelRatio || 1;
    canvas.width = width * scale;
    canvas.height = height * scale;
    const g = canvas.getContext("2d")!;
    g.scale(scale, scale);
    const data = buffer.getChannelData(0);
    const span = view.to - view.from;
    const x = (time: number) => ((time - view.from) / span) * width;
    g.fillStyle = "rgba(250, 204, 21, 0.3)";
    g.fillRect(x(start), 0, x(end) - x(start), height);
    g.fillStyle = "#6b7280";
    const perPixel = (span * buffer.sampleRate) / width;
    for (let px = 0; px < width; px++) {
      const from = Math.floor((view.from + (px / width) * span) * buffer.sampleRate);
      let peak = 0;
      for (let i = 0; i < perPixel; i += Math.max(1, Math.floor(perPixel / 40))) {
        peak = Math.max(peak, Math.abs(data[from + i] ?? 0));
      }
      const h = Math.max(1, peak * height * 0.95);
      g.fillRect(px, (height - h) / 2, 1, h);
    }
    g.fillStyle = "#111827";
    g.fillRect(x(start) - 1, 0, 2, height);
    g.fillRect(x(end) - 1, 0, 2, height);
  }, [buffer, start, end, view]);

  function timeAt(e: ReactPointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return view.from + ((e.clientX - rect.left) / rect.width) * (view.to - view.from);
  }

  return (
    <canvas
      ref={canvasRef}
      dir="ltr"
      data-testid="waveform"
      className="w-full h-24 border rounded touch-none cursor-ew-resize"
      onPointerDown={(e) => {
        const time = timeAt(e);
        dragging.current = Math.abs(time - start) <= Math.abs(time - end) ? "start" : "end";
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!dragging.current) return;
        const time = timeAt(e);
        if (dragging.current === "start") onChange(Math.max(0, Math.min(time, end - 0.05)), end);
        else onChange(start, Math.max(time, start + 0.05));
      }}
      onPointerUp={() => {
        if (dragging.current) onRelease(start, end);
        dragging.current = null;
      }}
    />
  );
}
