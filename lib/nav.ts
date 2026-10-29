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

// Behind "עוד", in sections. "נטיות" left the menu on Ariel's call (note e165eccf);
// the route still resolves, so it is one line to undo.
export const navGroups: { title: string; links: NavLink[] }[] = [
  {
    title: "תרגול",
    links: [
      { href: "/today", label: strings.nav.today },
      { href: "/simulate", label: strings.nav.simulate },
      { href: "/focused", label: strings.nav.focused },
      { href: "/translate", label: strings.nav.translate },
      { href: "/inflection-drill", label: strings.nav.inflectionDrill },
      { href: "/possessives", label: strings.nav.possessives },
      { href: "/songs", label: strings.nav.songs },
    ],
  },
  {
    title: "כרטיסים",
    links: [
      { href: "/inbox", label: strings.nav.inbox },
      { href: "/lessons", label: strings.nav.lessons },
      { href: "/recordings", label: strings.nav.recordings },
    ],
  },
  {
    title: "מעקב",
    links: [
      { href: "/stats", label: strings.nav.stats },
      { href: "/notes", label: strings.nav.notes },
    ],
  },
];

// The iPhone app (capacitor.config.ts appends this to the web view's user agent).
// The login uses it to run Google sign-in in the system sheet.
export const IN_APP_UA = "YallaApp";
