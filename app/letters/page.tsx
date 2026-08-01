"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { strings } from "@/lib/strings";
import { availableForms, positionalForm } from "@/lib/arabic-letters";

type Choice = { ch: string; sound: string; glyph: string };
type Example = { card_id: string; arabic: string; translit: string; he: string };
type Item = {
  target: string;
  form: "isolated" | "initial" | "medial" | "final";
  glyph: string;
  sound: string;
  name: string;
  choices: Choice[];
  example: Example | null;
};

const FORM_LABEL: Record<Item["form"], string> = {
  isolated: "מבודדת",
  initial: "בתחילת מילה",
  medial: "באמצע מילה",
  final: "בסוף מילה",
};

export default function LettersPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [introduced, setIntroduced] = useState<string[]>([]);
  const [mastered, setMastered] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [answered, setAnswered] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [sessionId] = useState(() => crypto.randomUUID());
  const shownAt = useRef(Date.now());

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/letters/queue?size=15")
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items ?? []);
        setIntroduced(d.introduced ?? []);
        setMastered(d.mastered ?? []);
        setIndex(0);
        setAnswered(null);
        setCorrectCount(0);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => load(), [load]);
  useEffect(() => {
    shownAt.current = Date.now();
  }, [index]);

  const item = items[index];

  function answer(ch: string) {
    if (!item || answered) return;
    const correct = ch === item.target;
    setAnswered(ch);
    if (correct) setCorrectCount((n) => n + 1);

    // Records which letter was chosen instead — that is the confusion matrix
    fetch("/api/letters/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        target_letter: item.target,
        positional_form: item.form,
        task_type: "choose_sound",
        correct,
        selected_letter: correct ? null : ch,
        card_id: item.example?.card_id ?? null,
        latency_ms: Date.now() - shownAt.current,
      }),
    }).catch(() => {});
  }

  if (loading) {
    return <div className="flex flex-1 items-center justify-center text-gray-500">{strings.common.loading}</div>;
  }

  if (!item) {
    return (
      <div className="flex flex-col gap-5 p-4 max-w-md mx-auto">
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

  const isCorrect = answered === item.target;

  return (
    <div className="flex flex-1 flex-col gap-5 p-4 max-w-md mx-auto">
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>
          {index + 1} / {items.length}
        </span>
        <span>
          נלמדו {introduced.length} · שולטים {mastered.length}
        </span>
      </div>

      <div className="flex flex-col items-center gap-2">
        <span className="text-xs text-gray-400">{FORM_LABEL[item.form]}</span>
        {/* Big and plain — the research asks for 56–72px in a clear Arabic face */}
        <p className="text-[72px] leading-none" style={{ fontFamily: "serif" }} dir="rtl">
          {item.glyph}
        </p>
        <span className="text-xs text-gray-400">איזה צליל?</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {item.choices.map((c) => {
          const picked = answered === c.ch;
          const showCorrect = answered && c.ch === item.target;
          return (
            <button
              key={c.ch}
              onClick={() => answer(c.ch)}
              disabled={!!answered}
              className={`rounded-xl border py-4 text-lg font-bold transition-colors ${
                showCorrect
                  ? "border-green-600 bg-green-50"
                  : picked
                  ? "border-red-500 bg-red-50"
                  : "hover:bg-gray-50"
              }`}
            >
              {c.sound}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="flex flex-col gap-3 rounded-xl border p-4">
          <p className="text-sm">
            <span className="font-bold">{isCorrect ? "נכון" : "לא"}</span> — {item.name}, נהגית{" "}
            <span className="font-bold">{item.sound}</span>
          </p>

          {/* All four shapes, so the letter reads as one skeleton with a
              connecting stroke rather than four separate symbols */}
          <div className="flex justify-around border-t pt-3" dir="rtl">
            {/* Only the forms this letter actually has — a non-connecting
                letter (ا د ذ ر ز و) has no initial or medial shape at all */}
            {availableForms(item.target).map((f) => (
              <div key={f} className="flex flex-col items-center gap-1">
                <span className="text-3xl" style={{ fontFamily: "serif" }}>
                  {positionalForm(item.target, f)}
                </span>
                <span className="text-[10px] text-gray-400">{FORM_LABEL[f]}</span>
              </div>
            ))}
          </div>

          {item.example && (
            <div className="border-t pt-3 text-center">
              <p className="text-2xl" style={{ fontFamily: "serif" }} dir="rtl">
                {item.example.arabic}
              </p>
              <p className="nikud-text text-base mt-1">{item.example.translit}</p>
              <p className="text-xs text-gray-500">{item.example.he}</p>
            </div>
          )}

          <button
            onClick={() => {
              setAnswered(null);
              setIndex((i) => i + 1);
            }}
            className="rounded-xl bg-black py-3 text-base font-bold text-white"
          >
            הבא
          </button>
        </div>
      )}

      <p className="text-center text-[11px] text-gray-400">תרגול בלבד — לא משנה מועדי FSRS</p>
    </div>
  );
}
