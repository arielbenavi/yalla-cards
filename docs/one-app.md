# One app: the iPhone app, the website and the offline review as a single product

Status: stages 1–3 built and installed (2026-10-29, commits 05ab2de, 77267d1).
Stage 4 not started. Each stage is a separate, reversible step.

## The problem (Ariel, 2026-10-29)

> "זה נראה כאילו יש 2 חלקים נפרדים לאפליקציה כשאמור להיות אחד"

Today there are three front ends that look alike but are separate code:

| Front end | Code | Where it shows up |
|---|---|---|
| Native shell: home + offline review + its own tab bar | `mobile/src` | The iPhone app's first screen |
| The website | `app/`, `components/NavBar.tsx` | Every other screen, inside the app since 0ebebbf |
| The same offline review, copied to the web | `public/app` (from `mobile/src`) | The website when offline (`public/sw.js`) |

What the user sees because of that:

- **Two tab bars.** The shell's bar (`mobile/src/app.css`, 60px, text only) and
  the site's bar (`NavBar.tsx`, 64px, icons) are two implementations of one
  menu. Moving between them makes the bar jump in size.
- **Two daily reviews.** The shell's review is offline-first. The site's
  `/review` is online-only and has features the shell lacks (clip-range
  editor, ar→he toggle per card, …).
- **A login screen inside the app**, with a "כניסת אדמין" link. The app's own
  API (`/api/mobile/*`) needs no login, but the site does, and the WebView has
  its own cookies. Google sign-in is blocked inside an embedded WebView, so
  only the password route works there.
- **Two logins that mean different things.** Google (an email in
  `ALLOWED_EMAILS`) is a regular user. The password (`APP_PASSWORD`) is the
  admin, the only one who gets admin tools (clip editing, notes admin, …).
  Ariel signs in with Google, so on his own account the admin tools are hidden
  (the NavBar comment about `isAdmin=false` came from this).
- **Progress that doesn't follow him.** Content progress (`/content`) is kept in
  `localStorage`, so the phone and the computer disagree.

## The target

**One codebase, one UI, one session, one source of truth.** The iPhone app
is the website plus native packaging, not a second app. Offline is a property
of the review screen, not a separate screen. Everything Ariel does is stored
on the server, except grades made offline, which sync on their own.

## Stage 1: the app *is* the site

- `capacitor.config.ts`: `server.url = "https://yalla-cards.vercel.app"`, so
  the WebView opens the site itself (the `/review` tab first, see below).
  Drop the native home and its tab bar (`Home`, `TabBar` in
  `mobile/src/App.tsx`). `mobile/src` remains only as the offline review that
  `public/app` is built from.
- **Offline inside the app needs a service worker,** and WKWebView runs service
  workers only for **App-Bound Domains**: add `WKAppBoundDomains`
  (`yalla-cards.vercel.app`) to `mobile/ios/App/App/Info.plist` and
  `ios.limitsNavigationsToAppBoundDomains: true` to the config.
  **`server.url` must be the bare origin.** With a path (`/review`), Capacitor
  opened `/login` in Safari. The landing page goes in `app/page.tsx` instead. Then
  `public/sw.js` works in the app exactly as on the home-screen icon: no
  network → the offline review.
  *Check on the device:* YouTube iframes on `/content` still play under
  App-Bound Domains (they are subframes, which should be allowed). If they
  don't, add `www.youtube.com` and `www.youtube-nocookie.com` to the list (the
  limit is 10 domains).
- Remove what the hybrid needed: `appendUserAgent`, `IN_APP_UA`, `APP_HOME`,
  `allowNavigation`, and `hrefOf` in `NavBar.tsx`. Keep `lib/nav.ts`, since
  the menu is defined in one place.
- The landing page in the app is `/review` (the tab he opens every day), not
  `/today`. On the website `/` keeps going to `/today`.
- Card audio offline: the SW's `AUDIO` cache replaces the native `audio/`
  folder. The warm-up in `OfflineSupport.tsx` already fetches it.

