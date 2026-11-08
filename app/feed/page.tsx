"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { strings } from "@/lib/strings";
import { buildWordIndex, lookupWord, type SentenceWord, type WordIndex } from "@/lib/word-lookup";
import type { FeedWord } from "@/lib/feed-annotate";
import { WordSheet } from "@/mobile/src/WordTap";
import { AddWordSheet, PhraseSheet } from "../watch/sheets";
import "@/mobile/src/review.css";

type Post = {
  id: string; post_id: string; author: string; author_name: string | null; url: string | null;
  posted_at: string | null; ar: string; translit: string | null; he: string | null; words: FeedWord[]; hidden: boolean;
};
type Layer = "ar" | "translit" | "he";
type Span = { from: number; to: number };
type AddState = "adding" | "added" | "existing" | "failed";

const LAYERS: { key: Layer; label: string }[] = [
  { key: "ar", label: "ערבית" },
  { key: "translit", label: "תעתיק" },
  { key: "he", label: "עברית" },
];

/**
 * Social posts in spoken Palestinian Arabic (X first). Arabic only by default; each post can show its
 * transliteration or Hebrew. Tapping a word shows its meaning and card, more words make a phrase, and
 * either can become an unverified card, the same as on /watch. Reads the deck, never writes FSRS.
 */
