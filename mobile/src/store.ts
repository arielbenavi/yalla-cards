// Everything the iPhone app keeps on the phone, and the sync with the server.
//
// On the phone:
//   deck.json     the deck with its FSRS state as the server last sent it
//   pending.json  grades made since then, not yet confirmed by a fresh deck
//   audio/…       the card clips, so audio plays with no network
//
// What the screen shows is deck.json with pending.json replayed on top, through
// the same scheduleReview the server uses. When the phone is online the pending
// grades go up to /api/mobile/sync (which schedules them again, server side,
// with the time they were made), then a fresh deck comes down and replaces the
// local one. A grade leaves pending.json only once a deck fetched after its sync
// has arrived, so a dropped connection between the two never loses one —
// re-sending it is harmless, the server recognises it.
import { Capacitor, CapacitorHttp } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import type { Grade } from "ts-fsrs";
import { scheduleReview, type CardSrsRow } from "@/lib/fsrs";
import type { DeckCard, ReviewEvent } from "@/lib/daily-queue";

declare const __API_BASE__: string;
declare const __DRY_RUN__: boolean;
export const API_BASE = __API_BASE__;

export type Pending = ReviewEvent & { rating: Grade };

type Deck = { generated_at: string; cards: DeckCard[]; reviews: ReviewEvent[]; audio: Record<string, string> };

const native = Capacitor.isNativePlatform();

// ── files ────────────────────────────────────────────────────────────────────

async function readJson<T>(name: string): Promise<T | null> {
  try {
    if (!native) {
      const raw = localStorage.getItem(name);
      return raw ? (JSON.parse(raw) as T) : null;
    }
    const { data } = await Filesystem.readFile({ path: name, directory: Directory.Data, encoding: Encoding.UTF8 });
    return JSON.parse(data as string) as T;
  } catch {
    return null;
  }
}

async function writeJson(name: string, value: unknown) {
  const data = JSON.stringify(value);
  if (!native) {
    localStorage.setItem(name, data);
    return;
  }
  // Write then rename, so a crash mid-write leaves the previous file whole
  await Filesystem.writeFile({ path: `${name}.tmp`, data, directory: Directory.Data, encoding: Encoding.UTF8 });
  await Filesystem.rename({ from: `${name}.tmp`, to: name, directory: Directory.Data, toDirectory: Directory.Data });
}

// ── state ────────────────────────────────────────────────────────────────────

export type Snapshot = {
  cards: DeckCard[];
  reviews: ReviewEvent[];
  pending: Pending[];
  syncedAt: string | null;
  hasDeck: boolean;
};

let deck: Deck | null = null;
let pending: Pending[] = [];
let syncedAt: string | null = null;
let audioFiles: Record<string, string> = {}; // clip key → file name under audio/

function rowOf(c: DeckCard): CardSrsRow {
  return { id: c.card_srs_id, card_id: c.card_id, direction: c.direction, ...c.srs };
}

/** The deck as it stands on the phone: the server's deck plus the grades not yet confirmed. */
function localCards(): DeckCard[] {
  if (!deck) return [];
  const byId = new Map(deck.cards.map((c) => [c.card_srs_id, { ...c, srs: { ...c.srs } }]));
  for (const p of pending) {
    const c = byId.get(p.card_srs_id);
    if (!c) continue;
    // Already in this deck (synced before the deck was fetched): don't count it twice
    if (c.srs.last_review && new Date(c.srs.last_review).getTime() >= new Date(p.reviewed_at).getTime()) continue;
    c.srs = { ...c.srs, ...scheduleReview(rowOf(c), p.rating, new Date(p.reviewed_at)).cardUpdate };
  }
  return [...byId.values()];
}

export function snapshot(): Snapshot {
  const serverReviews = deck?.reviews ?? [];
  const known = new Set(serverReviews.map((r) => `${r.card_srs_id}|${new Date(r.reviewed_at).getTime()}`));
  const extra = pending.filter((p) => !known.has(`${p.card_srs_id}|${new Date(p.reviewed_at).getTime()}`));
  return {
    cards: localCards(),
    reviews: [...serverReviews, ...extra],
    pending,
    syncedAt,
    hasDeck: !!deck,
  };
}

export async function load() {
  const [d, p, meta, a] = await Promise.all([
    readJson<Deck>("deck.json"),
    readJson<Pending[]>("pending.json"),
    readJson<{ syncedAt: string | null }>("meta.json"),
    readJson<Record<string, string>>("audio-index.json"),
  ]);
  deck = d;
  pending = p ?? [];
  syncedAt = meta?.syncedAt ?? null;
  audioFiles = a ?? {};
}

