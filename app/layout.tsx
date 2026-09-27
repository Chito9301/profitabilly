import type { Metadata } from "next";
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
