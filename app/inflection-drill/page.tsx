"use client";

import { useEffect, useState } from "react";
import { strings } from "@/lib/strings";

type Slot = { person: string; answer: string };
type DrillSet = {
  id: string;
  source: "verb" | "paradigm";
  title: string;
  subtitle: string | null;
  slots: Slot[];
};

function shuffle<T>(a: T[]): T[] {
  const out = [...a];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export default function InflectionDrillPage() {
  const [sets, setSets] = useState<DrillSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<DrillSet | null>(null);

  // person → the form the learner placed there
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [picked, setPicked] = useState<string | null>(null);
  const [wrong, setWrong] = useState<string | null>(null);
  const [pool, setPool] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);

  useEffect(() => {
    fetch("/api/inflection-drill")
      .then((r) => r.json())
      .then((d) => setSets(d.sets ?? []))
      .finally(() => setLoading(false));
  }, []);

  function open(s: DrillSet) {
    setActive(s);
    setPlaced({});
    setPicked(null);
    setWrong(null);
    setMistakes(0);
    setPool(shuffle(s.slots.map((x) => x.answer)));
  }

  function place(person: string) {
    if (!active || !picked) return;
    const correct = active.slots.find((s) => s.person === person)?.answer;

    if (correct !== picked) {
      // Wrong box: flash it, keep the form in hand — no penalty beyond the count
      setWrong(person);
      setMistakes((m) => m + 1);
      setTimeout(() => setWrong(null), 600);
      return;
    }

    setPlaced((p) => ({ ...p, [person]: picked }));
    setPool((p) => p.filter((x) => x !== picked));
    setPicked(null);
  }

  const solved = active !== null && pool.length === 0;

  if (loading) {
    return <div className="flex flex-1 items-center justify-center text-gray-500">{strings.common.loading}</div>;
  }

  if (!active) {
    const verbs = sets.filter((s) => s.source === "verb");
    const paradigms = sets.filter((s) => s.source === "paradigm");
    return (
      <div className="flex flex-col gap-6 p-4 max-w-2xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold">התאמת הטיות</h1>
          <p className="text-sm text-gray-500 mt-1">
            בחר צורה ואז את הגוף שלה. {sets.length} טבלאות מאומתות.
          </p>
        </div>

        {[
          { label: "מילות יחס ושייכות", items: paradigms },
          { label: "פעלים", items: verbs },
        ].map(({ label, items }) =>
          items.length === 0 ? null : (
            <section key={label} className="flex flex-col gap-2">
              <h2 className="text-sm font-bold text-gray-500">{label}</h2>
              <div className="grid grid-cols-2 gap-2">
                {items.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => open(s)}
                    className="flex flex-col items-start gap-1 border rounded-xl p-3 text-right hover:bg-gray-50 transition-colors"
                  >
                    <span className="nikud-text font-bold">{s.title}</span>
                    {s.subtitle && (
                      <span className="text-xs text-gray-400 line-clamp-1">{s.subtitle}</span>
                    )}
                    <span className="text-[11px] text-gray-400">{s.slots.length} גופים</span>
                  </button>
                ))}
              </div>
            </section>
          )
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActive(null)}
          className="text-xs text-gray-500 underline underline-offset-2"
        >
          חזרה לרשימה
        </button>
        <span className="text-xs text-gray-400">
          {Object.keys(placed).length} / {active.slots.length}
        </span>
      </div>

      <div className="text-center">
        <h2 className="text-xl font-bold nikud-text">{active.title}</h2>
        {active.subtitle && <p className="text-xs text-gray-400 mt-1">{active.subtitle}</p>}
      </div>

      {/* Boxes, in canonical person order */}
      <div className="flex flex-col gap-2">
        {active.slots.map((s) => {
          const filled = placed[s.person];
          const isWrong = wrong === s.person;
          return (
            <button
              key={s.person}
              onClick={() => place(s.person)}
              disabled={!!filled || !picked}
              className={`flex items-center justify-between rounded-xl border px-3 py-3 transition-colors ${
                isWrong
                  ? "border-red-500 bg-red-50"
                  : filled
                  ? "border-green-600 bg-green-50"
                  : picked
                  ? "border-dashed border-gray-400 hover:bg-gray-50"
                  : "border-gray-200"
              }`}
            >
              <span className="nikud-text text-lg">{filled ?? ""}</span>
              <span className="text-sm font-bold text-gray-500">{s.person}</span>
            </button>
          );
        })}
      </div>

      {!solved ? (
        <>
          <p className="text-center text-xs text-gray-400">
            {picked ? "עכשיו בחר את הגוף" : "בחר צורה"}
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {pool.map((form) => (
              <button
                key={form}
                onClick={() => setPicked(form === picked ? null : form)}
                className={`nikud-text rounded-xl border px-3 py-2 text-base transition-colors ${
                  picked === form ? "bg-black text-white border-black" : "hover:bg-gray-50"
                }`}
              >
                {form}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-center text-base font-bold">
            {mistakes === 0 ? "מושלם!" : `סיימת — ${mistakes} טעויות`}
          </p>
          <button
            onClick={() => open(active)}
            className="rounded-xl border py-3 text-sm font-bold"
          >
            שוב
          </button>
          <button
            onClick={() => setActive(null)}
            className="rounded-xl bg-black py-3 text-sm font-bold text-white"
          >
            טבלה אחרת
          </button>
        </div>
      )}

      <p className="text-center text-[11px] text-gray-400">תרגול בלבד — לא משנה מועדי FSRS</p>
    </div>
  );
}
