import type { Metadata } from "next";
import { Noto_Sans_Hebrew } from "next/font/google";
import "./globals.css";
import { strings } from "@/lib/strings";
import NavBar from "@/components/NavBar";

const notoSansHebrew = Noto_Sans_Hebrew({
  variable: "--font-hebrew",
  subsets: ["hebrew"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: strings.appName,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html dir="rtl" lang="he" className={`${notoSansHebrew.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-hebrew">
        <NavBar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
