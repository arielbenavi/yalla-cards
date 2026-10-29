"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { strings } from "@/lib/strings";
import { APP_HOME, IN_APP_UA, navGroups, primaryNav as primary, type NavLink } from "@/lib/nav";

// The menu itself (order, sections) lives in lib/nav.ts, shared with the iPhone app.
const secondary: NavLink[] = navGroups.flatMap((g) => g.links);

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
  "/browse": (
    <>
      <rect x="7" y="3" width="12" height="15" rx="2.5" />
      <path d="M5 7v12a2 2 0 0 0 2 2h9" />
    </>
  ),
  "/practice": (
    <>
      <rect x="4" y="4" width="7" height="7" rx="2" />
      <rect x="13" y="4" width="7" height="7" rx="2" />
      <rect x="4" y="13" width="7" height="7" rx="2" />
      <circle cx="16.5" cy="16.5" r="3.5" />
    </>
  ),
  "/content": (
    <>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="M10 9.5v5l4.5-2.5z" />
    </>
  ),
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
  const [moreOpen, setMoreOpen] = useState(false);
  // Inside the iPhone app the review tab goes to the app's own offline review.
  const [inApp, setInApp] = useState(false);
  useEffect(() => setInApp(navigator.userAgent.includes(IN_APP_UA)), []);

  useEffect(() => setMoreOpen(false), [pathname]);

  if (pathname === "/login") return null;

  const hrefOf = (href: string) => (inApp && href === "/review" ? APP_HOME : href);
  const isActive = (href: string) => pathname?.startsWith(href) ?? false;
  const moreActive = secondary.some((l) => isActive(l.href));
  // Shown everywhere, the review included (Ariel, 2026-10-23): with it hidden
  // there was no visible way out of a screen. The grading buttons keep their
  // distance through main's bottom padding (globals.css) plus the review's own.

  return (
    <>
      {/* Top bar: the full menu on wide screens, just the name on phones. */}
      <nav className="flex items-center justify-between gap-6 border-b border-gray-200 bg-white/80 px-4 py-3 backdrop-blur md:px-6">
        <Link href="/today" className="shrink-0 text-xl font-bold tracking-tight text-gray-900">
          {strings.appName}
        </Link>
        <div className="hidden flex-1 flex-wrap items-center gap-x-5 gap-y-1 text-[15px] md:flex">
          {[...primary, ...secondary].map((link) => (
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
      {(
        <nav className="tabbar fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
          {/* flex, not grid: page tests find their buttons with ".grid button",
              and this bar renders before <main>. */}
          <div className="flex [&>*]:flex-1">
            {primary.map((link) => (
              <Link
                key={link.href}
                href={hrefOf(link.href)}
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
            <div className="flex flex-col gap-3">
              {navGroups.map((group) => (
                <div key={group.title}>
                  <p className="mb-1.5 px-1 text-xs font-medium text-gray-400">{group.title}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {group.links.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`rounded-2xl px-4 py-3 text-[15px] ${
                          isActive(link.href) ? "bg-blue-50 font-bold text-black" : "bg-gray-50 text-gray-800"
                        }`}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
