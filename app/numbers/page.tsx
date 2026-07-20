"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type NumberEntry,
  getPool,
} from "@/lib/numbers-data";

type Mode = "digits" | "arabic";
type Difficulty = "beginner" | "advanced";
type Result = "correct" | "wrong" | null;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickWrongEntries(
  pool: NumberEntry[],
  correct: NumberEntry,
  count: number
): NumberEntry[] {
  const others = pool.filter((n) => n.value !== correct.value);
  return shuffle(others).slice(0, count);
}

export default function NumbersPage() {
  const [mode, setMode] = useState<Mode>("digits");
  const [difficulty, setDifficulty] = useState<Difficulty>("beginner");
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);

  const [current, setCurrent] = useState<NumberEntry | null>(null);
  const [options, setOptions] = useState<NumberEntry[]>([]);
  const [result, setResult] = useState<Result>(null);
  const [chosenValue, setChosenValue] = useState<number | null>(null);

  const pool = useMemo(() => getPool(difficulty), [difficulty]);

  const nextQuestion = useCallback(() => {
    const picked = pool[Math.floor(Math.random() * pool.length)];
    const wrong = pickWrongEntries(pool, picked, 3);
    setCurrent(picked);
    setOptions(shuffle([picked, ...wrong]));
    setResult(null);
    setChosenValue(null);
  }, [pool]);

  // Start first question on mount and when pool changes
  useEffect(() => {
    nextQuestion();
  }, [nextQuestion]);

  function handleAnswer(value: number) {
    if (result !== null || !current) return;
    const isCorrect = value === current.value;
    setChosenValue(value);
    setResult(isCorrect ? "correct" : "wrong");
    setCorrect((c) => c + (isCorrect ? 1 : 0));
    setTotal((t) => t + 1);
  }

  function resetScore() {
    setCorrect(0);
    setTotal(0);
    nextQuestion();
  }

  const percentage = total > 0 ? Math.round((correct / total) * 100) : null;

  return (
    <div className="flex flex-col min-h-[calc(100vh-56px)] p-4 gap-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">מספרים</h1>
        {total > 0 && (
          <button
            onClick={resetScore}
            className="text-xs text-gray-400 border border-gray-300 rounded px-2 py-1"
          >
            אפס
          </button>
        )}
      </div>

      {/* Score */}
      <div className="flex items-center gap-3 text-sm text-gray-600">
        <span>
          <span className="font-bold text-green-600">{correct}</span>
          {" / "}
          <span className="font-bold">{total}</span>
          {percentage !== null && (
            <span className="text-gray-400"> ({percentage}%)</span>
          )}
        </span>
      </div>

      {/* Mode tabs */}
      <div className="flex rounded-xl overflow-hidden border border-gray-300 self-start">
        <button
          onClick={() => setMode("digits")}
          className={`px-4 py-2 text-sm font-bold transition-colors ${
            mode === "digits"
              ? "bg-black text-white"
              : "bg-white text-gray-600 dark:bg-gray-900 dark:text-gray-400"
          }`}
        >
          ספרות → ערבית
        </button>
        <button
          onClick={() => setMode("arabic")}
          className={`px-4 py-2 text-sm font-bold transition-colors ${
            mode === "arabic"
              ? "bg-black text-white"
              : "bg-white text-gray-600 dark:bg-gray-900 dark:text-gray-400"
          }`}
        >
          ערבית → ספרות
        </button>
      </div>

      {/* Difficulty toggle */}
      <div className="flex gap-2 text-xs">
        <button
          onClick={() => setDifficulty("beginner")}
          className={`rounded-full px-3 py-1 border transition-colors ${
            difficulty === "beginner"
              ? "bg-blue-600 text-white border-blue-600"
              : "border-gray-300 text-gray-500"
          }`}
        >
          מתחיל (1–20)
        </button>
        <button
          onClick={() => setDifficulty("advanced")}
          className={`rounded-full px-3 py-1 border transition-colors ${
            difficulty === "advanced"
              ? "bg-blue-600 text-white border-blue-600"
              : "border-gray-300 text-gray-500"
          }`}
        >
          מתקדם (1–100)
        </button>
      </div>

      {/* Question card */}
      <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
        {current && (
          <>
            {/* Prompt */}
            <div className="flex flex-col items-center gap-1">
              {mode === "digits" ? (
                <p className="text-6xl font-bold">{current.value}</p>
              ) : (
                <>
                  <p
                    className="text-4xl font-bold"
                    dir="rtl"
                    lang="ar"
                    style={{ fontFamily: "serif" }}
                  >
                    {current.arabic}
                  </p>
                  <p className="text-sm text-gray-400 nikud-text">
                    {current.translit}
                  </p>
                </>
              )}
            </div>

            {/* Answer feedback */}
            {result && (
              <div
                className={`rounded-2xl px-6 py-4 text-center ${
                  result === "correct"
                    ? "bg-green-50 dark:bg-green-950"
                    : "bg-red-50 dark:bg-red-950"
                }`}
              >
                <p className="text-lg font-bold">
                  {result === "correct" ? "✓ נכון!" : "✗ לא נכון"}
                </p>
                {result === "wrong" && (
                  <div className="mt-1">
                    <p
                      className="text-2xl font-bold"
                      dir="rtl"
                      lang="ar"
                      style={{ fontFamily: "serif" }}
                    >
                      {current.arabic}
                    </p>
                    <p className="text-sm text-gray-500 nikud-text">
                      {current.translit}
                    </p>
                    {mode === "arabic" && (
                      <p className="text-3xl font-bold mt-1">{current.value}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Options grid */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
              {options.map((opt) => {
                const isChosen = chosenValue === opt.value;
                const isCorrectOpt = opt.value === current.value;
                let btnClass =
                  "rounded-xl py-5 px-3 text-base font-bold transition-colors border-2 ";

                if (result === null) {
                  btnClass +=
                    "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 active:bg-gray-100";
                } else if (isCorrectOpt) {
                  btnClass += "bg-green-600 text-white border-green-600";
                } else if (isChosen) {
                  btnClass += "bg-red-600 text-white border-red-600";
                } else {
                  btnClass +=
                    "bg-gray-100 dark:bg-gray-800 border-gray-100 dark:border-gray-800 text-gray-400";
                }

                return (
                  <button
                    key={opt.value}
                    onClick={() => handleAnswer(opt.value)}
                    disabled={result !== null}
                    className={btnClass}
                  >
                    {mode === "digits" ? (
                      <span
                        dir="rtl"
                        lang="ar"
                        style={{ fontFamily: "serif" }}
                      >
                        {opt.arabic}
                      </span>
                    ) : (
                      <span>{opt.value}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Next button — shown after answering */}
      {result !== null && (
        <button
          onClick={nextQuestion}
          className="rounded-xl bg-black py-5 text-lg font-bold text-white"
        >
          הבא ←
        </button>
      )}
    </div>
  );
}
