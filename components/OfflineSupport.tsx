"use client";

import { useEffect } from "react";

// Keeps the offline daily review ready on this device:
//
// 1. registers public/sw.js, which keeps the review's files (/app/) and shows
//    it whenever a page cannot load for lack of network;
// 2. once per online visit, loads /app/ in a hidden frame for a minute. That is
//    the review itself, so it does what it does when opened: sends any grades
//    made offline, stores a fresh deck in this browser, and fetches the card
//    audio through the worker. Without it the offline review would only have
//    cards after being opened by hand while online.
const WARM_KEY = "yalla-offline-warmed";
const WARM_EVERY_MS = 30 * 60 * 1000;

export default function OfflineSupport() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => (reg.active ?? reg.installing ?? reg.waiting)?.postMessage("refresh-shell"))
      .catch(() => {});

    if (!navigator.onLine || location.pathname.startsWith("/app/") || location.pathname.startsWith("/login")) return;
    let last = 0;
    try {
      last = Number(localStorage.getItem(WARM_KEY) ?? 0);
    } catch {}
    if (Date.now() - last < WARM_EVERY_MS) return;

    let frame: HTMLIFrameElement | null = null;
    const start = setTimeout(() => {
      frame = document.createElement("iframe");
      frame.src = "/app/index.html";
      frame.setAttribute("aria-hidden", "true");
      frame.tabIndex = -1;
      frame.style.cssText = "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;border:0;left:-10px;top:-10px";
      document.body.appendChild(frame);
      try {
        localStorage.setItem(WARM_KEY, String(Date.now()));
      } catch {}
    }, 4000);
    const stop = setTimeout(() => frame?.remove(), 4000 + 60000);
    return () => {
      clearTimeout(start);
      clearTimeout(stop);
      frame?.remove();
    };
  }, []);
  return null;
}
