import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Rating, type Grade } from "ts-fsrs";
import { App as CapApp } from "@capacitor/app";
import { strings } from "@/lib/strings";
import { dailyQueue, laterToday, type DeckCard } from "@/lib/daily-queue";
import * as store from "./store";
import { PAIRS } from "@/components/PronunciationGuide";
import { navGroups, primaryNav } from "@/lib/nav";
import { TabIcon } from "@/lib/nav-icons";

// The prompt hint: the first letter or two of the answer
function buildHint(word: string): string {
  const NIKUD = /[֑-ׇ]/;
  const baseLetters = [...word].filter((c) => !NIKUD.test(c)).length;
  const take = baseLetters <= 4 ? 1 : 2;
  let count = 0;
  let i = 0;
  while (i < word.length && count < take) {
    if (!NIKUD.test(word[i])) count++;
    i++;
  }
  while (i < word.length && NIKUD.test(word[i])) i++;
  return word.slice(0, i) + "…";
}

function timeAgo(iso: string | null): string {
  if (!iso) return "עוד לא";
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "עכשיו";
  if (min < 60) return `לפני ${min} דק׳`;
  const h = Math.round(min / 60);
  if (h < 24) return `לפני ${h} שע׳`;
  return new Date(iso).toLocaleDateString("he-IL");
}

type SyncState = "idle" | "syncing" | "offline";

export type ReviewMode = { kind: "daily" } | { kind: "all" } | { kind: "selected"; ids: string[] };

/**
 * The one daily review (docs/one-app.md, stage 4). It runs in three places:
 * the website's /review (`embedded`, inside the site's NavBar), the site's
 * offline page /app/ and the copy bundled in the iPhone app (standalone, with
 * the home screen and the same bottom tabs). The deck lives on the device and
 * grades sync through /api/mobile/*, so it works the same with or without a
 * network, and /review and /app/ share one deck (same origin, same storage).
 */
export default function App({
  embedded = false,
  mode = { kind: "daily" },
  adminSlot,
}: {
  embedded?: boolean;
  /** "all" and "selected" come from /browse; the daily queue is the default. */
  mode?: ReviewMode;
  /** Admin tools under the answer (the site passes the clip-range editor). */
  adminSlot?: (card: DeckCard, afterSave: () => void) => ReactNode;
} = {}) {
  const [snap, setSnap] = useState<store.Snapshot | null>(null);
  const [screen, setScreen] = useState<"home" | "review">(embedded ? "review" : "home");
  // all/selected: cards graded in this session leave the list (the daily
  // queue drops them by itself, through their new due date)
  const [gradedNow, setGradedNow] = useState<Set<string>>(() => new Set());
  const [selectedOrder] = useState(() => (mode.kind === "selected" ? shuffle(mode.ids) : []));
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [lastError, setLastError] = useState<string | null>(null);
  const [tick, setTick] = useState(0); // re-evaluates "due ≤ now" as time passes

  const refresh = useCallback(() => setSnap(store.snapshot()), []);

  const runSync = useCallback(async () => {
    setSyncState("syncing");
    const r = await store.sync();
    setSyncState(r.ok ? "idle" : "offline");
    setLastError(r.ok ? null : r.error ?? null);
    refresh();
  }, [refresh]);

  useEffect(() => {
    store.load().then(() => {
      refresh();
      runSync();
    });
    const onOnline = () => runSync();
    window.addEventListener("online", onOnline);
    const sub = CapApp.addListener("appStateChange", ({ isActive }) => {
      if (isActive) {
        setTick((t) => t + 1);
        runSync();
      }
    });
    const timer = setInterval(() => setTick((t) => t + 1), 30000);
    const off = store.onAudio(refresh);
    return () => {
      window.removeEventListener("online", onOnline);
      sub.then((s) => s.remove());
      clearInterval(timer);
      off();
    };
  }, [refresh, runSync]);

  const queue = useMemo(() => {
    if (!snap) return [];
    if (mode.kind === "daily") return dailyQueue(snap.cards, snap.reviews);
    // Easy today stays out in every mode (CLAUDE.md)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const easyToday = new Set(
      snap.reviews.filter((r) => r.rating === Rating.Easy && new Date(r.reviewed_at) >= startOfDay).map((r) => r.card_srs_id)
    );
    const open = (c: DeckCard) => !easyToday.has(c.card_srs_id) && !gradedNow.has(c.card_srs_id);
    if (mode.kind === "all")
      return snap.cards.filter(open).sort((a, b) => new Date(a.srs.due).getTime() - new Date(b.srs.due).getTime());
    const byId = new Map(snap.cards.map((c) => [c.card_srs_id, c]));
    return selectedOrder.map((id) => byId.get(id)).filter((c): c is DeckCard => !!c && open(c));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snap, tick, gradedNow]);

  const exit = () => (embedded ? (location.href = "/today") : setScreen("home"));

  let body: ReactNode;
  if (!snap || (embedded && !snap.hasDeck))
    body = (
      <div className="center muted">
        {snap && syncState === "offline" ? "צריך חיבור לאינטרנט פעם אחת כדי להוריד את הכרטיסים" : strings.common.loading}
      </div>
    );
  else if (screen === "review")
    body = (
      <Review
        queue={queue}
        cards={snap.cards}
        mode={mode}
        embedded={embedded}
        adminSlot={adminSlot && ((card) => adminSlot(card, () => void runSync()))}
        onGrade={async (card, rating) => {
          await store.grade(card, rating);
          if (mode.kind !== "daily") setGradedNow((g) => new Set(g).add(card.card_srs_id));
          refresh();
          void runSync();
        }}
        onExit={exit}
      />
    );
  else body = (
    <Home
      snap={snap}
      queueSize={queue.length}
      syncState={syncState}
      lastError={lastError}
      onStart={() => setScreen("review")}
      onSync={runSync}
    />
  );

  return (
    <div className={embedded ? "yc embedded" : "yc"}>
      {body}
      {!embedded && <TabBar onReview={() => setScreen("home")} />}
    </div>
  );
}