export default function FeedPage() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [layers, setLayers] = useState<Record<Layer, boolean>>({ ar: true, translit: false, he: false });
  const [shown, setShown] = useState<Record<string, Partial<Record<Layer, boolean>>>>({});
  const [tapped, setTapped] = useState<{ post: Post; at: number } | null>(null);
  const [span, setSpan] = useState<Span | null>(null);
  const [baseFor, setBaseFor] = useState<{ post: Post; at: number } | null>(null);
  const [saved, setSaved] = useState<Set<string>>(() => new Set());
  const [added, setAdded] = useState<Record<string, AddState>>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [wordIndex, setWordIndex] = useState<WordIndex>(() => buildWordIndex([]));
  const storeRef = useRef<typeof import("@/mobile/src/store") | null>(null);

  useEffect(() => {
    fetch("/api/feed")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setPosts(d.posts))
      .catch(() => setFailed(true));
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setIsAdmin(Boolean(d.isAdmin)))
      .catch(() => {});
    import("@/mobile/src/store").then(async (store) => {
      storeRef.current = store;
      await store.load();
      if (!store.snapshot().hasDeck) await store.sync();
      setWordIndex(buildWordIndex(store.snapshot().cards));
    });
  }, []);

  const on = (p: Post, l: Layer) => shown[p.id]?.[l] ?? layers[l];
  const toggle = (p: Post, l: Layer) => setShown((s) => ({ ...s, [p.id]: { ...s[p.id], [l]: !on(p, l) } }));
  const word = (w: FeedWord): SentenceWord => ({ text: w.t, arabic: w.ar });

  const tap = (post: Post, at: number) => {
    setTapped({ post, at });
    setSpan({ from: at, to: at });
  };
  const close = () => {
    setTapped(null);
    setSpan(null);
  };
  const grow = (s: Span, dir: -1 | 1, post: Post) =>
    dir < 0 ? { from: Math.max(0, s.from - 1), to: s.to } : { from: s.from, to: Math.min(post.words.length - 1, s.to + 1) };

  // A word or phrase becomes an unverified card at once (admin only), in the same lesson as words from videos
  const addCard = async (text: string, arabic: string | null, meaning: string, post: Post, seen?: string): Promise<AddState> => {
    setAdded((a) => ({ ...a, [text]: "adding" }));
    const res = await fetch("/api/watch/add-card", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word: text, arabic, meaning, sentence: post.translit, source: `X @${post.author}`, seen }),
    }).catch(() => null);
    const body = res?.ok ? await res.json() : null;
    const state: AddState = !body ? "failed" : body.existing ? "existing" : "added";
    setAdded((a) => ({ ...a, [text]: state }));
    if (body && !body.existing) setSaved((x) => new Set(x).add(text));
    void storeRef.current?.sync().then(() => storeRef.current && setWordIndex(buildWordIndex(storeRef.current.snapshot().cards)));
    return state;
  };

  if (failed) return <div className="flex flex-1 items-center justify-center">הפיד לא נטען</div>;
  if (!posts) return <div className="flex flex-1 items-center justify-center">{strings.common.loading}</div>;

  const phrase = tapped && span && span.to > span.from ? tapped.post.words.slice(span.from, span.to + 1) : null;

  return (
    <div className="yc embedded">
      <div className="watch feed">
        <header className="watch-head">
          <Link href="/content" className="link">חזרה</Link>
          <h1>פיד</h1>
          <span className="watch-count" data-testid="saved-count">מילים שנשמרו: <bdi>{saved.size}</bdi></span>
        </header>
        <div className="watch-toggles">
          {LAYERS.map((l) => (
            <button
              key={l.key}
              className={`chip ${layers[l.key] ? "on" : ""}`}
              onClick={() => {
                setLayers((x) => ({ ...x, [l.key]: !x[l.key] }));
                setShown({});
              }}
            >
              {l.label}
            </button>
          ))}
        </div>
        <p className="muted small">תעתיק ותרגום אוטומטיים (משוער). לחיצה על מילה: פירוש וכרטיס.</p>

        <ol className="feed-posts">
          {posts.map((p) => (
            <li key={p.id} className="feed-post" data-testid="feed-post">
              <div className="feed-meta">
                <span className="feed-author">{p.author_name ?? p.author}</span>
                <bdi className="muted small" dir="ltr">@{p.author}</bdi>
                {p.posted_at && <span className="muted small">{new Date(p.posted_at).toLocaleDateString("he-IL")}</span>}
              </div>
              {on(p, "ar") && (
                <p className="ar watch-ar" dir="rtl">
                  {p.words.length
                    ? p.words.map((w, i) => (
                        <span key={i}>
                          {i > 0 && " "}
                          <button type="button" className={`word-tap ${inSpan(tapped, span, p, i) ? "sel" : ""}`} onClick={() => tap(p, i)}>{w.ar}</button>
                        </span>
                      ))
                    : p.ar}
                </p>
              )}
              {on(p, "translit") && (
                <p className="nikud watch-translit" dir="rtl">
                  {p.words.map((w, i) => (
                    <span key={i}>
                      {i > 0 && " "}
                      <button type="button" className={`word-tap ${inSpan(tapped, span, p, i) ? "sel" : ""}`} onClick={() => tap(p, i)}>{w.t}</button>
                    </span>
                  ))}
                </p>
              )}
              {on(p, "he") && p.he && <p className="watch-he">{p.he}</p>}
              <div className="feed-tools">
                <button className={`chip ${on(p, "translit") ? "on" : ""}`} onClick={() => toggle(p, "translit")}>תעתיק</button>
                <button className={`chip ${on(p, "he") ? "on" : ""}`} onClick={() => toggle(p, "he")}>עברית</button>
                {!layers.ar && <button className={`chip ${on(p, "ar") ? "on" : ""}`} onClick={() => toggle(p, "ar")}>ערבית</button>}
                {p.url && <a className="link small" href={p.url} target="_blank" rel="noreferrer">ב־X</a>}
              </div>
            </li>
          ))}
        </ol>
      </div>

      {tapped && phrase && (
        <PhraseSheet
          words={phrase.map(word)}
          guess={span!.from === 0 && span!.to === tapped.post.words.length - 1 && tapped.post.he ? tapped.post.he : phrase.map((w) => w.he || "…").join(" ")}
          added={added}
          onExtend={(dir) => setSpan(grow(span!, dir, tapped.post))}
          onAdd={(text, arabic, meaning) => void addCard(text, arabic, meaning, tapped.post)}
          onClose={close}
        />
      )}
      {tapped && !phrase && (
        <WordSheet
          word={word(tapped.post.words[tapped.at])}
          gloss={tapped.post.words[tapped.at].he}
          match={lookupWord(word(tapped.post.words[tapped.at]), wordIndex, "")}
          requested={saved.has(tapped.post.words[tapped.at].t)}
          onRequest={() => {
            const w = tapped.post.words[tapped.at];
            setSaved((x) => new Set(x).add(w.t));
            void storeRef.current?.requestWord({ word: w.t, arabic: w.ar, card_id: `feed:${tapped.post.post_id}`, sentence: tapped.post.translit ?? "", meaning: tapped.post.he ?? "" });
          }}
          onClose={close}
          added={added[tapped.post.words[tapped.at].t] ?? "no"}
          onAdd={isAdmin ? () => setBaseFor({ post: tapped.post, at: tapped.at }) : undefined}
          onExtend={span ? (dir) => setSpan(grow(span, dir, tapped.post)) : undefined}
        />
      )}
      {baseFor && (
        <AddWordSheet
          word={word(baseFor.post.words[baseFor.at])}
          sentence={baseFor.post.translit}
          gloss={baseFor.post.words[baseFor.at].he}
          audio={false}
          onAdd={(text, arabic, meaning, seen) => addCard(text, arabic, meaning, baseFor.post, seen)}
          onClose={() => setBaseFor(null)}
        />
      )}
    </div>
  );
}

function inSpan(tapped: { post: Post } | null, span: Span | null, p: Post, i: number) {
  return !!tapped && tapped.post.id === p.id && !!span && span.to > span.from && i >= span.from && i <= span.to;
}
