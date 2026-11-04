"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { strings } from "@/lib/strings";
import { buildWordIndex, lookupWord, sentenceWords, translitKey, type SentenceWord, type WordIndex } from "@/lib/word-lookup";
import { TappableWords, WordSheet } from "@/mobile/src/WordTap";
import "@/mobile/src/review.css";

type Segment = { idx: number; start_sec: number; end_sec: number; ar: string | null; translit: string | null; he: string | null; verified: boolean };
type Data = { item: { title: string; source_url: string | null; glosses: Record<string, string> }; segments: Segment[]; media_url: string | null };
type Layer = "translit" | "ar" | "he";

const LAYERS: { key: Layer; label: string }[] = [
  { key: "translit", label: "תעתיק" },
  { key: "ar", label: "ערבית" },
  { key: "he", label: "עברית" },
];
const SPEEDS = [1, 0.75, 0.5];

/**
 * A video with subtitles that follow it. Tapping a word pauses the video and opens
 * its meaning; "add" sends it to the translation list, the same as on a card.
 * Reads the deck, never writes FSRS.
 */
export default function WatchPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<Data | null>(null);
  const [failed, setFailed] = useState(false);
  const [layers, setLayers] = useState<Record<Layer, boolean>>({ translit: true, ar: true, he: false });
  const [time, setTime] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [tapped, setTapped] = useState<{ word: SentenceWord; segment: Segment } | null>(null);
  const [saved, setSaved] = useState<Set<string>>(() => new Set());
  const [wordIndex, setWordIndex] = useState<WordIndex>(() => buildWordIndex([]));
  const storeRef = useRef<typeof import("@/mobile/src/store") | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const wasPlaying = useRef(false);

  useEffect(() => {
    fetch(`/api/media/${slug}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setFailed(true));
  }, [slug]);

  // The deck on this device, the same one the review uses. Client only: it reads browser storage.
  useEffect(() => {
    import("@/mobile/src/store").then(async (store) => {
      storeRef.current = store;
      await store.load();
      if (!store.snapshot().hasDeck) await store.sync();
      setWordIndex(buildWordIndex(store.snapshot().cards));
    });
  }, []);

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = speed;
  }, [speed]);

  const active = useMemo(
    () => data?.segments.find((s) => time >= s.start_sec && time < s.end_sec) ?? null,
    [data, time]
  );

  const seek = (s: Segment) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = s.start_sec;
    setTime(s.start_sec);
    void v.play();
  };

  const onTap = useCallback((word: SentenceWord, segment: Segment) => {
    const v = videoRef.current;
    wasPlaying.current = !!v && !v.paused;
    v?.pause();
    setTapped({ word, segment });
  }, []);

  const closeSheet = () => {
    setTapped(null);
    if (wasPlaying.current) void videoRef.current?.play();
  };

  if (failed) return <div className="flex flex-1 items-center justify-center">הסרטון לא נמצא</div>;
  if (!data) return <div className="flex flex-1 items-center justify-center">{strings.common.loading}</div>;

  return (
    <div className="yc embedded">
      <div className="watch">
        <header className="watch-head">
          <Link href="/content" className="link">חזרה</Link>
          <h1>{data.item.title}</h1>
          <span className="watch-count" data-testid="saved-count">מילים שנשמרו: <bdi>{saved.size}</bdi></span>
        </header>

        {data.media_url && (
          <video
            ref={videoRef}
            src={data.media_url}
            controls
            playsInline
            className="watch-video"
            onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
          />
        )}

        <div className="watch-toggles">
          {LAYERS.map((l) => (
            <button key={l.key} className={`chip ${layers[l.key] ? "on" : ""}`} onClick={() => setLayers((x) => ({ ...x, [l.key]: !x[l.key] }))}>
              {l.label}
            </button>
          ))}
          <button className="chip" onClick={() => setSpeed((s) => SPEEDS[(SPEEDS.indexOf(s) + 1) % SPEEDS.length])}>
            מהירות <bdi>{speed}x</bdi>
          </button>
        </div>

        <div className="watch-subs" data-testid="active-line">
          {active ? <Line segment={active} layers={layers} onTap={onTap} /> : <p className="muted">…</p>}
        </div>

        <ol className="watch-lines">
          {data.segments.map((s) => (
            <li key={s.idx} className={s === active ? "current" : ""}>
              <button className="watch-line-play" aria-label="נגן את השורה" onClick={() => seek(s)}>▶</button>
              <Line segment={s} layers={layers} onTap={onTap} small />
            </li>
          ))}
        </ol>
      </div>

      {tapped && (
        <WordSheet
          word={tapped.word}
          gloss={data.item.glosses[translitKey(tapped.word.text)]}
          match={lookupWord(tapped.word, wordIndex, "")}
          requested={saved.has(tapped.word.text)}
          onRequest={() => {
            setSaved((x) => new Set(x).add(tapped.word.text));
            void storeRef.current?.requestWord({
              word: tapped.word.text,
              arabic: tapped.word.arabic,
              card_id: `watch:${slug}`,
              sentence: tapped.segment.translit ?? "",
              meaning: tapped.segment.he ?? "",
            });
          }}
          onClose={closeSheet}
        />
      )}
    </div>
  );
}

function Line({
  segment,
  layers,
  onTap,
  small = false,
}: {
  segment: Segment;
  layers: Record<Layer, boolean>;
  onTap: (word: SentenceWord, segment: Segment) => void;
  small?: boolean;
}) {
  const words = sentenceWords(segment.translit ?? "", segment.ar);
  const aligned = words.length > 0 && words.every((w) => w.arabic);
  return (
    <div className={small ? "watch-line small" : "watch-line"}>
      {layers.translit && segment.translit && (
        <p className="nikud watch-translit">
          <TappableWords text={segment.translit} arabic={segment.ar} onTap={(w) => onTap(w, segment)} />
        </p>
      )}
      {layers.ar && segment.ar && (
        <p className="ar watch-ar" dir="rtl">
          {aligned
            ? words.map((w, i) => (
                <span key={i}>
                  {i > 0 && " "}
                  <button type="button" className="word-tap" onClick={() => onTap(w, segment)}>{w.arabic}</button>
                </span>
              ))
            : segment.ar}
        </p>
      )}
      {layers.he && segment.he && <p className="watch-he">{segment.he}</p>}
    </div>
  );
}
