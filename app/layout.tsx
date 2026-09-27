import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import "./globals.css";

// Single type family for the whole app (see tailwind.config.ts).
// Inter: neutral and highly legible at small sizes, and it ships the
// tabular-figures (`tnum`) feature that globals.css relies on so money
// columns line up. Loaded through next/font (already part of Next.js) —
// no new dependency.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Profitabilly",
  description:
    "Know exactly how profitable every project or job really is.",
  // PWA installability (Mini-Sprint 39). manifest.webmanifest is served
  // by app/manifest.ts (Next's built-in convention); icons/apple-mobile
  // metadata are added here because Next does not put them in the
  // manifest link automatically. Colors/identity match app/manifest.ts.
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/favicon.ico" }, { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
  appleWebApp: {
    capable: true,
    title: "Profitabilly",
    statusBarStyle: "default",
  },
};

// themeColor/background moved out of `metadata` and into `viewport` per
// Next.js 15 (the old metadata.themeColor field is deprecated there).
export const viewport: Viewport = {
  themeColor: "#0F172A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
