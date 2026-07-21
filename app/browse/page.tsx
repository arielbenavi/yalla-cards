"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { strings } from "@/lib/strings";
import { PronunciationGuide } from "@/components/PronunciationGuide";

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
  const router = useRouter();
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
  const [selectMode, setSelectMode] = useState(false);
  const [listMode, setListMode] = useState(false);
  const [selectedSrsIds, setSelectedSrsIds] = useState<Set<string>>(new Set());
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [markedWords, setMarkedWords] = useState<Set<number>>(new Set());
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

  // A filter is "active" when any filter field is set
  const filterActive = !!(q || lessonId || itemType || scoreFilter);

  function next() {
    setIndex((i) => Math.min(i + 1, cards.length - 1));
    setRevealed(false);
    setMarkedWords(new Set());
  }

  function prev() {
    setIndex((i) => Math.max(i - 1, 0));
    setRevealed(false);
    setMarkedWords(new Set());
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
    setMarkedWords(new Set());
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

  /** Toggle ar_to_he card_srs row for a card in the list view. */
  async function toggleArToHe(card: BrowseCard) {
    if (togglingIds.has(card.id)) return;
    const arToHeRow = card.card_srs?.find((s) => s.direction === "ar_to_he") ?? null;

    setTogglingIds((prev) => new Set(prev).add(card.id));
    try {
      if (arToHeRow) {
        // Remove: DELETE the ar_to_he card_srs row (review_logs cascade-delete via FK)
        const res = await fetch(`/api/card-srs/${arToHeRow.id}`, { method: "DELETE" });
        if (res.ok) {
          setCards((prev) =>
            prev.map((c) =>
              c.id === card.id
                ? { ...c, card_srs: (c.card_srs ?? []).filter((s) => s.direction !== "ar_to_he") }
                : c
            )
          );
        }
      } else {
        // Add: POST to create ar_to_he row with default FSRS values
        const res = await fetch("/api/card-srs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ card_id: card.id, direction: "ar_to_he" }),
        });
        const data = await res.json();
        if (data.card_srs) {
          setCards((prev) =>
            prev.map((c) =>
              c.id === card.id
                ? { ...c, card_srs: [...(c.card_srs ?? []), data.card_srs as CardSrs] }
                : c
            )
          );
        }
      }
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(card.id);
        return next;
      });
    }
  }

  /** Bulk-enable ar_to_he for all currently filtered cards. */
  async function bulkEnableArToHe() {
    setBulkLoading(true);
    try {
      await fetch("/api/card-srs/bulk-ar-to-he", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ card_ids: cards.map((c) => c.id) }),
      });
      // Reload to reflect updated card_srs rows
      await search(q, lessonId, itemType, scoreFilter);
    } finally {
      setBulkLoading(false);
    }
  }

  const dotColor = current?.self_score != null ? SCORE_DOT_COLORS[current.self_score - 1] : null;

  function toggleSelect(srsId: string) {
    setSelectedSrsIds((prev) => {
      const next = new Set(prev);
      if (next.has(srsId)) next.delete(srsId);
      else next.add(srsId);
      return next;
    });
  }

  function startSelectedReview() {
    const ids = Array.from(selectedSrsIds).join(",");
    router.push(`/review?mode=selected&ids=${ids}`);
  }

  function enterSelectMode() {
    setSelectMode(true);
    setListMode(false);
    setSelectedSrsIds(new Set());
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelectedSrsIds(new Set());
  }

  function toggleListMode() {
    setListMode((m) => !m);
    setSelectMode(false);
  }

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
        {!selectMode && !listMode && (
          <button
            onClick={() => setDirFlipped((f) => !f)}
            className={`border rounded px-3 py-2 text-sm font-medium transition-colors ${
              dirFlipped ? "bg-black text-white border-black" : "text-gray-600"
            }`}
            title={dirFlipped ? "שאלה: תעתיק — לחץ להחזיר לעברית" : "שאלה: עברית — לחץ להחזיר תעתיק"}
          >
            {dirFlipped ? "ת→ע" : "ע→ת"}
          </button>
        )}
        {/* List-mode toggle */}
        <button
          onClick={toggleListMode}
          className={`border rounded px-3 py-2 text-sm font-medium transition-colors ${
            listMode ? "bg-black text-white border-black" : "text-gray-600"
          }`}
          title="תצוגת רשימה עם הפעלת ערבית→עברית"
        >
          רשימה
        </button>
        {selectMode ? (
          <button onClick={exitSelectMode} className="border rounded px-3 py-2 text-sm text-gray-600">
            בטל
          </button>
        ) : !listMode ? (
          <button onClick={enterSelectMode} className="border rounded px-3 py-2 text-sm text-gray-600">
            בחר
          </button>
        ) : null}
        <PronunciationGuide />
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
      ) : listMode ? (
        /* ── ar_to_he list view ── */
        <div className="flex flex-col flex-1 gap-2 overflow-hidden">
          <div className="text-sm text-gray-500 text-center">{cards.length} כרטיסים</div>
          <div className="flex-1 overflow-y-auto divide-y border rounded-xl">
            {cards.map((card) => {
              const arToHeRow = card.card_srs?.find((s) => s.direction === "ar_to_he") ?? null;
              const isOn = arToHeRow !== null;
              const isToggling = togglingIds.has(card.id);
              return (
                <div key={card.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="flex-1 min-w-0">
                    <span className="block font-medium nikud-text text-sm leading-tight">{card.hebrew_meaning}</span>
                    <span className="block text-xs text-gray-500 nikud-text truncate">{card.translit_nikud}</span>
                  </span>
                  {card.self_score != null && (
                    <span className={`h-2 w-2 rounded-full flex-shrink-0 ${SCORE_DOT_COLORS[card.self_score - 1]}`} />
                  )}
                  {/* ar_to_he toggle switch */}
                  <button
                    role="switch"
                    aria-checked={isOn}
                    aria-label="תרגול ערבית→עברית"
                    data-testid="ar-to-he-toggle"
                    disabled={isToggling}
                    onClick={() => toggleArToHe(card)}
                    className={`relative flex-shrink-0 inline-flex h-6 w-11 items-center rounded-full border-2 transition-colors focus:outline-none disabled:opacity-50 ${
                      isOn
                        ? "bg-purple-600 border-purple-600"
                        : "bg-gray-200 border-gray-200 dark:bg-gray-700 dark:border-gray-700"
                    }`}
                    title={isOn ? "ביטול תרגול ערבית→עברית" : "הפעל תרגול ערבית→עברית"}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        isOn ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                    {isToggling && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
          {/* Bulk action: visible only when a filter is active */}
          {filterActive && (
            <button
              onClick={bulkEnableArToHe}
              disabled={bulkLoading}
              className="w-full rounded-xl bg-purple-600 py-4 text-base font-bold text-white disabled:opacity-50"
            >
              {bulkLoading ? "מפעיל…" : `הפעל לכל המסוננים (${cards.length})`}
            </button>
          )}
        </div>
      ) : selectMode ? (
        /* ── Selection list view ── */
        <div className="flex flex-col flex-1 gap-2 overflow-hidden">
          <div className="text-sm text-gray-500 text-center">
            {selectedSrsIds.size > 0 ? `${selectedSrsIds.size} נבחרו מתוך ${cards.length}` : `${cards.length} כרטיסים`}
          </div>
          <div className="flex-1 overflow-y-auto divide-y border rounded-xl">
            {cards.map((card) => {
              const srsId = card.card_srs?.[0]?.id;
              const checked = srsId ? selectedSrsIds.has(srsId) : false;
              return (
                <label
                  key={card.id}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                    checked ? "bg-purple-50 dark:bg-purple-950" : "hover:bg-gray-50 dark:hover:bg-gray-900"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={!srsId}
                    onChange={() => srsId && toggleSelect(srsId)}
                    className="h-4 w-4 accent-purple-600 flex-shrink-0"
                  />
                  <span className="flex-1 min-w-0">
                    <span className="block font-medium nikud-text text-sm leading-tight">{card.hebrew_meaning}</span>
                    <span className="block text-xs text-gray-500 nikud-text truncate">{card.translit_nikud}</span>
                  </span>
                  {card.self_score != null && (
                    <span className={`h-2 w-2 rounded-full flex-shrink-0 ${SCORE_DOT_COLORS[card.self_score - 1]}`} />
                  )}
                </label>
              );
            })}
          </div>
          {selectedSrsIds.size > 0 && (
            <button
              onClick={startSelectedReview}
              className="w-full rounded-xl bg-purple-600 py-4 text-lg font-bold text-white"
            >
              התחל חזרה ({selectedSrsIds.size})
            </button>
          )}
        </div>
      ) : (
        /* ── Flip-card view ── */
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
                    {(current.item_type === "phrase" || current.item_type === "sentence") ? (
                      <div className="flex flex-wrap gap-1.5 justify-center max-w-xs">
                        {current.translit_nikud.split(/\s+/).map((word, wi) => (
                          <button
                            key={wi}
                            onClick={() => setMarkedWords((prev) => {
                              const next = new Set(prev);
                              if (next.has(wi)) next.delete(wi); else next.add(wi);
                              return next;
                            })}
                            className={`px-2 py-1 rounded-md text-lg nikud-text font-medium transition-colors border ${
                              markedWords.has(wi)
                                ? "bg-red-50 text-red-700 border-red-300"
                                : "bg-green-50 text-green-700 border-green-200"
                            }`}
                          >
                            {word}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-2xl nikud-text">{current.translit_nikud}</p>
                    )}
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
                  className="flex-1 rounded-lg border py-2 text-sm text-gray-500 disabled:opacity-30"
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
