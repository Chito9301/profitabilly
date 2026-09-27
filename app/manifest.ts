import type { MetadataRoute } from "next";

// PWA manifest (Mini-Sprint 39). Uses Next.js 15's built-in file-based
// manifest convention — this file is served at /manifest.webmanifest
// automatically, no custom route handler needed.
//
// Identity and colors match the existing app exactly:
// - name/short_name: "Profitabilly" (app/layout.tsx metadata.title)
// - description: existing product description (app/layout.tsx metadata.description)
// - theme_color: "#0F172A" = tailwind.config.ts colors.ink.DEFAULT
// - background_color: "#F8FAFC" = tailwind.config.ts colors.paper
// Only the fields required for installability are included.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Profitabilly",
    short_name: "Profitabilly",
    description:
      "Know exactly how profitable every project or job really is.",
    start_url: "/",
    display: "standalone",
    theme_color: "#0F172A",
    background_color: "#F8FAFC",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
