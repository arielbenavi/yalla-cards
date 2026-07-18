"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { strings } from "@/lib/strings";

type CardSrs = { id: string; direction: "he_to_ar" | "ar_to_he" };

type BrowseCard = {
  id: string;
  hebrew_meaning: string;
  translit_nikud: string;
  arabic_script: string | null;
  item_type: string;
  notes: string | null;
  plural_form: string | null;
  clip_path: string | null;
  audio_url: string | null;
  lesson_id: string | null;
  self_score: number | null;
  lessons: { title: string | null; date: string } | null;
  card_srs: CardSrs[] | null;
};

type Lesson = { id: string; date: string; title: string | null };

const SCORE_LABELS = ["שוב", "קשה", "טוב", "קל"];
const SCORE_COLORS = ["bg-red-600", "bg-orange-500", "bg-green-600", "bg-blue-600"];
const SCORE_DOT_COLORS = ["bg-red-500", "bg-orange-400", "bg-green-500", "bg-blue-500"];

export default function BrowsePage() {
  const [cards, setCards] = useState<BrowseCard[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [q, setQ] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [itemType, setItemType] = useState("");
  const [scoreFilter, setScoreFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [dirFlipped, setDirFlipped] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/lessons")
      .then((r) => r.json())
      .then((d) => setLessons(d.lessons ?? []));
  }, []);

  const search = useCallback(async (query: string, lesson: string, type: string, sc: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (lesson) params.set("lesson_id", lesson);
    if (type) params.set("item_type", type);
    if (sc) params.set("score", sc);
    const data = await fetch(`/api/browse?${params}`).then((r) => r.json());
    setCards(data.cards ?? []);
    setIndex(0);
    setRevealed(false);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(q, lessonId, itemType, scoreFilter), 300);
  }, [q, lessonId, itemType, scoreFilter, search]);

  const current = cards[index];
  const cardSrs = current?.card_srs?.[0] ?? null;

  // Effective prompt direction: global flip XORs with per-card direction
  const baseDir = cardSrs?.direction ?? "he_to_ar";
  const effectiveDir: "he_to_ar" | "ar_to_he" = dirFlipped
    ? (baseDir === "he_to_ar" ? "ar_to_he" : "he_to_ar")
    : baseDir;

  function next() {
    setIndex((i) => Math.min(i + 1, cards.length - 1));
    setRevealed(false);
  }

  function prev() {
    setIndex((i) => Math.max(i - 1, 0));
    setRevealed(false);
  }

  function playAudio() {
    if (!current?.audio_url || !audioRef.current) return;
    audioRef.current.src = current.audio_url;
    audioRef.current.currentTime = 0;
    audioRef.current.play();
  }

  async function saveScore(sc: number) {
    if (!current) return;
    setCards((prev) => prev.map((c, i) => (i === index ? { ...c, self_score: sc } : c)));
    fetch(`/api/cards/${current.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ self_score: sc }),
    });
    next();
  }

  async function flipCardDirection() {
    if (!cardSrs) return;
    const newDir = cardSrs.direction === "he_to_ar" ? "ar_to_he" : "he_to_ar";
    setCards((prev) =>
      prev.map((c, i) => (i === index ? { ...c, card_srs: [{ ...cardSrs, direction: newDir }] } : c))
    );
    fetch(`/api/card-srs/${cardSrs.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction: newDir }),
    });
  }

  const dotColor = current?.self_score != null ? SCORE_DOT_COLORS[current.self_score - 1] : null;

  return (
    <div className="flex flex-col flex-1 p-4 gap-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] max-w-3xl mx-auto w-full">
      {/* Filters row 1 */}
      <div className="flex gap-2 flex-wrap">
        <select value={lessonId} onChange={(e) => setLessonId(e.target.value)} className="border rounded px-3 py-2 text-sm">
          <option value="">{strings.browse.filterLesson}</option>
          {lessons.map((l) => <option key={l.id} value={l.id}>{l.title || l.date}</option>)}
        </select>
        <select value={itemType} onChange={(e) => setItemType(e.target.value)} className="border rounded px-3 py-2 text-sm">
          <option value="">{strings.browse.filterTypeAll}</option>
          <option value="word">מילה</option>
          <option value="phrase">ביטוי</option>
          <option value="sentence">משפט</option>
        </select>
        <select value={scoreFilter} onChange={(e) => setScoreFilter(e.target.value)} className="border rounded px-3 py-2 text-sm">
          <option value="">כל הניקוד</option>
          <option value="1">שוב</option>
          <option value="2">קשה</option>
          <option value="3">טוב</option>
          <option value="4">קל</option>
        </select>
        <button
          onClick={() => setDirFlipped((f) => !f)}
          className={`border rounded px-3 py-2 text-sm font-medium transition-colors ${
            dirFlipped ? "bg-black text-white border-black" : "text-gray-600"
          }`}
          title={dirFlipped ? "שאלה: תעתיק — לחץ להחזיר לעברית" : "שאלה: עברית — לחץ להחזיר תעתיק"}
        >
          {dirFlipped ? "ת→ע" : "ע→ת"}
        </button>
      </div>
      {/* Search */}
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={strings.browse.searchPlaceholder}
        className="border rounded px-3 py-2 nikud-text w-full"
      />

      {loading ? (
        <div className="flex flex-1 items-center justify-center text-gray-500">{strings.common.loading}</div>
      ) : cards.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-gray-500">{strings.browse.noResults}</div>
      ) : (
        <>
          <div className="text-sm text-gray-500 text-center">
            <bdi>{index + 1}</bdi> / <bdi>{cards.length}</bdi>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
            {/* Question */}
            <div className="relative inline-block">
              <p className="text-3xl font-bold nikud-text">
                {effectiveDir === "he_to_ar" ? current.hebrew_meaning : current.translit_nikud}
              </p>
              {dotColor && (
                <span
                  className={`absolute -top-1 -right-3 h-2.5 w-2.5 rounded-full ${dotColor}`}
                  title={`ניקוד: ${SCORE_LABELS[(current.self_score ?? 1) - 1]}`}
                />
              )}
            </div>

            {revealed && (
              <div className="flex flex-col items-center gap-3">
                {effectiveDir === "he_to_ar" ? (
                  <>
                    <p className="text-2xl nikud-text">{current.translit_nikud}</p>
                    {current.plural_form && (
                      <p className="text-base text-gray-500 nikud-text">
                        <span className="text-gray-400 text-sm">ר׳ </span>{current.plural_form}
                      </p>
                    )}
                    {current.arabic_script && (
                      <p className="text-xl text-gray-600">{current.arabic_script}</p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold nikud-text">{current.hebrew_meaning}</p>
                    {current.plural_form && (
                      <p className="text-base text-gray-500 nikud-text">
                        <span className="text-gray-400 text-sm">ר׳ </span>{current.plural_form}
                      </p>
                    )}
                    {current.arabic_script && (
                      <p className="text-xl text-gray-600">{current.arabic_script}</p>
                    )}
                  </>
                )}
                {current.notes && (
                  <p className="text-base text-gray-500 nikud-text">{current.notes}</p>
                )}
                {current.audio_url && (
                  <button
                    onClick={playAudio}
                    aria-label={strings.browse.playAudio}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>

          <audio ref={audioRef} className="hidden" />

          {!revealed ? (
            <button
              onClick={() => setRevealed(true)}
              className="w-full rounded-xl bg-black py-5 text-lg font-bold text-white"
            >
              {strings.review.showAnswer}
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              {/* Self-score buttons: save score + advance */}
              <div className="grid grid-cols-4 gap-2">
                {SCORE_LABELS.map((label, i) => (
                  <button
                    key={i}
                    onClick={() => saveScore(i + 1)}
                    className={`rounded-xl py-4 text-base font-bold text-white ${SCORE_COLORS[i]}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {/* Nav row */}
              <div className="flex gap-2">
                <button
                  onClick={prev}
                  disabled={index === 0}
                  className="rounded-xl border py-4 px-5 text-lg font-bold disabled:opacity-30"
                >
                  ←
                </button>
                <button
                  onClick={next}
                  disabled={index === cards.length - 1}
                  className="flex-1 rounded-xl border py-4 text-base font-bold disabled:opacity-30"
                >
                  דלג
                </button>
                {/* Per-card direction flip — changes card_srs.direction in DB */}
                {cardSrs && (
                  <button
                    onClick={flipCardDirection}
                    title={
                      cardSrs.direction === "he_to_ar"
                        ? "חזרה יומית: ע→ת — לחץ לעבור לת→ע"
                        : "חזרה יומית: ת→ע — לחץ לעבור לע→ת"
                    }
                    className={`rounded-xl border px-4 py-4 text-sm font-bold transition-colors ${
                      cardSrs.direction === "ar_to_he"
                        ? "bg-purple-100 border-purple-300 text-purple-700 dark:bg-purple-900 dark:border-purple-600 dark:text-purple-300"
                        : "text-gray-500"
                    }`}
                  >
                    ↔
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
