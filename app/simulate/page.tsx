"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { strings } from "@/lib/strings";

type SimCard = {
  id: string;
  hebrew_meaning: string;
  translit_nikud: string;
  arabic_script: string | null;
  item_type: string;
  notes: string | null;
};

type Sentence = {
  translit: string;
  he: string;
};

type Tab = "cards" | "sentences";

const SESSION_KEY = "yalla_sentences_cache";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function SimulatePage() {
  const [tab, setTab] = useState<Tab>("cards");

  // Cards tab state
  const [cards, setCards] = useState<SimCard[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [cardsLoading, setCardsLoading] = useState(true);

  // Sentences tab state
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [sentencesLoading, setSentencesLoading] = useState(false);
  const [sentencesError, setSentencesError] = useState<string | null>(null);
  const [revealedSentences, setRevealedSentences] = useState<Set<number>>(new Set());
  const sentencesFetched = useRef(false);

  const loadCards = useCallback(async () => {
    setCardsLoading(true);
    const data = await fetch("/api/browse?limit=500").then((r) => r.json());
    const all: SimCard[] = (data.cards ?? []).filter((c: SimCard) => c.translit_nikud);
    setCards(shuffle(all));
    setIndex(0);
    setRevealed(false);
    setCardsLoading(false);
  }, []);

  useEffect(() => { loadCards(); }, [loadCards]);

  const loadSentences = useCallback(async (force = false) => {
    if (!force) {
      const cached = sessionStorage.getItem(SESSION_KEY);
      if (cached) {
        try {
          setSentences(JSON.parse(cached) as Sentence[]);
          return;
        } catch { /* ignore */ }
      }
    }

    setSentencesLoading(true);
    setSentencesError(null);
    setRevealedSentences(new Set());
    try {
      const data = await fetch("/api/sentences/generate").then((r) => r.json());
      if (data.error) throw new Error(data.error);
      const s: Sentence[] = data.sentences ?? [];
      setSentences(s);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
    } catch (err) {
      setSentencesError(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setSentencesLoading(false);
    }
  }, []);

  // Load sentences when tab first activated
  useEffect(() => {
    if (tab === "sentences" && !sentencesFetched.current) {
      sentencesFetched.current = true;
      loadSentences();
    }
  }, [tab, loadSentences]);

  function toggleReveal(i: number) {
    setRevealedSentences((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  }

  function regenerate() {
    sessionStorage.removeItem(SESSION_KEY);
    loadSentences(true);
  }

  const current = cards[index];

  return (
    <div className="flex flex-col flex-1 p-4 gap-4 max-w-md mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">{strings.nav.simulate}</h1>
        {tab === "cards" && (
          <button
            onClick={loadCards}
            className="text-sm text-gray-500 border rounded px-3 py-1 hover:bg-gray-50"
          >
            ערבב מחדש
          </button>
        )}
        {tab === "sentences" && !sentencesLoading && (
          <button
            onClick={regenerate}
            className="text-sm text-gray-500 border rounded px-3 py-1 hover:bg-gray-50"
          >
            גנרט מחדש
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl overflow-hidden border border-gray-300 self-start">
        {(["cards", "sentences"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-bold transition-colors ${tab === t ? "bg-black text-white" : "bg-white text-gray-600"}`}
          >
            {t === "cards" ? "כרטיסים" : "משפטים"}
          </button>
        ))}
      </div>

      {/* Cards Tab */}
      {tab === "cards" && (
        <>
          {cardsLoading ? (
            <div className="flex flex-1 items-center justify-center text-gray-500">
              {strings.common.loading}
            </div>
          ) : cards.length === 0 ? (
            <div className="flex flex-1 items-center justify-center text-gray-500">אין כרטיסים</div>
          ) : (
            <>
              <div className="text-sm text-gray-400 text-center">
                <bdi>{index + 1}</bdi> / <bdi>{cards.length}</bdi>
              </div>

              <div
                className="flex flex-col flex-1 items-center justify-center gap-6 text-center border rounded-2xl p-6 cursor-pointer select-none"
                onClick={() => !revealed && setRevealed(true)}
              >
                <p className="text-3xl font-bold nikud-text leading-relaxed">
                  {current.hebrew_meaning}
                </p>
                {!revealed && <p className="text-sm text-gray-400 mt-4">הקש לגילוי</p>}
                {revealed && (
                  <div className="flex flex-col items-center gap-3 border-t pt-6 w-full">
                    <p className="text-2xl nikud-text">{current.translit_nikud}</p>
                    {current.arabic_script && (
                      <p className="text-xl text-gray-500">{current.arabic_script}</p>
                    )}
                    {current.notes && (
                      <p className="text-sm text-gray-400 nikud-text">{current.notes}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { setIndex((i) => Math.max(i - 1, 0)); setRevealed(false); }}
                  disabled={index === 0}
                  className="rounded-xl border py-4 px-6 text-xl font-bold disabled:opacity-30"
                >←</button>
                <button
                  onClick={() => setRevealed(true)}
                  disabled={revealed}
                  className="flex-1 rounded-xl bg-black text-white py-4 text-base font-bold disabled:opacity-30 disabled:cursor-default"
                >
                  {revealed ? "גלוי" : strings.review.showAnswer}
                </button>
                <button
                  onClick={() => { setIndex((i) => Math.min(i + 1, cards.length - 1)); setRevealed(false); }}
                  disabled={index === cards.length - 1}
                  className="rounded-xl border py-4 px-6 text-xl font-bold disabled:opacity-30"
                >→</button>
              </div>
            </>
          )}
        </>
      )}

      {/* Sentences Tab */}
      {tab === "sentences" && (
        <div className="flex flex-col gap-3 flex-1">
          {sentencesLoading && (
            <div className="flex flex-1 items-center justify-center flex-col gap-2 text-gray-500">
              <div className="text-2xl animate-spin">⟳</div>
              <p className="text-sm">מגנרט משפטים...</p>
            </div>
          )}

          {sentencesError && (
            <div className="flex flex-1 items-center justify-center flex-col gap-3">
              <p className="text-red-600 text-sm">{sentencesError}</p>
              <button onClick={regenerate} className="border rounded px-4 py-2 text-sm">נסה שוב</button>
            </div>
          )}

          {!sentencesLoading && !sentencesError && sentences.length > 0 && (
            <>
              <p className="text-xs text-gray-400 text-center">לחץ על משפט לגילוי התרגום</p>
              <div className="flex flex-col gap-2">
                {sentences.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => toggleReveal(i)}
                    className="text-right border rounded-xl p-4 hover:bg-gray-50 transition-colors"
                  >
                    <p className="nikud-text text-lg leading-relaxed">{s.translit}</p>
                    {revealedSentences.has(i) && (
                      <p className="text-sm text-gray-500 mt-1 border-t pt-2">{s.he}</p>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
