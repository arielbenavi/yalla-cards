// Offline for the website (installed from Safari: Share → Add to Home Screen).
//
// The offline daily review is the iPhone app's own web layer, built into
// /app/ (mobile/build.mjs --web): it keeps the deck in the browser and syncs
// grades through /api/mobile/*. This worker keeps that copy, and when any page
// cannot load because there is no network, it shows the review instead of an
// error. Everything else goes to the network as before.
//
// Card audio comes from Supabase storage behind signed links whose token
// changes on every sync, so clips are kept under their path alone.

const SHELL = "yalla-shell-v1";
const AUDIO = "yalla-audio-v1";
const APP = ["/app/index.html", "/app/app.js", "/app/app.css", "/app/fonts/plex-hebrew-400.woff2", "/app/fonts/plex-hebrew-700.woff2"];

async function cacheShell() {
  const cache = await caches.open(SHELL);
  for (const url of APP) {
    // Not logged in, the request lands on /login — never keep that as the app
    const res = await fetch(url, { cache: "no-store" }).catch(() => null);
    if (res && res.ok && !res.redirected) await cache.put(url, res);
  }
}

self.addEventListener("install", (e) => {
  e.waitUntil(cacheShell().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL && k !== AUDIO).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const audioKey = (url) => url.origin + url.pathname;

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Clips: the copy we have, else the network (and keep it)
  if (url.pathname.includes("/storage/v1/object/sign/recordings/")) {
    e.respondWith(
      caches.open(AUDIO).then(async (cache) => {
        const hit = await cache.match(audioKey(url));
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) await cache.put(audioKey(url), res.clone());
        return res;
      })
    );
    return;
  }

  if (url.origin !== location.origin) return;

  // The offline app's own files: network first so updates arrive, cache when offline
  if (url.pathname.startsWith("/app/")) {
    const key = url.pathname === "/app/" ? "/app/index.html" : url.pathname;
    e.respondWith(
      fetch(req)
        .then(async (res) => {
          if (res.ok && !res.redirected) (await caches.open(SHELL)).put(key, res.clone());
          return res;
        })
        .catch(() => caches.match(key).then((hit) => hit || Response.error()))
    );
    return;
  }

  // Any page: the network; with no network, the offline review
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).catch(() =>
        caches.match("/app/index.html").then((hit) => hit || new Response("אין חיבור", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } }))
      )
    );
  }
});

// The app asks for a fresh copy right after login
self.addEventListener("message", (e) => {
  if (e.data === "refresh-shell") e.waitUntil(cacheShell());
});
