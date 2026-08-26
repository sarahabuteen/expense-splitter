import type { Metadata } from "next";
import { Manrope, IBM_Plex_Sans_Arabic, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { DEFAULT_THEME, NO_FLASH_SCRIPT } from "@/lib/theme";

// The design's face. Variable, so no weight array is needed.
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

// Arabic companion: Manrope has no Arabic coverage, so Plex Arabic sits behind
// it in the stack and picks up Arabic text without affecting Latin rendering.
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
    // data-theme is rendered on the server so dark is the default even before
    // any script runs; the inline script below corrects it for a saved light or
    // system preference.
    // suppressHydrationWarning: that script mutates <html> before React
    // hydrates, which React would otherwise flag as a mismatch.
    <html
      lang="en"
      data-theme={DEFAULT_THEME}
      suppressHydrationWarning
      className={`${manrope.variable} ${plexArabic.variable} ${plexMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_SCRIPT }} />
      </head>
      {/* suppressHydrationWarning: browser extensions inject attributes on
          <body> before hydration (e.g. cz-shortcut-listen), which React would
          otherwise report as a mismatch. */}
      <body suppressHydrationWarning className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
