"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { strings } from "@/lib/strings";

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
  lessons: { title: string | null; date: string } | null;
};

type Lesson = { id: string; date: string; title: string | null };

export default function BrowsePage() {
  const [cards, setCards] = useState<BrowseCard[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [q, setQ] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [itemType, setItemType] = useState("");
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/lessons")
      .then((r) => r.json())
      .then((d) => setLessons(d.lessons ?? []));
  }, []);

  const search = useCallback(async (query: string, lesson: string, type: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (lesson) params.set("lesson_id", lesson);
    if (type) params.set("item_type", type);
    const data = await fetch(`/api/browse?${params}`).then((r) => r.json());
    setCards(data.cards ?? []);
    setIndex(0);
    setRevealed(false);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      search(q, lessonId, itemType);
    }, 300);
  }, [q, lessonId, itemType, search]);

  const current = cards[index];

  function next() {
    setIndex((i) => Math.min(i + 1, cards.length - 1));
    setRevealed(false);
  }

  function prev() {
    setIndex((i) => Math.max(i - 1, 0));
    setRevealed(false);
  }

  function playAudio(url: string) {
    if (!audioRef.current) return;
    audioRef.current.src = url;
    audioRef.current.currentTime = 0;
    audioRef.current.play();
  }

  return (
    <div className="flex flex-col flex-1 p-4 gap-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] max-w-3xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={strings.browse.searchPlaceholder}
          className="flex-1 border rounded px-3 py-2 nikud-text"
        />
        <select value={lessonId} onChange={(e) => setLessonId(e.target.value)} className="border rounded px-3 py-2">
          <option value="">{strings.browse.filterLesson}</option>
          {lessons.map((l) => (
            <option key={l.id} value={l.id}>{l.title || l.date}</option>
          ))}
        </select>
        <select value={itemType} onChange={(e) => setItemType(e.target.value)} className="border rounded px-3 py-2">
          <option value="">{strings.browse.filterTypeAll}</option>
          <option value="word">מילה</option>
          <option value="phrase">ביטוי</option>
          <option value="sentence">משפט</option>
        </select>
      </div>

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
            <p className="text-3xl font-bold nikud-text">{current.hebrew_meaning}</p>

            {revealed && (
              <div className="flex flex-col items-center gap-3">
                <p className="text-2xl nikud-text">{current.translit_nikud}</p>
                {current.plural_form && (
                  <p className="text-base text-gray-500 nikud-text">
                    <span className="text-gray-400 text-sm">ר׳ </span>{current.plural_form}
                  </p>
                )}
                {current.arabic_script && (
                  <p className="text-xl text-gray-600">{current.arabic_script}</p>
                )}
                {current.notes && (
                  <p className="text-base text-gray-500 nikud-text">{current.notes}</p>
                )}
                {current.audio_url && (
                  <button
                    onClick={() => playAudio(current.audio_url!)}
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
            <div className="flex gap-2">
              <button
                onClick={prev}
                disabled={index === 0}
                className="rounded-xl border py-5 text-lg font-bold disabled:opacity-30 px-6"
              >
                ←
              </button>
              <button
                onClick={next}
                disabled={index === cards.length - 1}
                className="flex-1 rounded-xl bg-black py-5 text-lg font-bold text-white"
              >
                הבא
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
