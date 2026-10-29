import type { CapacitorConfig } from "@capacitor/cli";

// The iPhone app: the offline daily review (mobile/src), built into mobile/www.
// The rest of the site opens inside the same web view (allowNavigation), and the
// site's "חזרה יומית" tab comes back here (it spots the app by appendUserAgent).
// See docs/ios-app.md.
const config: CapacitorConfig = {
  appId: "com.arielbenavi.yallacards",
  appName: "יאללה",
  webDir: "mobile/www",
  appendUserAgent: "YallaApp", // lib/nav.ts IN_APP_UA
  server: { allowNavigation: ["yalla-cards.vercel.app"] },
  ios: {
    path: "mobile/ios",
    contentInset: "never",
    backgroundColor: "#f4f7fa",
  },
  plugins: {
    // Requests go through iOS networking instead of the web view: no CORS
    CapacitorHttp: { enabled: false },
  },
};

export default config;
