"use client";

import { useEffect, useState } from "react";
import { strings } from "@/lib/strings";

type Slot = { person: string; answer: string };
/** One draggable form. `id` keeps duplicate forms apart; see `pool` below. */
type Tile = { id: number; form: string };
type DrillSet = {
  group: string;
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
  /** The remaining tables in the topic being run, so they play back to back. */
  const [queue, setQueue] = useState<DrillSet[]>([]);
  const [runLabel, setRunLabel] = useState<string | null>(null);
  const [runTotal, setRunTotal] = useState(0);

  // person → the form the learner placed there
  const [placed, setPlaced] = useState<Record<string, string>>({});
  /**
   * Tiles carry an id, not just their text.
   *
   * Syncretic cells are normal, not exotic — the מפגש 6 past-tense table has
   * אַנַא and אִנְתֵ both as כַּתַבְּת, and inta/hiyye share a form all over the
   * imperfect. Keyed by text, two identical tiles collide on the React key and
   * placing one removes both, so a table with any repeated form could not be
   * completed at all.
   */
  const [picked, setPicked] = useState<Tile | null>(null);
  const [wrong, setWrong] = useState<string | null>(null);
  const [pool, setPool] = useState<Tile[]>([]);
  const [mistakes, setMistakes] = useState(0);

  useEffect(() => {
    fetch("/api/inflection-drill")
      .then((r) => r.json())
      .then((d) => setSets(d.sets ?? []))
      .finally(() => setLoading(false));
  }, []);

  function startRun(items: DrillSet[]) {
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    setRunLabel(shuffled[0]?.group ?? null);
    setRunTotal(shuffled.length);
    setQueue(shuffled.slice(1));
    open(shuffled[0]);
  }

  function nextInRun() {
    const [head, ...rest] = queue;
    if (!head) {
      setActive(null);
      setRunLabel(null);
      return;
    }
    setQueue(rest);
    open(head);
  }

  function open(s: DrillSet) {
    setActive(s);
    setPlaced({});
    setPicked(null);
    setWrong(null);
    setMistakes(0);
    setPool(shuffle(s.slots.map((x, i) => ({ id: i, form: x.answer }))));
  }

  function place(person: string) {
    if (!active || !picked) return;
    const correct = active.slots.find((s) => s.person === person)?.answer;

    if (correct !== picked.form) {
      // Wrong box: flash it, keep the form in hand — no penalty beyond the count
      setWrong(person);
      setMistakes((m) => m + 1);
      setTimeout(() => setWrong(null), 600);
      return;
    }

    setPlaced((p) => ({ ...p, [person]: picked.form }));
    // Remove the tile by id. Filtering by text would take every duplicate with
    // it, which is what broke syncretic tables.
    setPool((p) => p.filter((x) => x.id !== picked.id));
    setPicked(null);
  }

  const solved = active !== null && pool.length === 0;

  if (loading) {
    return <div className="flex flex-1 items-center justify-center text-gray-500">{strings.common.loading}</div>;
  }

  if (!active) {
    // One entry per topic, not per table. The flat list was 77 buttons, which
    // made picking what to practise a task of its own (note 17f19ad7).
    const byGroup = new Map<string, DrillSet[]>();
    for (const s of sets) {
      if (!byGroup.has(s.group)) byGroup.set(s.group, []);
      byGroup.get(s.group)!.push(s);
    }
    const groups = [...byGroup.entries()].sort((a, b) => b[1].length - a[1].length);

    return (
      <div className="flex flex-col gap-6 p-4 max-w-2xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold">התאמת הטיות</h1>
          <p className="text-sm text-gray-500 mt-1">
            בחר נושא ותקבל כמה טבלאות ברצף. {sets.length} טבלאות מאומתות.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {groups.map(([group, items]) => (
            <button
              key={group}
              onClick={() => startRun(items)}
              className="flex items-center justify-between border rounded-xl p-4 text-right hover:bg-gray-50 transition-colors"
            >
              <span className="font-bold">{group}</span>
              <span className="text-xs text-gray-400">{items.length} טבלאות</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            setActive(null);
            setQueue([]);
            setRunLabel(null);
          }}
          className="text-xs text-gray-500 underline underline-offset-2"
        >
          חזרה לרשימה
        </button>
        <span className="text-xs text-gray-400">
          {runLabel && runTotal > 1 && (
            <span className="ml-2">
              {runLabel} · {runTotal - queue.length}/{runTotal}
            </span>
          )}
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
            {pool.map((tile) => (
              <button
                key={tile.id}
                onClick={() => setPicked(picked?.id === tile.id ? null : tile)}
                className={`nikud-text rounded-xl border px-3 py-2 text-base transition-colors ${
                  picked?.id === tile.id ? "bg-black text-white border-black" : "hover:bg-gray-50"
                }`}
              >
                {tile.form}
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
          {/* Finishing a table advances within the topic rather than dumping
              back to the list — the point of grouping was to practise several in
              a row without picking each one. */}
          <button
            onClick={nextInRun}
            className="rounded-xl bg-black py-3 text-sm font-bold text-white"
          >
            {queue.length > 0 ? `הטבלה הבאה (עוד ${queue.length})` : "סיימת את הנושא"}
          </button>
        </div>
      )}

      <p className="text-center text-[11px] text-gray-400">תרגול בלבד — לא משנה מועדי FSRS</p>
    </div>
  );
}
