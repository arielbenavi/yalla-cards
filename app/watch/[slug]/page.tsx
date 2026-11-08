"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { strings } from "@/lib/strings";
import { buildWordIndex, lookupWord, sentenceWords, translitKey, type SentenceWord, type WordIndex } from "@/lib/word-lookup";
import { TappableWords, WordSheet } from "@/mobile/src/WordTap";
import { AddWordSheet, PhraseSheet } from "../sheets";
import "@/mobile/src/review.css";
import { createClip } from "@/lib/clip";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Segment = { id: string; idx: number; start_sec: number; end_sec: number; ar: string | null; translit: string | null; he: string | null; verified: boolean };
type Data = { item: { title: string; series?: string | null; source_url: string | null; glosses: Record<string, string> }; segments: Segment[]; media_url: string | null };
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
  // The words selected in the tapped line, as indexes into its words: more than one makes a phrase
  const [span, setSpan] = useState<{ from: number; to: number } | null>(null);
  const [saved, setSaved] = useState<Set<string>>(() => new Set());
  const [added, setAdded] = useState<Record<string, "adding" | "added" | "existing" | "failed">>({});
  const [isAdmin, setIsAdmin] = useState(false);
  // A tapped word on its way to becoming a card: its base form and forms are suggested first
  const [baseFor, setBaseFor] = useState<{ word: SentenceWord; segment: Segment } | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [wordIndex, setWordIndex] = useState<WordIndex>(() => buildWordIndex([]));
  const storeRef = useRef<typeof import("@/mobile/src/store") | null>(null);
  const videoRef = useRef<HTMLMediaElement | null>(null);
  const wasPlaying = useRef(false);

  useEffect(() => {
    fetch(`/api/media/${slug}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setFailed(true));
  }, [slug]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setIsAdmin(Boolean(d.isAdmin)))
      .catch(() => {});
  }, []);

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
    const at = sentenceWords(segment.translit ?? "", segment.ar).findIndex((w) => w.text === word.text);
    setSpan(at >= 0 ? { from: at, to: at } : null);
  }, []);

  const closeSheet = () => {
    setTapped(null);
    setSpan(null);
    if (wasPlaying.current) void videoRef.current?.play();
  };

  const saveLine = async (s: Segment, fields: Partial<Segment>) => {
    const res = await fetch(`/api/media/segments/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...fields, verified: true }),
    });
    if (!res.ok) return false;
    const { segment } = (await res.json()) as { segment: Segment };
    setData((d) => d && { ...d, segments: d.segments.map((x) => (x.id === segment.id ? { ...x, ...segment } : x)) });
    setEditing(null);
    return true;
  };

  // A word or phrase becomes an unverified card at once (admin only)
  const addCard = async (
    text: string,
    arabic: string | null,
    meaning: string,
    segment: Segment,
    extra: { seen?: string; withAudio?: boolean } = { withAudio: true },
  ) => {
    setAdded((a) => ({ ...a, [text]: "adding" }));
    // The line's own audio, cut from the video, so the card comes with its pronunciation
    let clip_path: string | null = null;
    if (extra.withAudio && data?.media_url) {
      try {
        const blob = await createClip(data.media_url, Number(segment.start_sec), Number(segment.end_sec));
        const { path, token } = await fetch("/api/recordings/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ extension: "wav" }),
        }).then((r) => r.json());
        const { error } = await supabaseBrowser().storage.from("recordings").uploadToSignedUrl(path, token, blob);
        if (!error) clip_path = path;
      } catch {
        // no audio is better than no card
      }
    }
    const res = await fetch("/api/watch/add-card", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word: text, arabic, meaning, sentence: segment.translit, source: data?.item.title, seen: extra.seen, clip_path }),
    }).catch(() => null);
    const body = res?.ok ? await res.json() : null;
    const state = !body ? "failed" : body.existing ? "existing" : "added";
    setAdded((a) => ({ ...a, [text]: state }));
    if (body && !body.existing) setSaved((x) => new Set(x).add(text));
    void storeRef.current?.sync().then(() => storeRef.current && setWordIndex(buildWordIndex(storeRef.current.snapshot().cards)));
    return state;
  };

  const unchecked = data?.segments.filter((s) => !s.verified).length ?? 0;

  if (failed) return <div className="flex flex-1 items-center justify-center">הסרטון לא נמצא</div>;
  if (!data) return <div className="flex flex-1 items-center justify-center">{strings.common.loading}</div>;

  return (
    <div className="yc embedded">
      <div className="watch">
        <header className="watch-head">
          <Link href="/watch" className="link">חזרה</Link>
          <h1>{data.item.title}</h1>
          <span className="watch-count" data-testid="saved-count">מילים שנשמרו: <bdi>{saved.size}</bdi></span>
        </header>

        {data.media_url &&
          (/\.(mp4|mov|webm)(\?|$)/i.test(data.media_url) ? (
            <video
              ref={(el) => void (videoRef.current = el)}
              src={data.media_url}
              controls
              playsInline
              className="watch-video"
              onSeeking={(e) => setTime(e.currentTarget.currentTime)}
              onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
            />
          ) : (
            <audio
              ref={(el) => void (videoRef.current = el)}
              src={data.media_url}
              controls
              className="watch-audio"
              onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
            />
          ))}

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

        {unchecked > 0 && (
          <p className="muted small" data-testid="unchecked">
            כתוביות אוטומטיות: <bdi>{unchecked}</bdi> שורות עוד לא נבדקו, ויכולות להכיל טעויות
          </p>
        )}

        <div className="watch-subs" data-testid="active-line">
          {active ? <Line segment={active} layers={layers} onTap={onTap} /> : <p className="muted">…</p>}
        </div>

        <ol className="watch-lines">
          {data.segments.map((s) => (
            <li key={s.id ?? s.idx} className={`${s === active ? "current" : ""} ${s.verified ? "" : "unchecked"}`}>
              <button className="watch-line-play" aria-label="נגן את השורה" onClick={() => seek(s)}>▶</button>
              {editing === s.id ? (
                <LineEditor segment={s} onSave={(fields) => saveLine(s, fields)} onCancel={() => setEditing(null)} />
              ) : (
                <>
                  <Line segment={s} layers={layers} onTap={onTap} small />
                  {isAdmin && (
                    <span className="watch-line-tools">
                      {!s.verified && (
                        <button className="chip" aria-label="אשר שורה" onClick={() => saveLine(s, {})}>✓</button>
                      )}
                      <button className="chip" aria-label="ערוך שורה" onClick={() => setEditing(s.id)}>✎</button>
                    </span>
                  )}
                </>
              )}
            </li>
          ))}
        </ol>
      </div>

      {tapped && span && span.to > span.from && (
        <PhraseSheet
          words={sentenceWords(tapped.segment.translit ?? "", tapped.segment.ar).slice(span.from, span.to + 1)}
          guess={phraseGuess(tapped.segment, span, data.item.glosses)}
          added={added}
          onExtend={(dir) => setSpan(grow(span, dir, tapped.segment))}
          onAdd={(text, arabic, meaning) => void addCard(text, arabic, meaning, tapped.segment)}
          onClose={closeSheet}
        />
      )}
      {tapped && !(span && span.to > span.from) && (
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
          added={added[tapped.word.text] ?? "no"}
          onAdd={
            isAdmin
              ? () => setBaseFor({ word: tapped.word, segment: tapped.segment })
              : undefined
          }
          onExtend={isAdmin && span ? (dir) => setSpan(grow(span, dir, tapped.segment)) : undefined}
        />
      )}
      {baseFor && (
        <AddWordSheet
          word={baseFor.word}
          sentence={baseFor.segment.translit}
          gloss={data.item.glosses[translitKey(baseFor.word.text)] ?? ""}
          onAdd={(text, arabic, meaning, seen, withAudio) => addCard(text, arabic, meaning, baseFor.segment, { seen, withAudio })}
          onClose={() => setBaseFor(null)}
        />
      )}
    </div>
  );
}