Done when the app has one tab bar on every screen, at one size, airplane
mode in the app shows the offline review, and nothing in `mobile/src` renders
a menu.

## Stage 2: one login, once, with Google

- **In the app, Google sign-in goes through the system sheet, not the
  WebView.** That is `SFSafariViewController` via `@capacitor/browser`, which
  Google allows. The flow:
  1. `signInWithOAuth({ provider: "google", options: { redirectTo: "il.ariel.yalla://auth", skipBrowserRedirect: true } })` in the WebView, which keeps the PKCE verifier there.
  2. `Browser.open(url)`.
  3. `App.addListener("appUrlOpen")` receives `il.ariel.yalla://auth?code=…`.
  4. `Browser.close()`, then `exchangeCodeForSession(code)`, then navigate to `/review`.
  
  Register the URL scheme in `Info.plist` (`CFBundleURLTypes`). Add
  `il.ariel.yalla://auth` to Supabase Auth → Redirect URLs through the
  Management API (`SUPABASE_ACCESS_TOKEN` is in `.env.local`). Never ask Ariel
  to click through the dashboard.
- **Admin by email, not by password:** add `ADMIN_EMAILS` (Ariel's Google
  email), and have `/api/auth/me` and `proxy.ts` treat that Google session as
  admin. Then remove "כניסת אדמין" from the login page. Keep `POST /api/auth`
  with `APP_PASSWORD` for the Playwright tests and scripts only
  (`tests/e2e/helpers.ts` uses it), reachable at `/login?password=1`.
- Sessions last long: the Supabase refresh token persists in the WebView, so
  after the first sign-in the app never shows the login again.

Done when a fresh install signs in once with Google inside the app, the admin
tools show up for Ariel, and the login page shows only the Google button.

## Stage 3: everything synced

- **Content progress goes to the DB.** Migration `content_progress(url text
  primary key, sec real, dur real, updated_at timestamptz)`, plus
  `GET/POST /api/content/progress`. `/content` reads from the server, writes
  every ~10s while playing and on pause or close (last write wins by
  `updated_at`), and keeps `localStorage` only as an offline fallback. On first
  load, copy existing `localStorage` progress up once, so nothing he has
  watched is lost.
- Audit: after this, the only state on the device should be the offline
  review's deck cache and pending grades (synced), the daily-tip date and the
  warm-up timestamp (per-device by nature). Anything else found in
  `localStorage` that is Ariel's progress moves to the DB the same way.

Done when a video watched halfway on the phone shows the same % on the computer.

## Stage 4: one daily review

Two reviews (`app/review/page.tsx` and the review in `mobile/src/App.tsx`)
means every review feature is built twice or ends up on one side only.
Converge on the **offline-first one** (its local queue mirrors the server's
exactly; `scripts/check-daily-queue.ts` proves it). Port the web-only features
into it: the per-card ar→he toggle, admin clip-range editing, and anything
else in `/review` it lacks (diff the two before starting). Then `/review`
renders it. After this stage the review is the same screen online and
offline, on the phone and the computer.

Done when `/review` and the offline review are one component, the Playwright
review tests pass against it, and `check-daily-queue` still reports identical.

## Order and reasoning

- Stage 1 first, because it removes the visible split, which is the complaint.
  It is mostly deletion plus config.
- Stage 2 right after, since stage 1 makes the login screen the first thing a
  new install shows.
- Stage 3 is independent and small.
- Stage 4 is the largest and the least visible, so it comes last. Until then,
  the online `/review` is what the app shows, and the offline review appears
  only without a network, as on the website today.

## Explicitly out of scope

- No App Store / TestFlight changes (`install-iphone.sh` and the daily
  re-sign stay as they are).
- No new features. Only consolidation.
- No writes to FSRS state outside grading (project rule).
- Not removing `APP_PASSWORD` itself: tests and scripts depend on it.
