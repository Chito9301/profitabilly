import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

// Single type family for the whole foundation (see tailwind.config.ts).
// Space Grotesk carries both the headline and UI text for now — a second
// family can be introduced later if a screen genuinely needs the contrast.
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
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
    <html lang="en" className={spaceGrotesk.variable}>
      <body>{children}</body>
    </html>
  );
}
