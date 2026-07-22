"use client";

import { useEffect, useRef, useState } from "react";

// ---- Types ----
type Resource = { name: string; url: string; note?: string };
type PlaylistGroup = { type: "playlist"; name: string; playlistId: string; note?: string };
type SectionItem = Resource | PlaylistGroup;
type Section = { title: string; emoji: string; items: SectionItem[] };
type Progress = { sec: number; dur: number };
type ProgressMap = Record<string, Progress>;

// ---- Data ----
const sections: Section[] = [
  {
    title: "סרטונים בערבית",
    emoji: "🎬",
    items: [
      { type: "playlist", name: "ג'ארכ קריבכ", playlistId: "PLKt8C3lDdAokazgysoWRjS8z1AzO510RC" },
      { name: "ג'ארכ קריבכ — סרטון בודד", url: "https://youtu.be/xLQcSu10pkE" },
      { type: "playlist", name: "סלם ותעלם", playlistId: "PLV2YW4LPjpJpnRiPu772xPc7EmZuprJQY" },
      { type: "playlist", name: "תעלם ותכלם", playlistId: "PLIr-4jfMHt_piGTK87hdY0UXxqPvKE6t6" },
      { type: "playlist", name: "סליחה על השאלה", playlistId: "PLLttfoK87AdXhODrYZOCru0BWV6vnWOpW" },
      { type: "playlist", name: "סליחה על השאלה 2", playlistId: "PL1QztFTkh_cfqN2OcYFrw1J8uj1i0TIV4" },
      { type: "playlist", name: "בלא מאאח'ד'ה", playlistId: "PL1QztFTkh_ccR6oXAsrrQ4OtQkhqHP4ve" },
      { name: "בנפע סאאל?", url: "https://youtube.com/shorts/rkqaLvOmBXg" },
      { type: "playlist", name: "אחכי ללכמירא", playlistId: "PL1QztFTkh_cd9_BLhjcYpAmGM_duyE39N" },
      { name: "אמי היא סבתי", url: "https://youtu.be/6GnMFeaTmtY" },
      { type: "playlist", name: "קצתי קצה", playlistId: "PL1QztFTkh_cftuKAmI0u31SxnIXobxpaa" },
      { type: "playlist", name: "מידיה של סבתי", playlistId: "PL1QztFTkh_ceWyvkhtRXCJQ3lVMhSM61E" },
    ],
  },
  {
    title: "סדרות בערבית",
    emoji: "📺",
    items: [
      { name: "בואו לאכול איתי", url: "https://www.kan.org.il/content/kan/kan-11/p-11843/", note: "כאן 11" },
      { name: "המסעדה הגדולה", url: "https://www.kan.org.il/content/archive1/vod/p-882497/", note: "כאן" },
      { type: "playlist", name: "קרוב רחוק – קרבה ע'רבה", playlistId: "PLLttfoK87AdVUConb7o7fVRjgqwhLnQFy" },
      { name: "דוקטור כראג'", url: "https://youtu.be/EsEtEb9w-ns" },
      { name: "התסריטאי", url: "https://www.kan.org.il/content/kan/kan-11/p-13835/", note: "כאן 11" },
      { name: "סאדה", url: "https://www.makan.org.il/content/makan/makan-tv/p-991014/%D8%AC%D9%85%D9%8A%D8%B9-%D8%A7%D9%84%D8%AD%D9%84%D9%82%D8%A7%D8%AA/994806/", note: "מכאן" },
    ],
  },
  {
    title: "סרטים",
    emoji: "🎥",
    items: [
      { name: "בית לחם", url: "https://youtu.be/DnqZHlbjO8M" },
      { name: "עג'מי", url: "https://youtu.be/HykbkPiPHE0" },
      { name: "ודיע עביד", url: "https://youtube.com/shorts/8vcgiX4yqPw" },
    ],
  },
  {
    title: "אתרים",
    emoji: "🌐",
    items: [
      { name: "Videos in Arabic", url: "https://videosinarabic.com/", note: "סרטונים עם כתוביות ותרגום בעברית" },
    ],
  },
  {
    title: "מוזיקה ואינסטגרם",
    emoji: "🎵",
    items: [
      { name: "פלייליסט ספוטיפיי", url: "https://open.spotify.com/playlist/5nxtGG6nozP8MVpCKZvu9r" },
      { name: "hanan_motran_", url: "https://www.instagram.com/hanan_motran_", note: "ילדה שמכינה אוכל, מדברת עברית וערבית" },
    ],
  },
];

// ---- YouTube URL parsing ----
function parseYTVideoId(url: string): string | null {
  const short = url.match(/youtu\.be\/([^?&/]+)/);
  if (short) return short[1];
  const shorts = url.match(/\/shorts\/([^?&/]+)/);
  if (shorts) return shorts[1];
  const watch = url.match(/[?&]v=([^&]+)/);
  if (watch) return watch[1];
  return null;
}

