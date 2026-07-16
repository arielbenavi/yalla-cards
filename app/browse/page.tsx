"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { strings } from "@/lib/strings";

type BrowseCard = {
  id: string;
  hebrew_meaning: string;
  translit_nikud: string;
  arabic_script: string | null;
  item_type: string;
  notes: string | null;
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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/lessons")
      .then((r) => r.json())
      .then((d) => setLessons(d.lessons ?? []));
  }, []);

  const search = useCallback(
    async (query: string, lesson: string, type: string) => {
      setLoading(true);
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (lesson) params.set("lesson_id", lesson);
      if (type) params.set("item_type", type);
      const data = await fetch(`/api/browse?${params}`).then((r) => r.json());
      setCards(data.cards ?? []);
      setLoading(false);
    },
    []
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      search(q, lessonId, itemType);
    }, 300);
  }, [q, lessonId, itemType, search]);

  function playAudio(url: string) {
    if (!audioRef.current) return;
    audioRef.current.src = url;
    audioRef.current.currentTime = 0;
    audioRef.current.play();
  }

  return (
    <div className="flex flex-col gap-4 p-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">{strings.browse.title}</h1>
        <Link
          href="/review?mode=all"
          className="shrink-0 rounded-xl bg-black px-4 py-2 text-sm font-bold text-white"
        >
          תרגול על הכל
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={strings.browse.searchPlaceholder}
          className="flex-1 border rounded px-3 py-2 nikud-text"
        />
        <select
          value={lessonId}
          onChange={(e) => setLessonId(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">{strings.browse.filterLesson}</option>
          {lessons.map((l) => (
            <option key={l.id} value={l.id}>
              {l.title || l.date}
            </option>
          ))}
        </select>
        <select
          value={itemType}
          onChange={(e) => setItemType(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">{strings.browse.filterTypeAll}</option>
          <option value="word">מילה</option>
          <option value="phrase">ביטוי</option>
          <option value="sentence">משפט</option>
        </select>
      </div>

      <audio ref={audioRef} className="hidden" />

      {loading ? (
        <p className="text-gray-500">{strings.common.loading}</p>
      ) : cards.length === 0 ? (
        <p className="text-gray-500">{strings.browse.noResults}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {cards.map((card) => (
            <div key={card.id} className="flex items-start gap-3 border rounded p-3">
              <div className="flex-1 flex flex-col gap-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold nikud-text text-lg">{card.translit_nikud}</span>
                  <span className="text-gray-400">—</span>
                  <span className="nikud-text">{card.hebrew_meaning}</span>
                </div>
                {card.arabic_script && (
                  <span className="text-base text-gray-600">{card.arabic_script}</span>
                )}
                {card.notes && (
                  <span className="text-sm text-gray-500 nikud-text">{card.notes}</span>
                )}
                {card.lessons && (
                  <span className="text-xs text-gray-400">
                    {card.lessons.title || card.lessons.date}
                  </span>
                )}
              </div>
              {card.audio_url && (
                <button
                  onClick={() => playAudio(card.audio_url!)}
                  aria-label={strings.browse.playAudio}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white shrink-0"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
