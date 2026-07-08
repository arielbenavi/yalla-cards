"use client";

// Clip cutting loads ffmpeg.wasm and writes the full (compressed) source
// recording into its virtual FS; mobile Safari's much tighter WASM memory
// ceiling makes this unreliable, so that flow is desktop-only.
export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIPadOS = ua.includes("Macintosh") && navigator.maxTouchPoints > 1;
  return /Mobi|Android|iPhone|iPod/i.test(ua) || isIPadOS;
}
