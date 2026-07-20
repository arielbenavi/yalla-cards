"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { strings } from "@/lib/strings";

const links = [
  { href: "/review", label: strings.nav.review },
  { href: "/inbox", label: strings.nav.inbox },
  { href: "/browse", label: strings.nav.browse },
  { href: "/lessons", label: strings.nav.lessons },
  { href: "/recordings", label: strings.nav.recordings },
  { href: "/stats", label: strings.nav.stats },
  { href: "/notes", label: strings.nav.notes },
  { href: "/teachers", label: strings.nav.teachers },
];

export default function NavBar() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <nav className="flex items-center justify-between border-b px-4 py-3">
      <span className="font-bold">{strings.appName}</span>
      <div className="flex gap-4">
        {links.map((link) => (
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
