"use client";

import { useEffect, useState } from "react";
import type { SentenceWord } from "@/lib/word-lookup";

// The sheets that turn a tapped word or phrase into an unverified card, shared by /watch and /feed.

/** Before a tapped word becomes a card: its base form (no ל/ה/ו/ב, no suffixes) and all its forms,
 *  suggested by /api/watch/base-form and checked against Madrasa, every field editable. */
export function AddWordSheet({
  word,
  sentence,
  gloss,
  audio = true,
  onAdd,
  onClose,
}: {
  word: SentenceWord;
  /** The line the word came from, to find its base form */
  sentence: string | null;
  gloss: string;
  /** Offer the line's audio (the video player); off where there is none */
  audio?: boolean;
  onAdd: (text: string, arabic: string | null, meaning: string, seen: string, withAudio: boolean) => Promise<string>;
  onClose: () => void;
}) {
  const [translit, setTranslit] = useState(word.text);
  const [arabic, setArabic] = useState(word.arabic ?? "");
  const [meaning, setMeaning] = useState(gloss);
  const [seen, setSeen] = useState("");
  const [withAudio, setWithAudio] = useState(audio);
  const [madrasa, setMadrasa] = useState<{ agrees: boolean | null; entries: { he: string; ar: string; tr: string }[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState("no");
  useEffect(() => {
    fetch("/api/watch/base-form", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word: word.text, arabic: word.arabic, sentence, gloss }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => {
        if (s) {
          setTranslit(s.translit);
          setArabic(s.arabic);
          setMeaning(s.meaning);
          setSeen(s.seen);
          setMadrasa(s.madrasa);
        }
      })
      .finally(() => setLoading(false));
  }, [word, sentence, gloss]);
  return (
    <div className="sheet word-sheet" role="dialog" aria-label={word.text} data-testid="add-word-sheet">
      <button className="sheet-backdrop" aria-label="סגור" onClick={onClose} />
      <div className="sheet-body">
        <p className="muted small">{loading ? "מחפש צורת בסיס…" : seen || "צורת בסיס"}</p>
        <label className="muted small">
          תעתיק (כל הצורות)
          <input dir="rtl" className="nikud" value={translit} onChange={(e) => setTranslit(e.target.value)} data-testid="base-translit" />
        </label>
        <label className="muted small">
          ערבית
          <input dir="rtl" value={arabic} onChange={(e) => setArabic(e.target.value)} />
        </label>
        <label className="muted small">
          פירוש
          <input dir="rtl" value={meaning} onChange={(e) => setMeaning(e.target.value)} />
        </label>
        {madrasa && (
          <p className="muted small">
            {madrasa.agrees === null ? "מדרסה: אין ערך" : madrasa.agrees ? "✓ תואם מדרסה" : "✗ מדרסה אומרת אחרת:"}
            {madrasa.agrees === false && madrasa.entries.map((e) => ` ${e.he}: ${e.ar} ${e.tr}`).join(" ·")}
          </p>
        )}
        {audio && <label className="muted small">
          <input type="checkbox" checked={withAudio} onChange={(e) => setWithAudio(e.target.checked)} /> עם הקול של השורה מהסרטון
        </label>}
        <button
          className="btn primary"
          disabled={loading || !translit.trim() || !meaning.trim() || (state !== "no" && state !== "failed")}
          onClick={async () => {
            setState("adding");
            const s = await onAdd(translit.trim(), arabic.trim() || null, meaning.trim(), seen, withAudio);
            setState(s);
          }}
          data-testid="add-base-word"
        >
          {state === "added" ? "נוסף ככרטיס ✓ (לא מאומת)" : state === "existing" ? "כבר יש כרטיס כזה" : state === "adding" ? "מוסיף…" : state === "failed" ? "נכשל, לנסות שוב" : "הוסף ככרטיס"}
        </button>
      </div>
    </div>
  );
}

/** Several words of a line selected together, added as one phrase card with a meaning the admin can fix. */
export function PhraseSheet({
  words,
  guess,
  added,
  onExtend,
  onAdd,
  onClose,
}: {
  words: SentenceWord[];
  /** The meaning to start from: the line's translation, or the words' meanings in order */
  guess: string;
  added: Record<string, "adding" | "added" | "existing" | "failed">;
  onExtend: (dir: -1 | 1) => void;
  onAdd: (text: string, arabic: string | null, meaning: string) => void;
  onClose: () => void;
}) {
  const text = words.map((w) => w.text).join(" ");
  const arabic = words.every((w) => w.arabic) ? words.map((w) => w.arabic).join(" ") : null;
  const [meaning, setMeaning] = useState(guess);
  useEffect(() => setMeaning(guess), [guess]);
  const state = (added[text] as (typeof added)[string] | undefined) ?? "no";
  return (
    <div className="sheet word-sheet" role="dialog" aria-label={text} data-testid="phrase-sheet">
      <button className="sheet-backdrop" aria-label="סגור" onClick={onClose} />
      <div className="sheet-body">
        <p className="word-title nikud">{text}</p>
        {arabic && <p className="ar muted" dir="rtl">{arabic}</p>}
        <label className="muted small">
          פירוש (אפשר לתקן)
          <textarea dir="rtl" value={meaning} onChange={(e) => setMeaning(e.target.value)} data-testid="phrase-meaning" />
        </label>
        <div className="row">
          <button className="btn side" onClick={() => onExtend(-1)}>+ המילה הקודמת</button>
          <button className="btn side" onClick={() => onExtend(1)}>+ המילה הבאה</button>
        </div>
        <button
          className="btn primary"
          disabled={!meaning.trim() || (state !== "no" && state !== "failed")}
          onClick={() => onAdd(text, arabic, meaning.trim())}
          data-testid="add-phrase"
        >
          {state === "added" ? "נוסף ככרטיס ✓ (לא מאומת)" : state === "existing" ? "כבר יש כרטיס כזה" : state === "adding" ? "מוסיף…" : state === "failed" ? "נכשל, לנסות שוב" : "הוסף ביטוי ככרטיס"}
        </button>
      </div>
    </div>
  );
}

