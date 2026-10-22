import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Hebrew, Noto_Naskh_Arabic } from "next/font/google";
import "./globals.css";
import { strings } from "@/lib/strings";
import NavBar from "@/components/NavBar";

// One family for everything, including the pointed transliteration — Plex
// Hebrew carries full nikud.
const plexHebrew = IBM_Plex_Sans_Hebrew({
  variable: "--font-hebrew",
  subsets: ["hebrew"],
  weight: ["400", "500", "600", "700"],
});

const naskh = Noto_Naskh_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: strings.appName,
  appleWebApp: {
    capable: true,
    title: "יאללה",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#f4f7fa",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      dir="rtl"
      lang="he"
      className={`${plexHebrew.variable} ${naskh.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-hebrew pt-[env(safe-area-inset-top)]">
        <NavBar />
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
