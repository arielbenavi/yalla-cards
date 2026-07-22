"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type NumberEntry,
  type PoolLevel,
  getPool,
} from "@/lib/numbers-data";

type Mode = "digits" | "arabic";
type Result = "correct" | "wrong" | null;

const LEVELS: { id: PoolLevel; label: string }[] = [
  { id: "base",       label: "0–10 + עשרות" },
  { id: "teens",      label: "11–19" },
  { id: "composites", label: "מורכב (21–99)" },
  { id: "all",        label: "הכל" },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function median(times: number[]): number {
  const sorted = [...times].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function pickWrongEntries(pool: NumberEntry[], correct: NumberEntry, count: number): NumberEntry[] {
  return shuffle(pool.filter((n) => n.value !== correct.value)).slice(0, count);
}

export default function NumbersPage() {
  const [mode, setMode] = useState<Mode>("digits");
  const [level, setLevel] = useState<PoolLevel>("base");
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [responseTimes, setResponseTimes] = useState<number[]>([]);

  const [current, setCurrent] = useState<NumberEntry | null>(null);
  const [options, setOptions] = useState<NumberEntry[]>([]);
  const [result, setResult] = useState<Result>(null);
  const [chosenValue, setChosenValue] = useState<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const pool = useMemo(() => getPool(level), [level]);

  const nextQuestion = useCallback(() => {
    const picked = pool[Math.floor(Math.random() * pool.length)];
    const wrong = pickWrongEntries(pool, picked, 3);
    setCurrent(picked);
    setOptions(shuffle([picked, ...wrong]));
    setResult(null);
    setChosenValue(null);
    startTimeRef.current = Date.now();
  }, [pool]);

  useEffect(() => { nextQuestion(); }, [nextQuestion]);

  function handleAnswer(value: number) {
    if (result !== null || !current) return;
    const elapsed = Date.now() - startTimeRef.current;
    const isCorrect = value === current.value;
    setChosenValue(value);
    setResult(isCorrect ? "correct" : "wrong");
    setCorrect((c) => c + (isCorrect ? 1 : 0));
    setTotal((t) => t + 1);
    setResponseTimes((prev) => [...prev.slice(-49), elapsed]);
  }

  function resetScore() {
    setCorrect(0);
    setTotal(0);
    setResponseTimes([]);
    nextQuestion();
  }

  const percentage = total > 0 ? Math.round((correct / total) * 100) : null;
  const medianMs = responseTimes.length >= 3 ? median(responseTimes) : null;

  return (
    <div className="flex flex-col min-h-[calc(100vh-56px)] p-4 gap-4 max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">מספרים</h1>
        {total > 0 && (
          <button onClick={resetScore} className="text-xs text-gray-400 border border-gray-300 rounded px-2 py-1">
            אפס
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <span>
          <span className="font-bold text-green-600">{correct}</span>
          {" / "}
          <span className="font-bold">{total}</span>
          {percentage !== null && <span className="text-gray-400"> ({percentage}%)</span>}
        </span>
        {medianMs !== null && (
          <span className="text-gray-400 tabular-nums">
            ⏱ חציון{" "}
            <span className="font-semibold text-gray-700">{(medianMs / 1000).toFixed(1)}ש׳</span>
          </span>
        )}
      </div>

      {/* Mode */}
      <div className="flex rounded-xl overflow-hidden border border-gray-300 self-start">
        {(["digits", "arabic"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-2 text-sm font-bold transition-colors ${mode === m ? "bg-black text-white" : "bg-white text-gray-600"}`}
          >
            {m === "digits" ? "ספרה → ערבית" : "ערבית → ספרה"}
          </button>
        ))}
      </div>

      {/* Level */}
      <div className="flex gap-2 flex-wrap text-xs">
        {LEVELS.map((l) => (
          <button
            key={l.id}
            onClick={() => setLevel(l.id)}
            className={`rounded-full px-3 py-1 border transition-colors ${level === l.id ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-500"}`}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* Card */}
      <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
        {current && (
          <>
            <div className="flex flex-col items-center gap-1">
              {mode === "digits" ? (
                <p className="text-6xl font-bold tabular-nums">{current.value}</p>
              ) : (
                <>
                  <p className="text-4xl font-bold" dir="rtl" lang="ar" style={{ fontFamily: "serif" }}>
                    {current.arabic}
                  </p>
                  <p className="text-sm text-gray-400 nikud-text">{current.translit}</p>
                </>
              )}
            </div>

            {result && (
              <div className={`rounded-2xl px-6 py-4 ${result === "correct" ? "bg-green-50" : "bg-red-50"}`}>
                <p className="text-lg font-bold">{result === "correct" ? "✓ נכון!" : "✗ לא נכון"}</p>
                {result === "wrong" && (
                  <div className="mt-1">
                    <p className="text-2xl font-bold" dir="rtl" lang="ar" style={{ fontFamily: "serif" }}>{current.arabic}</p>
                    <p className="text-sm text-gray-500 nikud-text">{current.translit}</p>
                    {mode === "arabic" && <p className="text-3xl font-bold mt-1 tabular-nums">{current.value}</p>}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
              {options.map((opt) => {
                const isChosen = chosenValue === opt.value;
                const isCorrectOpt = opt.value === current.value;
                let cls = "rounded-xl py-5 px-3 text-base font-bold transition-colors border-2 ";
                if (result === null) cls += "bg-white border-gray-200 text-gray-900 active:bg-gray-100";
                else if (isCorrectOpt) cls += "bg-green-600 text-white border-green-600";
                else if (isChosen) cls += "bg-red-600 text-white border-red-600";
                else cls += "bg-gray-100 border-gray-100 text-gray-400";
                return (
                  <button key={opt.value} onClick={() => handleAnswer(opt.value)} disabled={result !== null} className={cls}>
                    {mode === "digits"
                      ? <span dir="rtl" lang="ar" style={{ fontFamily: "serif" }}>{opt.arabic}</span>
                      : <span className="tabular-nums">{opt.value}</span>}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {result !== null && (
        <button onClick={nextQuestion} className="rounded-xl bg-black py-5 text-lg font-bold text-white">
          הבא ←
        </button>
      )}
    </div>
  );
}