function shuffle<T>(list: T[]): T[] {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── home ─────────────────────────────────────────────────────────────────────

function Home({
  snap,
  queueSize,
  syncState,
  lastError,
  onStart,
  onSync,
}: {
  snap: store.Snapshot;
  queueSize: number;
  syncState: SyncState;
  lastError: string | null;
  onStart: () => void;
  onSync: () => void;
}) {
  return (
    <div className="page">
      <header className="brand">
        <TileStar className="brand-star" />
        <h1>יאללה</h1>
        <p className="muted">ערבית מדוברת — חזרה יומית</p>
      </header>

      {!snap.hasDeck ? (
        <div className="tile stack">
          <p className="big">צריך חיבור לאינטרנט פעם אחת</p>
          <p className="muted">כדי להוריד את הכרטיסים לטלפון. אחרי זה התרגול עובד גם בלי רשת.</p>
          <button className="btn primary" onClick={onSync} disabled={syncState === "syncing"}>
            {syncState === "syncing" ? "מוריד…" : "הורד כרטיסים"}
          </button>
          {lastError && <p className="error">אין חיבור לשרת ({lastError})</p>}
        </div>
      ) : (
        <>
          <div className="tile stack">
            <p className="muted">{strings.review.title}</p>
            <p className="count">
              <bdi>{queueSize}</bdi>
            </p>
            <p className="muted">{queueSize === 0 ? "אין כרטיסים לחזרה כרגע" : "כרטיסים מחכים לך"}</p>
            <button className="btn primary" onClick={onStart} disabled={queueSize === 0}>
              התחל תרגול
            </button>
          </div>

          <div className="status">
            <span className={`dot ${syncState}`} />
            <span>
              {syncState === "syncing"
                ? "מסנכרן…"
                : syncState === "offline"
                ? "אין חיבור — עובד אופליין"
                : `מסונכרן ${timeAgo(snap.syncedAt)}`}
            </span>
            {snap.pending.length > 0 && (
              <span className="badge">
                <bdi>{snap.pending.length}</bdi> ממתינים לשליחה
              </span>
            )}
            <button className="link" onClick={onSync} disabled={syncState === "syncing"}>
              סנכרן
            </button>
          </div>
          <p className="muted small">
            <bdi>{snap.cards.length}</bdi> כרטיסים שמורים
            {/* On the website the clips live in the service worker's cache, not counted here */}
            {store.native && (
              <>
                {" "}· <bdi>{store.audioCount()}</bdi> הקלטות
              </>
            )}
          </p>
        </>
      )}

    </div>
  );
}

// The offline review: what the site's service worker shows with no network
// (/app/), and the iPhone app's fallback before that worker exists (errorPath).
// Same bottom bar as the site (lib/nav.ts, lib/nav-icons.tsx, NavBar's sizes),
// so going offline doesn't look like another app. Its other tabs open the site,
// which comes back here while there is still no network.
function TabBar({ onReview }: { onReview: () => void }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const open = (href: string) => {
    location.href = `${store.API_BASE}${href}`;
  };
  return (
    <>
      {moreOpen && (
        <div className="sheet" role="dialog" aria-label="עוד">
          <button className="sheet-backdrop" aria-label="סגור" onClick={() => setMoreOpen(false)} />
          <div className="sheet-body">
            {navGroups.map((g) => (
              <section key={g.title}>
                <p className="muted group-title">{g.title}</p>
                <div className="menu-grid">
                  {g.links.map((l) => (
                    <button key={l.href} className="menu-item" onClick={() => open(l.href)}>
                      {l.label}
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
      <nav className="tabbar">
        {primaryNav.map((l) => (
          <button
            key={l.href}
            className={l.href === "/review" ? "active" : ""}
            onClick={() => (l.href === "/review" ? (setMoreOpen(false), onReview()) : open(l.href))}
          >
            <TabIcon href={l.href} />
            {l.label}
          </button>
        ))}
        <button className={moreOpen ? "active" : ""} onClick={() => setMoreOpen((o) => !o)}>
          <TabIcon href="more" />
          עוד
        </button>
      </nav>
    </>
  );
}

// ── review ───────────────────────────────────────────────────────────────────

function Review({
  queue,
  cards,
  mode,
  embedded,
  adminSlot,
  onGrade,
  onExit,
}: {
  queue: DeckCard[];
  cards: DeckCard[];
  mode: ReviewMode;
  embedded: boolean;
  adminSlot?: (card: DeckCard) => ReactNode;
  onGrade: (card: DeckCard, rating: Grade) => Promise<void>;
  onExit: () => void;
}) {
  // The web page reloads the queue after every grade and starts from its head;
  // the queue here is recomputed the same way, so the index only moves with ←/→
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [dirFlipped, setDirFlipped] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [grading, setGrading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const safeIndex = Math.min(index, Math.max(0, queue.length - 1));
  const current = queue[safeIndex];

  useEffect(() => {
    setAudioUrl(null);
    if (current) store.audioSrc(current).then(setAudioUrl);
  }, [current]);

  const reset = () => {
    setRevealed(false);
    setHintUsed(false);
  };

  async function grade(rating: Grade) {
    if (!current || grading) return;
    setGrading(true);
    await onGrade(current, rating);
    setIndex(0);
    reset();
    setGrading(false);
  }

  // On a computer: space shows the answer, 1–4 grade (1–2 only after the hint)
  const gradeRef = useRef(grade);
  gradeRef.current = grade;
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!current || (e.target as HTMLElement)?.closest("input, textarea")) return;
      if (e.key === " " && !revealed) {
        e.preventDefault();
        setRevealed(true);
        return;
      }
      if (!revealed) return;
      const keys: Record<string, Grade> = hintUsed
        ? { "1": Rating.Again, "2": Rating.Hard }
        : { "1": Rating.Again, "2": Rating.Hard, "3": Rating.Good, "4": Rating.Easy };
      if (keys[e.key]) void gradeRef.current(keys[e.key]);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [current, revealed, hintUsed]);

  if (!current) {
    const later = laterToday(cards).length;
    return (
      <div className="page center">
        <TileStar className="done-star star-in" />
        <h1>{strings.review.doneTitle}</h1>
        <p className="muted">
          {later > 0 ? `עוד ${later} כרטיסים יחזרו בהמשך היום` : strings.review.doneSubtitle}
        </p>
        <button className="btn primary" onClick={onExit}>
          {embedded ? "חזרה להיום" : "חזרה"}
        </button>
      </div>
    );
  }

  const dir: "he_to_ar" | "ar_to_he" = dirFlipped
    ? current.direction === "he_to_ar" ? "ar_to_he" : "he_to_ar"
    : current.direction;
  const audioOnlyPrompt = dir === "ar_to_he" && !!audioUrl;
  const play = () => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = 0;
    void a.play();
  };

  return (
    <div className="review">
      <div className="topbar">
        <button className="link close" onClick={onExit} aria-label="חזרה">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <span className="muted">
          <bdi>{queue.length - safeIndex}</bdi> {strings.review.remaining}
          {mode.kind === "all" && " · כל הכרטיסים"}
          {mode.kind === "selected" && " · נבחרו"}
        </span>
        <button
          className={`chip ${dirFlipped ? "on" : ""}`}
          onClick={() => {
            setDirFlipped((f) => !f);
            reset();
          }}
        >
          {dirFlipped ? "ת→ע" : "ע→ת"}
        </button>
        <button className={`chip ${guideOpen ? "on" : ""}`} onClick={() => setGuideOpen((o) => !o)}>
          הגייה
        </button>
      </div>
      {guideOpen && (
        // Same table as the website's review page (components/PronunciationGuide.tsx)
        <div className="guide" onClick={() => setGuideOpen(false)}>
          <p className="muted small">אותיות עם גרסה + גרש</p>
          <table>
            <thead>
              <tr><th>ללא גרש</th><th>עם גרש</th><th>ערבית</th><th>הגייה</th></tr>
            </thead>
            <tbody>
              {PAIRS.map((p) => (
                <tr key={p.geresh}>
                  <td className="nikud bold">{p.plain}</td>
                  <td className="nikud bold geresh">{p.geresh}</td>
                  <td className="ar">{p.arabic}</td>
                  <td className="muted">{p.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="tile card">
        {dir === "he_to_ar" ? (
          <p className="prompt nikud">{current.hebrew_meaning}</p>
        ) : audioOnlyPrompt ? (
          <AudioButton onClick={play} large />
        ) : (
          <p className="prompt nikud">{current.translit_nikud}</p>
        )}

        {revealed && (
          <div className="answer">
            {dir === "he_to_ar" ? (
              <>
                <p className="answer-main nikud">{current.translit_nikud}</p>
                {current.notes && <p className="muted">{current.notes}</p>}
              </>
            ) : audioOnlyPrompt ? (
              <>
                <p className="answer-main nikud bold">{current.translit_nikud}</p>
                <p className="answer-main nikud">{current.hebrew_meaning}</p>
              </>
            ) : (
              <p className="answer-main nikud">{current.hebrew_meaning}</p>
            )}
            {audioUrl && !audioOnlyPrompt && <AudioButton onClick={play} />}
            {adminSlot?.(current)}
          </div>
        )}
        {audioUrl && <audio ref={audioRef} src={audioUrl} preload="auto" />}
      </div>

      {!revealed ? (
        <div className="actions">
          {hintUsed && dir === "he_to_ar" && (
            <p className="hint nikud">רמז: {buildHint(current.translit_nikud.split(/\s+/)[0])}</p>
          )}
          <div className="row">
            {safeIndex > 0 && (
              <button className="btn side" onClick={() => { setIndex(safeIndex - 1); reset(); }} aria-label="מילה קודמת">
                ←
              </button>
            )}
            {!hintUsed && (
              <button className="btn side" onClick={() => setHintUsed(true)}>
                רמז
              </button>
            )}
            <button className="btn primary grow" onClick={() => setRevealed(true)}>
              {strings.review.showAnswer}
            </button>
            {safeIndex < queue.length - 1 && (
              <button className="btn side" onClick={() => { setIndex(safeIndex + 1); reset(); }} aria-label="מילה הבאה">
                →
              </button>
            )}
          </div>
        </div>
      ) : (
        // With the hint used, only שוב/קשה — as on the web page
        <div className={`grades ${hintUsed ? "two" : ""}`}>
          <button className="btn again" disabled={grading} onClick={() => grade(Rating.Again)}>{strings.review.again}</button>
          <button className="btn hard" disabled={grading} onClick={() => grade(Rating.Hard)}>{strings.review.hard}</button>
          {!hintUsed && (
            <>
              <button className="btn good" disabled={grading} onClick={() => grade(Rating.Good)}>{strings.review.good}</button>
              <button className="btn easy" disabled={grading} onClick={() => grade(Rating.Easy)}>{strings.review.easy}</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function AudioButton({ onClick, large = false }: { onClick: () => void; large?: boolean }) {
  return (
    <button className={`audio ${large ? "large" : ""}`} onClick={onClick} aria-label={strings.review.playAudio}>
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 9v6h4l5 5V4L7 9H3z" />
        <path d="M16.5 12a4.5 4.5 0 0 0-2.5-4.03v8.06A4.5 4.5 0 0 0 16.5 12z" />
        <path d="M14 4.35v2.1a7 7 0 0 1 0 11.1v2.1a9 9 0 0 0 0-15.3z" />
      </svg>
    </button>
  );
}

/** Eight-point star, as on the Old City tiles (same as the web app). */
function TileStar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2l2.6 4.2L19.1 4.9l-1.3 4.5L22 12l-4.2 2.6 1.3 4.5-4.5-1.3L12 22l-2.6-4.2-4.5 1.3 1.3-4.5L2 12l4.2-2.6-1.3-4.5 4.5 1.3z" />
      <circle cx="12" cy="12" r="3.2" fill="#fff" />
    </svg>
  );
}