// ---- Progress storage ----
const STORAGE_KEY = "yc_content_progress";

function loadAllProgress(): ProgressMap {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"); }
  catch { return {}; }
}

function persistProgress(url: string, sec: number, dur: number) {
  const all = loadAllProgress();
  all[url] = { sec, dur };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

function getPct(p: Progress | undefined): number {
  if (!p?.dur) return 0;
  return Math.min(100, Math.round((p.sec / p.dur) * 100));
}

// ---- YouTube IFrame API singleton ----
let ytApiReady = false;
const ytWaiters: Array<() => void> = [];

function ensureYTApi(): Promise<void> {
  return new Promise((resolve) => {
    if (ytApiReady) { resolve(); return; }
    ytWaiters.push(resolve);
    if (document.querySelector('script[src*="youtube.com/iframe_api"]')) return;
    const prev = (window as unknown as Record<string, unknown>).onYouTubeIframeAPIReady as (() => void) | undefined;
    (window as unknown as Record<string, unknown>).onYouTubeIframeAPIReady = () => {
      prev?.();
      ytApiReady = true;
      ytWaiters.forEach((cb) => cb());
      ytWaiters.length = 0;
    };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(s);
  });
}

// ---- YouTubePlayer component ----
interface RawYTPlayer {
  getCurrentTime(): number;
  getDuration(): number;
  seekTo(s: number, allowSeek: boolean): void;
  destroy(): void;
}

function YouTubePlayer({
  url, initialSec, onProgress, onClose,
}: {
  url: string;
  initialSec: number;
  onProgress: (sec: number, dur: number) => void;
  onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<RawYTPlayer | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onProgressRef = useRef(onProgress);
  useEffect(() => { onProgressRef.current = onProgress; });

  const videoId = parseYTVideoId(url);

  function saveNow() {
    const p = playerRef.current;
    if (!p) return;
    try {
      const dur = p.getDuration();
      if (dur > 0) onProgressRef.current(p.getCurrentTime(), dur);
    } catch { /* player might be destroyed */ }
  }

  useEffect(() => {
    if (!videoId || !containerRef.current) return;
    let destroyed = false;

    ensureYTApi().then(() => {
      if (destroyed || !containerRef.current) return;
      const YTApi = (window as unknown as Record<string, unknown>).YT as {
        Player: new (el: HTMLElement, opts: Record<string, unknown>) => RawYTPlayer;
      };

      playerRef.current = new YTApi.Player(containerRef.current, {
        height: "100%",
        width: "100%",
        videoId,
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: (e: { target: RawYTPlayer }) => {
            if (initialSec > 3) e.target.seekTo(initialSec, true);
          },
          onStateChange: (e: { data: number }) => {
            if (e.data === 1) {
              if (!timerRef.current) timerRef.current = setInterval(saveNow, 5000);
            } else {
              if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
              saveNow();
            }
          },
        },
      });
    });

    return () => {
      destroyed = true;
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      saveNow();
      try { playerRef.current?.destroy(); } catch { /* ignore */ }
    };
  }, [url]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!videoId) return null;

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 mt-1.5 mb-2 shadow-sm">
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-900 text-white text-xs">
        <span className="text-gray-400">▶ סרטון</span>
        <button onClick={() => { saveNow(); onClose(); }} className="hover:text-gray-300 transition-colors px-1">
          ✕ סגור
        </button>
      </div>
      <div className="relative bg-black" style={{ paddingBottom: "56.25%", height: 0 }}>
        <div ref={containerRef} className="absolute inset-0 w-full h-full" />
      </div>
    </div>
  );
}

