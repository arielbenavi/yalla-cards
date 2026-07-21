"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { strings } from "@/lib/strings";

type NavLink = { href: string; label: string; adminOnly?: boolean };

const links: NavLink[] = [
  { href: "/review", label: strings.nav.review },
  { href: "/inbox", label: strings.nav.inbox, adminOnly: true },
  { href: "/browse", label: strings.nav.browse },
  { href: "/recordings", label: strings.nav.recordings, adminOnly: true },
  { href: "/stats", label: strings.nav.stats },
  { href: "/notes", label: strings.nav.notes, adminOnly: true },
  { href: "/inflections", label: strings.nav.inflections },
  { href: "/songs", label: strings.nav.songs },
  { href: "/simulate", label: strings.nav.simulate, adminOnly: true },
  { href: "/picture-game", label: strings.nav.pictureGame },
];

export default function NavBar() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setIsAdmin(Boolean(d.isAdmin)))
      .catch(() => setIsAdmin(false));
  }, []);

  if (pathname === "/login") return null;

  // Hide admin-only links while loading (null) and for non-admins
  const visibleLinks = links.filter((l) => !l.adminOnly || isAdmin === true);

  return (
    <nav className="flex items-center justify-between border-b px-4 py-3">
      <span className="font-bold">{strings.appName}</span>
      <div className="flex gap-4">
        {visibleLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={
              pathname?.startsWith(link.href)
                ? "font-bold underline"
                : "text-gray-600"
            }
          >
            {link.label}
          </Link>
        ))}
      </div>
      <form action="/api/auth/logout" method="POST">
        <button type="submit" className="text-gray-500 text-sm">
          {strings.nav.logout}
        </button>
      </form>
    </nav>
  );
}