/** The line's own translation when the whole line is chosen, else the words' meanings in order */
function phraseGuess(segment: Segment, span: { from: number; to: number }, glosses: Record<string, string>) {
  const words = sentenceWords(segment.translit ?? "", segment.ar);
  if (span.from === 0 && span.to === words.length - 1 && segment.he) return segment.he;
  return words.slice(span.from, span.to + 1).map((w) => glosses[translitKey(w.text)] ?? "…").join(" ");
}

function grow(span: { from: number; to: number }, dir: -1 | 1, segment: Segment) {
  const last = sentenceWords(segment.translit ?? "", segment.ar).length - 1;
  return dir < 0 ? { from: Math.max(0, span.from - 1), to: span.to } : { from: span.from, to: Math.min(last, span.to + 1) };
}

function LineEditor({
  segment,
  onSave,
  onCancel,
}: {
  segment: Segment;
  onSave: (fields: Partial<Segment>) => Promise<boolean>;
  onCancel: () => void;
}) {
  const [translit, setTranslit] = useState(segment.translit ?? "");
  const [ar, setAr] = useState(segment.ar ?? "");
  const [he, setHe] = useState(segment.he ?? "");
  const [start, setStart] = useState(String(segment.start_sec));
  const [end, setEnd] = useState(String(segment.end_sec));
  const [failed, setFailed] = useState(false);
  return (
    <div className="watch-editor">
      <label>תעתיק<textarea className="nikud" dir="rtl" value={translit} onChange={(e) => setTranslit(e.target.value)} /></label>
      <label>ערבית<textarea dir="rtl" value={ar} onChange={(e) => setAr(e.target.value)} /></label>
      <label>עברית<textarea dir="rtl" value={he} onChange={(e) => setHe(e.target.value)} /></label>
      <div className="row">
        <label>התחלה<input inputMode="decimal" dir="ltr" value={start} onChange={(e) => setStart(e.target.value)} /></label>
        <label>סוף<input inputMode="decimal" dir="ltr" value={end} onChange={(e) => setEnd(e.target.value)} /></label>
      </div>
      {failed && <p className="error">השמירה נכשלה</p>}
      <div className="row">
        <button
          className="btn primary"
          onClick={async () => {
            const ok = await onSave({ translit, ar, he, start_sec: Number(start), end_sec: Number(end) });
            setFailed(!ok);
          }}
        >
          שמור ואשר
        </button>
        <button className="btn" onClick={onCancel}>ביטול</button>
      </div>
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
