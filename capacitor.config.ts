import type { CapacitorConfig } from "@capacitor/cli";

// The iPhone app is the website itself (docs/one-app.md): one UI, one tab bar,
// one session. It opens on the daily review, the tab he uses every day: "/"
// sends the app there (app/page.tsx, by the user agent below). server.url must
// stay the bare origin — Capacitor opens in Safari any address that doesn't
// start with it, so "/review" here sent /login out of the app.
//
// Offline: the site's service worker (public/sw.js) shows the offline review
// (/app/, built from mobile/src) when a page can't load. WKWebView runs service
// workers only for App-Bound Domains, hence WKAppBoundDomains in Info.plist and
// limitsNavigationsToAppBoundDomains here. Before the worker is installed (a
// first launch with no network) the same review is served from the app bundle
// (errorPath).
//
// Google sign-in runs in the system Safari sheet and returns through the
// il.ariel.yalla:// scheme (Info.plist CFBundleURLTypes, app/login/page.tsx).
// See docs/ios-app.md.
const config: CapacitorConfig = {
  appId: "com.arielbenavi.yallacards",
  appName: "יאללה",
  webDir: "mobile/www",
  appendUserAgent: "YallaApp", // lib/nav.ts IN_APP_UA
  server: {
    url: "https://yalla-cards.vercel.app",
    errorPath: "index.html",
  },
  ios: {
    path: "mobile/ios",
    contentInset: "never",
    backgroundColor: "#f4f7fa",
    limitsNavigationsToAppBoundDomains: true,
  },
  plugins: {
    // Requests go through iOS networking instead of the web view: no CORS
    CapacitorHttp: { enabled: false },
  },
};

export default config;
