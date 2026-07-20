"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Rating } from "ts-fsrs";

type Track = "recognition" | "production" | "audio";

type QueueItem = {
  srs_id: string;
  verb_id: string;
  track: Track;
  root: string;
  meaning_he: string;
  forms: Record<string, string>;
};

type VerbBrief = {
  id: string;
  root: string;
  meaning_he: string;
  forms: Record<string, string>;
};

// Pronoun keys in display order
const PRONOUN_KEYS = ["ana", "inta", "inti", "huwwe", "hiyye", "ihna", "intu", "hum"] as const;

// Arabic display labels for each pronoun
const PRONOUN_AR: Record<string, string> = {
  ana: "أنا",
  inta: "إنت",
  inti: "إنتي",
  huwwe: "هو",
  hiyye: "هي",
  ihna: "إحنا",
  intu: "إنتو",
  hum: "هم",
};

// Hebrew labels for each pronoun (for production prompt)
const PRONOUN_HE: Record<string, string> = {
  ana: "אני",
  inta: "אתה",
  inti: "את",
  huwwe: "הוא",
  hiyye: "היא",
  ihna: "אנחנו",
  intu: "אתם",
  hum: "הם",
};

const TRACK_LABEL: Record<Track, string> = {
  recognition: "זיהוי",
  production: "ייצור",
  audio: "שמע",
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickPronoun(forms: Record<string, string>): string {
  const keys = Object.keys(forms).filter((k) => forms[k]);
  if (!keys.length) return "ana";
  return keys[Math.floor(Math.random() * keys.length)];
}

function buildRecognitionChoices(
  correct: string,
  allVerbs: VerbBrief[],
  currentVerbId: string
): string[] {
  const distractors = allVerbs
    .filter((v) => v.id !== currentVerbId && v.meaning_he !== correct)
    .map((v) => v.meaning_he);
  const picked = shuffle(distractors).slice(0, 3);
  return shuffle([correct, ...picked]);
}

function buildAudioChoices(
  correct: string,
  pronoun: string,
  allVerbs: VerbBrief[],
  currentVerbId: string
): string[] {
  const distractors = allVerbs
    .filter((v) => v.id !== currentVerbId)
    .map((v) => v.forms[pronoun])
    .filter((f): f is string => !!f && f !== correct);
  const picked = shuffle(distractors).slice(0, 3);
  return shuffle([correct, ...picked]);
}

function normalise(s: string): string {
  return s.trim().replace(/\s+/g, " ").toLowerCase();
}

export default function InflectionsPage() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [allVerbs, setAllVerbs] = useState<VerbBrief[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Per-card state (reset when index changes)
  const [pronoun, setPronoun] = useState("");
  const [choices, setChoices] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [answered, setAnswered] = useState(false);
  const [grading, setGrading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inflections/queue");
      const data = await res.json();
      setItems(data.items ?? []);
      setAllVerbs(data.all_verbs ?? []);
      setIndex(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  // Reset per-card state when item changes
  useEffect(() => {
    const item = items[index];
    if (!item) return;

    const p = pickPronoun(item.forms);
    setPronoun(p);
    setSelected(null);
    setTyped("");
    setAnswered(false);
    setGrading(false);

    if (item.track === "recognition") {
      setChoices(buildRecognitionChoices(item.meaning_he, allVerbs, item.verb_id));
    } else if (item.track === "audio") {
      const correct = item.forms[p] ?? "";
      setChoices(buildAudioChoices(correct, p, allVerbs, item.verb_id));
    } else {
      setChoices([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, items]);

  // Focus text input for production track
  useEffect(() => {
    if (!answered && items[index]?.track === "production") {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [answered, index, items]);

  const item = items[index];
  const correct = item
    ? item.track === "recognition"
      ? item.meaning_he
      : item.forms[pronoun] ?? ""
    : "";

  async function submitGrade(rating: number) {
    if (!item || grading) return;
    setGrading(true);
    await fetch("/api/inflections/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ srs_id: item.srs_id, rating }),
    });
    await loadQueue();
    setGrading(false);
  }

  function handleMcSelect(choice: string) {
    if (answered) return;
    setSelected(choice);
    setAnswered(true);
    // Auto-grade: correct → Good, wrong → Again
    const rating = choice === correct ? Rating.Good : Rating.Again;
    submitGrade(rating);
  }

  function handleProductionSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (answered) return;
    setAnswered(true);
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-gray-500">
        טוען...
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-4 text-center">
        <h1 className="text-2xl font-bold">כל הנטיות בוצעו!</h1>
        <p className="text-gray-500">אין נטיות נוספות לחזרה כרגע</p>
        <button
          onClick={loadQueue}
          className="mt-4 rounded-xl bg-black px-6 py-3 text-white font-bold"
        >
          רענן
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col p-4 gap-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
      {/* Header */}
      <div className="flex justify-between text-sm text-gray-500">
        <span>
          <bdi>{items.length - index}</bdi> שורשים בתור
        </span>
        <span className="rounded px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-xs font-medium">
          {TRACK_LABEL[item.track]}
        </span>
      </div>

      {/* Card content */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        {item.track === "recognition" && (
          <RecognitionPrompt
            form={item.forms[pronoun] ?? ""}
            pronoun={pronoun}
          />
        )}
        {item.track === "production" && (
          <ProductionPrompt
            pronoun={pronoun}
            meaningHe={item.meaning_he}
          />
        )}
        {item.track === "audio" && (
          <AudioPrompt
            pronoun={pronoun}
            root={item.root}
          />
        )}

        {/* Feedback */}
        {answered && (
          <FeedbackBanner
            wasCorrect={
              item.track === "production"
                ? normalise(typed) === normalise(correct)
                : selected === correct
            }
            correctForm={correct}
            track={item.track}
          />
        )}
      </div>

      {/* Input area */}
      {!answered ? (
        <>
          {(item.track === "recognition" || item.track === "audio") && (
            <div className="grid grid-cols-2 gap-3">
              {choices.map((ch) => (
                <button
                  key={ch}
                  onClick={() => handleMcSelect(ch)}
                  className="rounded-xl border border-gray-200 dark:border-gray-700 py-4 text-base font-medium active:bg-gray-50 dark:active:bg-gray-800"
                >
                  {ch}
                </button>
              ))}
            </div>
          )}

          {item.track === "production" && (
            <form onSubmit={handleProductionSubmit} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                dir="rtl"
                placeholder="כתוב את הצורה הערבית..."
                className="flex-1 rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-4 text-lg bg-transparent outline-none focus:border-black dark:focus:border-white"
              />
              <button
                type="submit"
                className="rounded-xl bg-black px-5 py-4 text-white font-bold"
              >
                בדוק
              </button>
            </form>
          )}
        </>
      ) : (
        /* Grade buttons — only shown for production (MC auto-grades) */
        item.track === "production" && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => submitGrade(Rating.Again)}
              disabled={grading}
              className="rounded-xl bg-red-600 py-5 text-lg font-bold text-white disabled:opacity-50"
            >
              שוב
            </button>
            <button
              onClick={() => submitGrade(Rating.Good)}
              disabled={grading}
              className="rounded-xl bg-green-600 py-5 text-lg font-bold text-white disabled:opacity-50"
            >
              טוב
            </button>
          </div>
        )
      )}

      {/* After MC answer, show a "Next" placeholder while auto-grading */}
      {answered && item.track !== "production" && (
        <div className="flex justify-center">
          <span className="text-gray-400 text-sm">
            {grading ? "שומר..." : "טוען..."}
          </span>
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ── */

function RecognitionPrompt({ form, pronoun }: { form: string; pronoun: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-sm text-gray-500">
        {PRONOUN_AR[pronoun]} — מה המשמעות?
      </p>
      <p className="text-4xl font-bold" dir="rtl" style={{ fontFamily: "serif" }}>
        {form}
      </p>
    </div>
  );
}

function ProductionPrompt({ pronoun, meaningHe }: { pronoun: string; meaningHe: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm text-gray-500">כתוב בערבית</p>
      <p className="text-2xl font-bold">
        {PRONOUN_HE[pronoun]} + {meaningHe}
      </p>
      <p className="text-sm text-gray-400">
        ({PRONOUN_AR[pronoun]})
      </p>
    </div>
  );
}

function AudioPrompt({ pronoun, root }: { pronoun: string; root: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-sm text-gray-500">
        בחר את הצורה הנכונה עבור {PRONOUN_AR[pronoun]}
      </p>
      <p className="text-4xl font-bold" dir="rtl" style={{ fontFamily: "serif" }}>
        {root}
      </p>
    </div>
  );
}

function FeedbackBanner({
  wasCorrect,
  correctForm,
  track,
}: {
  wasCorrect: boolean;
  correctForm: string;
  track: Track;
}) {
  return (
    <div
      className={`rounded-xl px-4 py-3 text-center ${
        wasCorrect
          ? "bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200"
          : "bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200"
      }`}
    >
      <p className="font-bold">{wasCorrect ? "נכון!" : "לא נכון"}</p>
      {(!wasCorrect || track === "production") && (
        <p className="text-lg mt-1" dir="rtl">
          {correctForm}
        </p>
      )}
    </div>
  );
}
