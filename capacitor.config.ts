import type { CapacitorConfig } from "@capacitor/cli";

// The iPhone app: the offline daily review (mobile/src), built into mobile/www.
// The rest of the site opens from it in an in-app Safari sheet.
// See docs/ios-app.md.
const config: CapacitorConfig = {
  appId: "com.arielbenavi.yallacards",
  appName: "יאללה",
  webDir: "mobile/www",
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