/** Records a grade on the phone. Saved before it returns, so it survives the app being killed. */
export async function grade(card: DeckCard, rating: Grade) {
  const local = localCards().find((c) => c.card_srs_id === card.card_srs_id) ?? card;
  pending = [
    ...pending,
    { card_srs_id: card.card_srs_id, rating, state: local.srs.state, reviewed_at: new Date().toISOString() },
  ];
  await writeJson("pending.json", pending);
}

// ── sync ─────────────────────────────────────────────────────────────────────

async function http<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  // CapacitorHttp goes through iOS networking: no CORS, and it fails fast offline
  const res = native
    ? await CapacitorHttp.request({
        method,
        url: `${API_BASE}${path}`,
        headers: { "Content-Type": "application/json" },
        data: body,
        connectTimeout: 15000,
        readTimeout: 60000,
      })
    : await fetch(`${API_BASE}${path}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      }).then(async (r) => ({ status: r.status, data: await r.json() }));
  if (res.status >= 400) throw new Error(`${path}: ${res.status}`);
  return (typeof res.data === "string" ? JSON.parse(res.data) : res.data) as T;
}

let running: Promise<SyncResult> | null = null;
export type SyncResult = { ok: boolean; sent: number; error?: string };

/** Sends pending grades, then fetches a fresh deck. Safe to call any time; concurrent calls share one run. */
export function sync(): Promise<SyncResult> {
  running ??= doSync().finally(() => (running = null));
  return running;
}

async function doSync(): Promise<SyncResult> {
  const sending = pending.slice();
  try {
    for (let i = 0; i < sending.length; i += 50) {
      const chunk = sending.slice(i, i + 50).map(({ card_srs_id, rating, reviewed_at }) => ({ card_srs_id, rating, reviewed_at }));
      await http("POST", "/api/mobile/sync", { reviews: chunk, dry_run: __DRY_RUN__ });
    }
    const fresh = await http<Deck>("GET", "/api/mobile/deck");
    deck = fresh;
    // Grades made while this sync ran stay pending for the next one
    const sent = new Set(sending);
    pending = __DRY_RUN__ ? pending : pending.filter((p) => !sent.has(p));
    syncedAt = new Date().toISOString();
    await writeJson("deck.json", deck);
    await writeJson("pending.json", pending);
    await writeJson("meta.json", { syncedAt });
    void cacheAudio(fresh);
    return { ok: true, sent: sending.length };
  } catch (e) {
    return { ok: false, sent: 0, error: e instanceof Error ? e.message : String(e) };
  }
}

// ── audio ────────────────────────────────────────────────────────────────────

// A re-cut clip keeps its path but changes its range, so both are in the key
const clipKey = (c: Pick<DeckCard, "clip_path" | "audio_start_sec" | "audio_end_sec">) =>
  `${c.clip_path}|${c.audio_start_sec ?? ""}|${c.audio_end_sec ?? ""}`;

const audioListeners = new Set<() => void>();
/** Called as clips land, so the count on the home screen moves. */
export function onAudio(fn: () => void) {
  audioListeners.add(fn);
  return () => void audioListeners.delete(fn);
}

let audioBusy = false;
async function cacheAudio(d: Deck) {
  if (!native || audioBusy) return;
  audioBusy = true;
  try {
    const wanted = d.cards.filter((c) => c.clip_path && !audioFiles[clipKey(c)] && d.audio[c.clip_path]);
    for (const c of wanted) {
      try {
        const res = await CapacitorHttp.get({ url: d.audio[c.clip_path!], responseType: "blob" });
        if (res.status >= 400 || typeof res.data !== "string") continue;
        const name = `${c.card_srs_id}-${Date.now()}.mp3`;
        await Filesystem.writeFile({ path: `audio/${name}`, data: res.data, directory: Directory.Data, recursive: true });
        audioFiles[clipKey(c)] = name;
        await writeJson("audio-index.json", audioFiles);
        audioListeners.forEach((fn) => fn());
      } catch {
        // Next sync tries again
      }
    }
  } finally {
    audioBusy = false;
  }
}

const uriCache = new Map<string, string>();
/** A playable address for the card's clip: the copy on the phone, else the server's link, else null. */
export async function audioSrc(c: DeckCard): Promise<string | null> {
  if (!c.clip_path) return null;
  const file = audioFiles[clipKey(c)];
  if (native && file) {
    if (!uriCache.has(file)) {
      const { uri } = await Filesystem.getUri({ path: `audio/${file}`, directory: Directory.Data });
      uriCache.set(file, Capacitor.convertFileSrc(uri));
    }
    return uriCache.get(file)!;
  }
  return deck?.audio[c.clip_path] ?? null;
}

export const audioCount = () => Object.keys(audioFiles).length;
