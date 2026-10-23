"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { strings } from "@/lib/strings";
import { matchAnswer, type MatchResult } from "@/lib/translation-match";

// The book's translation exercises, one sentence at a time: the prompt in one
// language, a free-text box for the other, and "close enough" judged on the
// letter skeleton (lib/translation-match.ts) — no nikud to type, and the
// book's optional (א)ל / bracketed words never count against you. The verdict
// can always be overruled: the matcher is a helper, not the teacher.
//
// Practice only. Nothing here touches cards or FSRS, and attempts are not stored.

type Item = { num: number; ar: string; he: string };
type DrillSet = { id: string; meeting: number; title: string; source: string; dir: "ar_to_he" | "he_to_ar"; items: Item[] };
type Dir = "ar_to_he" | "he_to_ar";
type Outcome = "right" | "wrong";

export default function TranslatePage() {
  const [sets, setSets] = useState<DrillSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<DrillSet | null>(null);
  const [dir, setDir] = useState<Dir>("ar_to_he");
  const [order, setOrder] = useState<Item[]>([]);
  const [i, setI] = useState(0);
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState<MatchResult | null>(null);
  const [outcomes, setOutcomes] = useState<Record<number, Outcome>>({});
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch("/api/translation-drill")
      .then((r) => r.json())
      .then((d) => setSets(d.sets ?? []))
      .finally(() => setLoading(false));
  }, []);

  function start(set: DrillSet, d: Dir, items = set.items) {
    setActive(set);
    setDir(d);
    setOrder(items);
    setI(0);
    setTyped("");
    setResult(null);
    setOutcomes({});
  }

  const item = order[i];
  const prompt = item ? (dir === "ar_to_he" ? item.ar : item.he) : "";
  const answer = item ? (dir === "ar_to_he" ? item.he : item.ar) : "";

  function check() {
    if (!item || !typed.trim()) return;
    const r = matchAnswer(typed, answer, dir === "ar_to_he" ? "he" : "ar");
    setResult(r);
    setOutcomes((o) => ({ ...o, [item.num]: r.pass ? "right" : "wrong" }));
  }

  function overrule(o: Outcome) {
    if (item) setOutcomes((prev) => ({ ...prev, [item.num]: o }));
  }

  function next() {
    setI((x) => x + 1);
    setTyped("");
    setResult(null);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  const grouped = useMemo(() => {
    const m = new Map<number, DrillSet[]>();
    for (const s of sets) m.set(s.meeting, [...(m.get(s.meeting) ?? []), s]);
    return [...m.entries()].sort((a, b) => a[0] - b[0]);
  }, [sets]);

  if (loading) return <div className="flex flex-1 items-center justify-center">{strings.common.loading}</div>;

  // ── choose a set ──────────────────────────────────────────────────────────
  if (!active) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 p-4">
        <div>
          <h1 className="text-2xl font-bold">תרגום משפטים</h1>
          <p className="text-sm text-gray-500">מהספר. כותבים בלי ניקוד — מה שקרוב מספיק נחשב נכון.</p>
        </div>
        {grouped.map(([meeting, list]) => (
          <section key={meeting} className="flex flex-col gap-3">
            <h2 className="text-sm font-bold text-gray-500">מפגש {meeting}</h2>
            {list.map((s) => (
              <div key={s.id} className="tile flex flex-col gap-3 p-4">
                <div>
                  <p className="font-bold">{s.title}</p>
                  <p className="text-xs text-gray-400">
                    {s.source} · {s.items.length} משפטים
                  </p>
                </div>
                <div className="flex gap-2">
                  {(["ar_to_he", "he_to_ar"] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => start(s, d)}
                      className={`flex-1 rounded-xl py-3 text-sm font-bold ${
                        d === s.dir ? "bg-black text-white" : "border border-gray-300 bg-white text-gray-600"
                      }`}
                    >
                      {d === "ar_to_he" ? "ערבית ← עברית" : "עברית ← ערבית"}
                      {d === s.dir && <span className="block text-[10px] font-normal opacity-80">כמו בספר</span>}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </section>
        ))}
        {sets.length === 0 && <p className="text-gray-500">אין עדיין תרגילים.</p>}
      </div>
    );
  }

  // ── summary ───────────────────────────────────────────────────────────────
  if (!item) {
    const wrongItems = order.filter((it) => outcomes[it.num] !== "right");
    const right = order.length - wrongItems.length;
    return (
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-3xl font-bold">
          <bdi>{right}</bdi> / <bdi>{order.length}</bdi>
        </h1>
        <p className="text-gray-500">{active.title}</p>
        {wrongItems.length > 0 && (
          <button onClick={() => start(active, dir, wrongItems)} className="w-full rounded-2xl bg-black py-4 font-bold text-white">
            שוב רק את <bdi>{wrongItems.length}</bdi> שלא הצליחו
          </button>
        )}
        <button onClick={() => start(active, dir)} className="w-full rounded-2xl border border-gray-300 bg-white py-4 font-bold text-gray-600">
          מההתחלה
        </button>
        <button onClick={() => setActive(null)} className="text-sm font-bold text-black">
          לכל התרגילים
        </button>
      </div>
    );
  }

  // ── one sentence ──────────────────────────────────────────────────────────
  const outcome = outcomes[item.num];
  const typingArabic = dir === "he_to_ar";
  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
      <div className="flex items-center justify-between text-sm text-gray-500">
        <button onClick={() => setActive(null)} className="font-bold text-black">
          ← תרגילים
        </button>
        <span>
          <bdi>{i + 1}</bdi> / <bdi>{order.length}</bdi>
        </span>
      </div>

      <div className="tile flex flex-col gap-2 p-6 text-center">
        <p className="text-xs text-gray-400">{typingArabic ? "תרגם לערבית (תעתיק, בלי ניקוד)" : "תרגם לעברית"}</p>
        <p className="nikud-text text-2xl font-bold leading-relaxed text-gray-900">{prompt}</p>
      </div>

      <textarea
        ref={inputRef}
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (result) next();
            else check();
          }
        }}
        disabled={!!result}
        rows={3}
        dir="rtl"
        autoFocus
        placeholder={typingArabic ? "למשל: האדא מלג'א ביתנא…" : "התרגום שלך…"}
        className="w-full rounded-2xl border border-gray-300 bg-white p-4 text-lg disabled:bg-gray-50"
      />

      {!result ? (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setResult({ score: 0, pass: false, words: answer.split(/\s+/).map((w) => ({ word: w, found: false })) });
              setOutcomes((o) => ({ ...o, [item.num]: "wrong" }));
            }}
            className="rounded-2xl border border-gray-300 bg-white px-5 py-4 font-bold text-gray-600"
          >
            לא יודע
          </button>
          <button onClick={check} disabled={!typed.trim()} className="flex-1 rounded-2xl bg-black py-4 text-lg font-bold text-white disabled:opacity-40">
            בדיקה
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div
            className={`rounded-2xl p-4 ${outcome === "right" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
          >
            <p className="font-bold">
              {outcome === "right" ? "נכון ✓" : "לא מספיק קרוב"}
              {typed.trim() && (
                <span className="ms-2 text-xs font-normal opacity-70">
                  התאמה <bdi>{Math.round(result.score * 100)}%</bdi>
                </span>
              )}
            </p>
          </div>

          <div className="tile flex flex-col gap-1 p-4">
            <p className="text-xs text-gray-400">התשובה בספר</p>
            <p className="nikud-text text-xl leading-relaxed">
              {result.words.map((w, k) => (
                <span key={k} className={w.found ? "text-gray-900" : "rounded bg-orange-50 text-orange-700"}>
                  {w.word}{" "}
                </span>
              ))}
            </p>
            <p className="text-xs text-gray-400">בכתום: מילים שלא מצאתי בתשובה שלך</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => overrule(outcome === "right" ? "wrong" : "right")}
              className="rounded-2xl border border-gray-300 bg-white px-4 py-4 text-sm font-bold text-gray-600"
            >
              {outcome === "right" ? "בעצם טעיתי" : "בעצם צדקתי"}
            </button>
            <button onClick={next} className="flex-1 rounded-2xl bg-black py-4 text-lg font-bold text-white">
              הבא
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