// ---- Progress indicator ----
function ProgressBadge({ value }: { value: number }) {
  if (value === 0) return null;
  const done = value >= 95;
  return (
    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${done ? "bg-green-100 text-green-700" : "bg-blue-50 text-blue-600"}`}>
      {done ? "✓" : `${value}%`}
    </span>
  );
}

function ExternalLinkIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-40 shrink-0">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

// ---- Single resource row (video or external link) ----
function ResourceRow({
  item, progressMap, expandedUrl, onExpand, onProgress, indent,
}: {
  item: Resource;
  progressMap: ProgressMap;
  expandedUrl: string | null;
  onExpand: (url: string | null) => void;
  onProgress: (url: string, sec: number, dur: number) => void;
  indent?: boolean;
}) {
  const isYT = !!parseYTVideoId(item.url);
  const p = progressMap[item.url];
  const percentage = getPct(p);
  const isExpanded = expandedUrl === item.url;

  function handleClick() {
    if (isYT) {
      onExpand(isExpanded ? null : item.url);
    } else {
      window.open(item.url, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div className={indent ? "mr-4 border-r border-gray-100 pr-2" : ""}>
      <button
        onClick={handleClick}
        className={`relative w-full flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 transition-colors text-right overflow-hidden ${
          isExpanded ? "bg-gray-50 border-gray-300" : "hover:bg-gray-50 border-gray-200"
        }`}
      >
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <span className="font-medium text-sm truncate">{item.name}</span>
          {item.note && <span className="text-xs text-gray-400">{item.note}</span>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {percentage > 0 && <ProgressBadge value={percentage} />}
          {isYT ? (
            <span className="text-gray-400 text-xs w-3 text-center">{isExpanded ? "▲" : "▶"}</span>
          ) : (
            <ExternalLinkIcon />
          )}
        </div>
        {percentage > 0 && (
          <div
            className={`absolute bottom-0 right-0 h-0.5 transition-all ${percentage >= 95 ? "bg-green-500" : "bg-blue-400"}`}
            style={{ width: `${percentage}%` }}
          />
        )}
      </button>
      {isExpanded && (
        <YouTubePlayer
          url={item.url}
          initialSec={p?.sec ?? 0}
          onProgress={(sec, dur) => onProgress(item.url, sec, dur)}
          onClose={() => onExpand(null)}
        />
      )}
    </div>
  );
}

// ---- Playlist group row ----
function PlaylistGroupRow({
  group, progressMap, expandedUrl, onExpand, onProgress,
}: {
  group: PlaylistGroup;
  progressMap: ProgressMap;
  expandedUrl: string | null;
  onExpand: (url: string | null) => void;
  onProgress: (url: string, sec: number, dur: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [videos, setVideos] = useState<Resource[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && videos === null && !loading) {
      setLoading(true);
      setError(null);
      try {
        const data = await fetch(`/api/content/playlist?id=${group.playlistId}`).then((r) => r.json());
        if (data.error) throw new Error(data.error);
        setVideos(data.videos ?? []);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Aggregate progress across all loaded videos
  const totalPct = videos
    ? (() => {
        const finished = videos.filter((v) => getPct(progressMap[v.url]) >= 95).length;
        return videos.length > 0 ? Math.round((finished / videos.length) * 100) : 0;
      })()
    : 0;

  return (
    <div>
      <button
        onClick={toggle}
        className={`w-full flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 transition-colors text-right ${
          open ? "bg-gray-50 border-gray-300" : "hover:bg-gray-50 border-gray-200"
        }`}
      >
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <span className="font-medium text-sm truncate">{group.name}</span>
          {group.note && <span className="text-xs text-gray-400">{group.note}</span>}
          {videos && (
            <span className="text-xs text-gray-400">{videos.length} סרטונים</span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {totalPct > 0 && <ProgressBadge value={totalPct} />}
          <span className="text-gray-400 text-xs">
            {open ? "▲" : "📋"}
          </span>
        </div>
      </button>

      {open && (
        <div className="mt-1.5 flex flex-col gap-1.5">
          {loading && (
            <p className="text-xs text-gray-400 px-3 py-2">טוען סרטונים...</p>
          )}
          {error && (
            <p className="text-xs text-red-500 px-3 py-2">{error}</p>
          )}
          {videos?.map((video) => (
            <ResourceRow
              key={video.url}
              item={video}
              progressMap={progressMap}
              expandedUrl={expandedUrl}
              onExpand={onExpand}
              onProgress={onProgress}
              indent
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Main page ----
export default function ContentPage() {
  const [progressMap, setProgressMap] = useState<ProgressMap>({});
  const [expandedUrl, setExpandedUrl] = useState<string | null>(null);

  useEffect(() => {
    setProgressMap(loadAllProgress());
  }, []);

  function handleProgress(url: string, sec: number, dur: number) {
    persistProgress(url, sec, dur);
    setProgressMap(loadAllProgress());
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-8" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold">תכנים לצפייה ולהאזנה</h1>
        <p className="text-sm text-gray-500 mt-1">המלצות R.D לחשיפה לערבית פלסטינית מדוברת</p>
      </div>

      {sections.map((section) => (
        <section key={section.title} className="flex flex-col gap-3">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <span>{section.emoji}</span>
            <span>{section.title}</span>
          </h2>
          <div className="flex flex-col gap-1.5">
            {section.items.map((item, i) =>
              "type" in item && item.type === "playlist" ? (
                <PlaylistGroupRow
                  key={item.playlistId}
                  group={item}
                  progressMap={progressMap}
                  expandedUrl={expandedUrl}
                  onExpand={setExpandedUrl}
                  onProgress={handleProgress}
                />
              ) : (
                <ResourceRow
                  key={(item as Resource).url ?? i}
                  item={item as Resource}
                  progressMap={progressMap}
                  expandedUrl={expandedUrl}
                  onExpand={setExpandedUrl}
                  onProgress={handleProgress}
                />
              )
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
