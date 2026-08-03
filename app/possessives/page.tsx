"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { strings } from "@/lib/strings";
import { gradeProduction } from "@/lib/possessives";

type Option = { feature: string; sentence: string; arabic: string };
type Item = {
  base_translit: string;
  base_he: string;
  target_feature: string;
  contrast_with: string;
  prompt_he: string;
  options: Option[];
};

type Pattern = {
  pattern_class: string;
  note: string;
  base_translit: string;
  base_he: string;
  form_translit: string;
  form_arabic: string;
  form_he: string;
};

type ProduceItem = {
  base_translit: string;
  base_he: string;
  target_feature: string;
  feature_label: string;
  prompt_he: string;
  tail_translit: string;
  expected_translit: string;
  expected_arabic: string;
};

type Stage = 1 | 2 | 3;

export default function PossessivesPage() {
  const [stage, setStage] = useState<Stage>(1);
  const [items, setItems] = useState<Item[]>([]);
  const [contrast, setContrast] = useState<{ label: string } | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [answered, setAnswered] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);

  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [produce, setProduce] = useState<ProduceItem[]>([]);
  const [produceReason, setProduceReason] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [revealed, setRevealed] = useState<boolean | null>(null);

  const [sessionId] = useState(() => crypto.randomUUID());
  const shownAt = useRef(Date.now());

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/possessives/queue?size=10").then((r) => r.json()),
      fetch("/api/possessives/patterns").then((r) => r.json()),
      fetch("/api/possessives/produce?size=8").then((r) => r.json()),
    ])
      .then(([q, p, pr]) => {
        setItems(q.items ?? []);
        setContrast(q.contrast);
        setReason(q.reason ?? null);
        setPatterns(p.patterns ?? []);
        setProduce(pr.items ?? []);
        setProduceReason(pr.reason ?? null);
        setIndex(0);
        setAnswered(null);
        setTyped("");
        setRevealed(null);
        setCorrectCount(0);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => load(), [load]);
  useEffect(() => {
    shownAt.current = Date.now();
  }, [index, stage]);

  function log(body: Record<string, unknown>) {
    fetch("/api/possessives/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, ...body }),
    }).catch(() => {});
  }

  function answer(feature: string) {
    const item = items[index];
    if (!item || answered) return;
    const correct = feature === item.target_feature;
    setAnswered(feature);
    if (correct) setCorrectCount((n) => n + 1);
    log({
      stage: 1,
      base_translit: item.base_translit,
      target_feature: item.target_feature,
      chosen_feature: correct ? null : feature,
      contrast_with: item.contrast_with,
      correct,
      latency_ms: Date.now() - shownAt.current,
    });
  }

  function submitTyped() {
    const item = produce[index];
    if (!item || revealed !== null) return;
    const correct = gradeProduction(typed, item.expected_translit);
    setRevealed(correct);
    if (correct) setCorrectCount((n) => n + 1);
    log({
      stage: 3,
      base_translit: item.base_translit,
      target_feature: item.target_feature,
      correct,
      latency_ms: Date.now() - shownAt.current,
    });
  }

  function markPatternSeen(cls: string) {
    setPatterns((p) => p.filter((x) => x.pattern_class !== cls));
    fetch("/api/possessives/patterns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pattern_class: cls }),
    }).catch(() => {});
  }

  function next() {
    setAnswered(null);
    setTyped("");
    setRevealed(null);
    setIndex((i) => i + 1);
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-gray-500">
        {strings.common.loading}
      </div>
    );
  }

  const tabs: { id: Stage; label: string; badge?: number }[] = [
    { id: 1, label: "זיהוי" },
    { id: 2, label: "הרכבה", badge: patterns.length || undefined },
    { id: 3, label: "הפקה", badge: produce.length || undefined },
  ];

  const header = (
    <div className="flex gap-2">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => {
            setStage(t.id);
            setIndex(0);
            setAnswered(null);
            setTyped("");
            setRevealed(null);
            setCorrectCount(0);
          }}
          className={`flex-1 rounded-xl border py-2 text-sm font-bold transition-colors ${
            stage === t.id ? "border-black bg-black text-white" : "text-gray-500"
          }`}
        >
          {t.label}
          {t.badge ? ` (${t.badge})` : ""}
        </button>
      ))}
    </div>
  );

  const footer = (
    <p className="text-center text-[11px] text-gray-400">תרגול בלבד — לא משנה מועדי FSRS</p>
  );

  // ---- Stage 2: assembly. Discovery, not assessment: nothing here is scored.
  if (stage === 2) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 max-w-md mx-auto">
        {header}
        {patterns.length === 0 ? (
          <p className="text-sm text-gray-500 leading-relaxed">
            ראית כבר את כל דפוסי ההרכבה. זה שלב גילוי חד-פעמי — הוא לא חוזר ולא נמדד.
          </p>
        ) : (
          patterns.map((p) => (
            <div key={p.pattern_class} className="rounded-2xl border p-4 flex flex-col gap-3">
              <p className="text-xs text-gray-400">{p.note}</p>
              <div className="flex items-center justify-center gap-2 text-xl nikud-text">
                <span className="rounded-lg bg-gray-100 px-3 py-2">{p.base_translit}</span>
                <span className="text-gray-400">+</span>
                <span className="rounded-lg bg-gray-100 px-3 py-2">שלו</span>
                <span className="text-gray-400">=</span>
                <span className="rounded-lg bg-green-50 border border-green-600 px-3 py-2">
                  {p.form_translit}
                </span>
              </div>
              <p className="text-center text-lg text-gray-400" style={{ fontFamily: "serif" }} dir="rtl">
                {p.form_arabic}
              </p>
              <p className="text-center text-sm text-gray-500">
                {p.base_he} → {p.form_he}
              </p>
              <button
                onClick={() => markPatternSeen(p.pattern_class)}
                className="rounded-xl bg-black py-3 text-sm font-bold text-white"
              >
                הבנתי
              </button>
            </div>
          ))
        )}
        {footer}
      </div>
    );
  }

  // ---- Stage 3: typed production, gated on stage 1 being solid.
  if (stage === 3) {
    if (produceReason || produce.length === 0) {
      return (
        <div className="flex flex-1 flex-col gap-6 p-4 max-w-md mx-auto">
          {header}
          <p className="text-sm text-gray-500 leading-relaxed">
            {produceReason ?? "אין כרגע תרגילי הפקה."}
          </p>
          {footer}
        </div>
      );
    }

    const item = produce[index];
    if (!item) {
      return (
        <div className="flex flex-1 flex-col gap-5 p-4 max-w-md mx-auto">
          {header}
          <h1 className="text-2xl font-bold">סיימת</h1>
          <p className="text-sm text-gray-500">
            {correctCount} מתוך {produce.length} נכונות
          </p>
          <button onClick={load} className="rounded-xl bg-black py-4 text-base font-bold text-white">
            סבב נוסף
          </button>
          {footer}
        </div>
      );
    }

    return (
      <div className="flex flex-1 flex-col gap-6 p-4 max-w-md mx-auto">
        {header}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>
            {index + 1} / {produce.length}
          </span>
          <span>{item.feature_label}</span>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-400 mb-2">איך אומרים</p>
          <p className="text-2xl font-bold">{item.prompt_he}</p>
          <p className="mt-3 text-sm text-gray-500">
            הבסיס: <span className="nikud-text">{item.base_translit}</span> — {item.feature_label}
          </p>
        </div>

        {/* Saying it aloud first is the single largest memory gain available
            here, and it costs one line of text. */}
        <p className="text-center text-xs text-gray-400">קודם תגיד בקול, אחר כך תקליד</p>

        <div className="flex items-center justify-center gap-2 text-xl">
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitTyped()}
            disabled={revealed !== null}
            autoFocus
            dir="rtl"
            className="nikud-text w-44 rounded-xl border px-3 py-3 text-center text-xl"
            placeholder="___"
          />
          <span className="nikud-text text-gray-400">{item.tail_translit}</span>
        </div>

        {revealed === null ? (
          <button
            onClick={submitTyped}
            className="rounded-xl bg-black py-4 text-base font-bold text-white"
          >
            בדוק
          </button>
        ) : (
          <>
            <div
              className={`rounded-2xl border p-4 text-center ${
                revealed ? "border-green-600 bg-green-50" : "border-red-500 bg-red-50"
              }`}
            >
              <p className="text-xs text-gray-500 mb-1">{revealed ? "נכון" : "הצורה הנכונה"}</p>
              <p className="nikud-text text-2xl">{item.expected_translit}</p>
              <p className="text-lg mt-1 text-gray-400" style={{ fontFamily: "serif" }} dir="rtl">
                {item.expected_arabic}
              </p>
            </div>
            <button onClick={next} className="rounded-xl bg-black py-4 text-base font-bold text-white">
              הבא
            </button>
          </>
        )}
        {footer}
      </div>
    );
  }

  // ---- Stage 1: identification.
  if (reason || items.length === 0) {
    return (
      <div className="flex flex-col gap-4 p-4 max-w-md mx-auto">
        {header}
        <h1 className="text-2xl font-bold">סיומות שייכות</h1>
        <p className="text-sm text-gray-500 leading-relaxed">{reason ?? "אין כרגע תרגילים."}</p>
      </div>
    );
  }

  const item = items[index];
  if (!item) {
    return (
      <div className="flex flex-col gap-5 p-4 max-w-md mx-auto">
        {header}
        <h1 className="text-2xl font-bold">סיימת</h1>
        <p className="text-sm text-gray-500">
          {correctCount} מתוך {items.length} נכונות
        </p>
        <button onClick={load} className="rounded-xl bg-black py-4 text-base font-bold text-white">
          סבב נוסף
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 max-w-md mx-auto">
      {header}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>
          {index + 1} / {items.length}
        </span>
        {contrast && <span>{contrast.label}</span>}
      </div>

      <div className="text-center">
        <p className="text-xs text-gray-400 mb-2">איזה משפט אומר</p>
        <p className="text-2xl font-bold">{item.prompt_he}</p>
      </div>

      <div className="flex flex-col gap-3">
        {item.options.map((o) => {
          const picked = answered === o.feature;
          const isTarget = o.feature === item.target_feature;
          const showCorrect = answered && isTarget;
          return (
            <button
              key={o.feature}
              onClick={() => answer(o.feature)}
              disabled={!!answered}
              className={`rounded-2xl border p-4 text-center transition-colors ${
                showCorrect
                  ? "border-green-600 bg-green-50"
                  : picked
                  ? "border-red-500 bg-red-50"
                  : "hover:bg-gray-50"
              }`}
            >
              <p className="nikud-text text-xl">{o.sentence}</p>
              {answered && (
                <p className="text-lg mt-1 text-gray-400" style={{ fontFamily: "serif" }} dir="rtl">
                  {o.arabic}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {answered && (
        <button onClick={next} className="rounded-xl bg-black py-4 text-base font-bold text-white">
          הבא
        </button>
      )}

      {footer}
    </div>
  );
}
