import { strings } from "@/lib/strings";

// One menu for the website (components/NavBar.tsx) and the iPhone app's home
// (mobile/src/App.tsx), ordered by use (2026-10-29: the daily review on 10 of the
// last 10 days, the import 3 times, everything else 0–1) and by what is worth doing.
export type NavLink = { href: string; label: string };

// The bottom tabs, on the site and in the app, on every screen (the review too).
// Ariel's pick (2026-10-29): the review, the games, the general review (opens on
// untagged + שוב, for more words after the daily), and the Arabic content.
export const primaryNav: NavLink[] = [
  { href: "/review", label: strings.nav.review },
  { href: "/practice", label: strings.nav.practice },
  { href: "/browse", label: strings.nav.browse },
  { href: "/content", label: strings.nav.content },
];

// Everything practised lives under the תרגול tab and every admin screen under אדמין (Ariel,
// 2026-11-05: the menu was too long and felt scattered). Their pages keep their addresses,
// and the tab stays marked while inside them. /lessons left the menu; the route still resolves.
export const practiceLinks: NavLink[] = [
  { href: "/watch", label: "סרטונים עם תעתיק" },
  { href: "/inflection-drill", label: strings.nav.inflectionDrill },
  { href: "/possessives", label: strings.nav.possessives },
  { href: "/translate", label: strings.nav.translate },
  { href: "/simulate", label: strings.nav.simulate },
  { href: "/focused", label: strings.nav.focused },
];
export const gameLinks: NavLink[] = [
  { href: "/picture-game", label: strings.nav.pictureGame },
  { href: "/numbers", label: strings.nav.numbers },
  { href: "/letters", label: strings.nav.letters },
];
export const adminLinks: NavLink[] = [
  { href: "/inbox", label: strings.nav.inbox },
  { href: "/recordings/auto", label: strings.nav.recordingsAuto },
  { href: "/recordings", label: strings.nav.recordings },
  { href: "/stats", label: strings.nav.stats },
  { href: "/notes", label: strings.nav.notes },
];

/** The menu entry a page belongs to, for marking it as active. */
export function navOwner(pathname: string): string {
  const inside = (links: NavLink[]) => links.some((l) => pathname.startsWith(l.href));
  if (inside(practiceLinks) || inside(gameLinks)) return "/practice";
  if (inside(adminLinks)) return "/admin";
  return pathname;
}

// Behind "עוד".
export const navGroups: { title: string; links: NavLink[] }[] = [
  {
    title: "עוד",
    links: [
      { href: "/today", label: strings.nav.today },
      { href: "/songs", label: strings.nav.songs },
      { href: "/admin", label: strings.nav.admin },
    ],
  },
];

// The iPhone app (capacitor.config.ts appends this to the web view's user agent).
// The login uses it to run Google sign-in in the system sheet.
export const IN_APP_UA = "YallaApp";
