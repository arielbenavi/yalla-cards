"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { strings } from "@/lib/strings";

type NavLink = { href: string; label: string; adminOnly?: boolean };

// The four things he opens every day. On a phone they are the bottom tabs, in
// the thumb's reach; everything else lives behind "עוד".
const primary: NavLink[] = [
  { href: "/today", label: strings.nav.today },
  { href: "/review", label: strings.nav.review },
  { href: "/focused", label: strings.nav.focused },
  { href: "/simulate", label: strings.nav.simulate },
];

const secondary: NavLink[] = [
  { href: "/browse", label: strings.nav.browse },
  { href: "/songs", label: strings.nav.songs },
  { href: "/content", label: strings.nav.content },
  // "נטיות" removed from the bar on Ariel's call (note e165eccf). The route
  // still resolves, so this is one line to undo — nothing was deleted.
  { href: "/inflection-drill", label: strings.nav.inflectionDrill },
  { href: "/translate", label: strings.nav.translate },
  { href: "/possessives", label: strings.nav.possessives },
  { href: "/practice", label: strings.nav.practice },
  { href: "/stats", label: strings.nav.stats },
  // Not adminOnly: /api/auth/me reported isAdmin=false for a session that
  // proxy.ts let into /notes, which hid the link while the page itself worked.
  // proxy.ts still guards /inbox, same as /recordings and /notes below.
  { href: "/inbox", label: strings.nav.inbox },
  { href: "/recordings", label: strings.nav.recordings },
  { href: "/notes", label: strings.nav.notes },
];

const TAB_ICONS: Record<string, React.ReactNode> = {
  "/today": <path d="M4 7h16M4 12h16M4 17h10" />,
  "/review": (
    <>
      <rect x="5" y="4" width="14" height="16" rx="3" />
      <path d="M9 9h6M9 13h4" />
    </>
  ),
  "/focused": (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  "/simulate": <path d="M5 6h14v9H9l-4 3z" />,
};

function TabIcon({ href }: { href: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {TAB_ICONS[href] ?? <path d="M5 12h.01M12 12h.01M19 12h.01" strokeWidth="3" />}
    </svg>
  );
}

export default function NavBar() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setIsAdmin(Boolean(d.isAdmin)))
      .catch(() => setIsAdmin(false));
  }, []);

  useEffect(() => setMoreOpen(false), [pathname]);

  if (pathname === "/login") return null;

  const visible = (l: NavLink) => !l.adminOnly || isAdmin === true;
  const isActive = (href: string) => pathname?.startsWith(href) ?? false;
  const moreActive = secondary.some((l) => isActive(l.href));
  // During a review the grading buttons own the bottom of the screen; a tab bar
  // right under them is a mis-tap waiting to happen.
  const hideTabs = pathname?.startsWith("/review");

  return (
    <>
      {/* Top bar: the full menu on wide screens, just the name on phones. */}
      <nav className="flex items-center justify-between gap-6 border-b border-gray-200 bg-white/80 px-4 py-3 backdrop-blur md:px-6">
        <Link href="/today" className="shrink-0 text-xl font-bold tracking-tight text-gray-900">
          {strings.appName}
        </Link>
        <div className="hidden flex-1 flex-wrap items-center gap-x-5 gap-y-1 text-[15px] md:flex">
          {[...primary, ...secondary].filter(visible).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                isActive(link.href)
                  ? "font-bold text-black underline decoration-2 underline-offset-8"
                  : "text-gray-600 hover:text-gray-900"
              }
            >
              {link.label}
            </Link>
          ))}
        </div>
        <form action="/api/auth/logout" method="POST" className="shrink-0">
          <button type="submit" className="text-sm text-gray-500 hover:text-gray-800">
            {strings.nav.logout}
          </button>
        </form>
      </nav>

      {/* Bottom tabs on phones. */}
      {!hideTabs && (
        <nav className="tabbar fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
          {/* flex, not grid: page tests find their buttons with ".grid button",
              and this bar renders before <main>. */}
          <div className="flex [&>*]:flex-1">
            {primary.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex h-16 flex-col items-center justify-center gap-1 text-[11px] ${
                  isActive(link.href) ? "font-bold text-black" : "text-gray-500"
                }`}
              >
                <TabIcon href={link.href} />
                {link.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => setMoreOpen((o) => !o)}
              aria-expanded={moreOpen}
              className={`flex h-16 flex-col items-center justify-center gap-1 text-[11px] ${
                moreOpen || moreActive ? "font-bold text-black" : "text-gray-500"
              }`}
            >
              <TabIcon href="more" />
              עוד
            </button>
          </div>
        </nav>
      )}

      {/* "עוד" opens as a sheet from the bottom, where the finger already is. */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-label="עוד">
          <button
            type="button"
            aria-label="סגור"
            className="absolute inset-0 bg-gray-900/30"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-3 shadow-[0_-12px_32px_-12px_rgb(29_79_150/0.25)]">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-300" />
            <div className="grid grid-cols-2 gap-2">
              {secondary.filter(visible).map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-2xl px-4 py-3.5 text-[15px] ${
                    isActive(link.href) ? "bg-blue-50 font-bold text-black" : "bg-gray-50 text-gray-800"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
