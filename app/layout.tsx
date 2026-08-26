import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// Latin comes from IBM Plex Sans, so Arabic and Latin are one designed-together family.
// Static weights, so an explicit weight array is required (unlike a variable font).
const plexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-plex-arabic",
  subsets: ["latin", "arabic"],
  weight: ["400", "500", "600", "700"],
});

// Amounts only. Same superfamily, so the ledger columns don't look pasted in.
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Expense Splitter",
  description: "Split expenses without the arguments.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${plexArabic.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
