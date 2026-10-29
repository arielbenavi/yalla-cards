// The bottom-tab icons, shared by the site (components/NavBar.tsx) and the
// offline review (mobile/src/App.tsx), so the bar looks the same in both.
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

export function TabIcon({ href }: { href: string }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {TAB_ICONS[href] ?? <path d="M5 12h.01M12 12h.01M19 12h.01" strokeWidth="3" />}
    </svg>
  );
}

