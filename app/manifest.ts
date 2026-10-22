import type { MetadataRoute } from "next";

// Installable from Safari: Share → Add to Home Screen opens it full screen,
// straight on the daily checklist.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "יאללה כרטיסים",
    short_name: "יאללה",
    description: "ערבית מדוברת — חזרה יומית",
    start_url: "/today",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    dir: "rtl",
    lang: "he",
    background_color: "#f4f7fa",
    theme_color: "#f4f7fa",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
