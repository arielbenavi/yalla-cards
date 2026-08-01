"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { strings } from "@/lib/strings";
import { PronunciationGuide } from "@/components/PronunciationGuide";
import {
  SESSION_SIZES,
  reinsertOffset,
  MAX_PRESENTATIONS,
  HARD_ATTEMPT_CAP,
  type SessionMinutes,
} from "@/lib/focused-practice";

type FocusedCard = {
  card_srs_id: string;
  card_id: string;
  direction: "he_to_ar" | "ar_to_he";
  hebrew_meaning: string;
  translit_nikud: string;
  arabic_script: string | null;
  item_type: string;
  notes: string | null;
  audio_url: string | null;
};

type QueueItem = { card: FocusedCard; attempt: number };

const OUTCOMES = [
  { rating: 1, label: "שוב", color: "bg-red-600" },
  { rating: 2, label: "קשה", color: "bg-orange-500" },
  { rating: 3, label: "טוב", color: "bg-green-600" },
  { rating: 4, label: "קל", color: "bg-blue-600" },
];

export default function FocusedPage() {
  const [minutes, setMinutes] = useState<SessionMinutes | null>(null);
  const [loading, setLoading] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [eligibleTotal, setEligibleTotal] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [firstTryCorrect, setFirstTryCorrect] = useState(0);
  const [repaired, setRepaired] = useState(0);
  const [needsRepair, setNeedsRepair] = useState<string[]>([]);
  const [uniqueDone, setUniqueDone] = useState<Set<string>>(new Set());
  const [done, setDone] = useState(false);
  const [latencies, setLatencies] = useState<number[]>([]);

  const shownAt = useRef<number>(Date.now());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const presentations = useRef<Map<string, number>>(new Map());

  const current = queue[0]?.card;

  useEffect(() => {
    shownAt.current = Date.now();
  }, [queue]);

  async function start(m: SessionMinutes) {
    setMinutes(m);
    setLoading(true);
    const d = await fetch(`/api/focused/queue?minutes=${m}`).then((r) => r.json());
    setQueue((d.cards ?? []).map((c: FocusedCard) => ({ card: c, attempt: 1 })));
    setEligibleTotal(d.eligible_total ?? 0);
    setLoading(false);
  }

  const grade = useCallback(
    async (outcome: number) => {
      const item = queue[0];
      if (!item) return;

      const latency = Date.now() - shownAt.current;
      const shownCount = (presentations.current.get(item.card.card_srs_id) ?? 0) + 1;
      presentations.current.set(item.card.card_srs_id, shownCount);

      // Fire and forget — this writes to focused_practice_log, never to FSRS
      fetch("/api/focused/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          card_srs_id: item.card.card_srs_id,
          outcome,
          attempt_index: item.attempt,
          latency_ms: latency,
          hint_used: false,
        }),
      }).catch(() => {});

      setAttempts((a) => a + 1);
      setLatencies((l) => [...l, latency]);
      if (outcome >= 3 && item.attempt === 1) setFirstTryCorrect((n) => n + 1);
      if (outcome >= 3 && item.attempt > 1) setRepaired((n) => n + 1);

      const rest = queue.slice(1);
      const offset = reinsertOffset(outcome, item.attempt);

      // Four presentations is the ceiling — past that, stop hammering it
      if (offset !== null && shownCount < MAX_PRESENTATIONS) {
        const next = { card: item.card, attempt: item.attempt + 1 };
        const at = Math.min(offset, rest.length);
        rest.splice(at, 0, next);
      } else {
        if (offset !== null) setNeedsRepair((n) => [...n, item.card.translit_nikud]);
        setUniqueDone((s) => new Set(s).add(item.card.card_srs_id));
      }

      setRevealed(false);
      setQueue(rest);
      if (rest.length === 0 || attempts + 1 >= HARD_ATTEMPT_CAP) setDone(true);
    },
    [queue, sessionId, attempts]
  );

  function playAudio() {
    if (!current?.audio_url || !audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play();
  }

  // ---- picker ----
  if (minutes === null) {
    return (
      <div className="flex flex-col gap-6 p-4 max-w-md mx-auto">
        <div>
          <h1 className="text-2xl font-bold">אימון ממוקד</h1>
          <p className="text-sm text-gray-500 mt-1 leading-relaxed">
            תרגול על מילים שסימנת בהן &quot;שוב&quot; או &quot;קשה&quot;, עם העדפה לשיעורים האחרונים.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {(Object.keys(SESSION_SIZES) as unknown as SessionMinutes[]).map((m) => (
            <button
              key={m}
              onClick={() => start(Number(m) as SessionMinutes)}
              className="flex items-center justify-between border rounded-2xl p-5 hover:bg-gray-50 transition-colors"
            >
              <span className="text-lg font-bold">{SESSION_SIZES[m].label}</span>
              <span className="text-sm text-gray-400">~{SESSION_SIZES[m].items} פריטים</span>
            </button>
          ))}
        </div>

        <p className="text-xs text-gray-400 text-center leading-relaxed border-t pt-4">
          תרגול בלבד — אינו משנה את מועדי החזרה של FSRS
        </p>
      </div>
    );
  }

  if (loading) {
    return <div className="flex flex-1 items-center justify-center text-gray-500">{strings.common.loading}</div>;
  }

  // ---- summary ----
  if (done || queue.length === 0) {
    const median =
      latencies.length === 0
        ? 0
        : [...latencies].sort((a, b) => a - b)[Math.floor(latencies.length / 2)];
    return (
      <div className="flex flex-col gap-5 p-4 max-w-md mx-auto">
        <h1 className="text-2xl font-bold">סיימת</h1>
        <dl className="flex flex-col gap-2 text-sm">
          {[
            ["פריטים ייחודיים", uniqueDone.size],
            ["ניסיונות אחזור", attempts],
            ["הצלחות בניסיון ראשון", firstTryCorrect],
            ["תוקנו אחרי כישלון", repaired],
            ["זמן תגובה חציוני", `${(median / 1000).toFixed(1)} שנ׳`],
          ].map(([k, v]) => (
            <div key={String(k)} className="flex justify-between border-b pb-1">
              <dt className="text-gray-500">{k}</dt>
              <dd className="font-bold">{v}</dd>
            </div>
          ))}
        </dl>

        {needsRepair.length > 0 && (
          <div className="rounded-xl border p-3">
            <p className="text-xs text-gray-500 mb-2">נשארו קשות — שווה להסתכל עליהן שוב:</p>
            <p className="nikud-text text-sm leading-relaxed">{needsRepair.join(" · ")}</p>
          </div>
        )}

        <button
          onClick={() => {
            setMinutes(null);
            setDone(false);
            setQueue([]);
            setAttempts(0);
            setFirstTryCorrect(0);
            setRepaired(0);
            setNeedsRepair([]);
            setUniqueDone(new Set());
            setLatencies([]);
            presentations.current.clear();
          }}
          className="rounded-xl bg-black py-4 text-base font-bold text-white"
        >
          ישיבה נוספת
        </button>
      </div>
    );
  }

  // ---- drill ----
  const showArabicPrompt = current.direction === "ar_to_he";
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 max-w-md mx-auto">
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>
          נותרו {queue.length} · מתוך {eligibleTotal} מועמדים
        </span>
        <PronunciationGuide />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <p className="text-3xl font-bold nikud-text">
          {showArabicPrompt ? current.translit_nikud : current.hebrew_meaning}
        </p>

        {revealed && (
          <div className="flex flex-col items-center gap-3">
            <p className="text-2xl nikud-text">
              {showArabicPrompt ? current.hebrew_meaning : current.translit_nikud}
            </p>
            {current.notes && <p className="text-sm text-gray-500">{current.notes}</p>}
            {current.audio_url && (
              <button
                onClick={playAudio}
                aria-label="השמע"
                className="flex h-14 w-14 items-center justify-center rounded-full bg-black text-white"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            )}
          </div>
        )}

        {current.audio_url && <audio ref={audioRef} src={current.audio_url} className="hidden" />}
      </div>

      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          className="rounded-xl bg-black py-5 text-lg font-bold text-white"
        >
          {strings.review.showAnswer}
        </button>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {OUTCOMES.map((o) => (
            <button
              key={o.rating}
              onClick={() => grade(o.rating)}
              className={`rounded-xl ${o.color} py-5 text-lg font-bold text-white`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}

      <p className="text-center text-[11px] text-gray-400">תרגול בלבד — לא משנה מועדי FSRS</p>
    </div>
  );
}
