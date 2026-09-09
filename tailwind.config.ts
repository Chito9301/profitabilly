import type { Config } from "tailwindcss";

// Design tokens for Profitabilly's visual identity: a "ledger" palette
// grounded in the product's subject matter (tracking money on a job).
// Kept intentionally small — this is the foundation sprint, not a full
// design system. Extend as real screens (dashboard, reports) are built.
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#14181B", // near-black, cool-toned — primary text / dark surfaces
        paper: "#FBFAF6", // soft off-white page background
        rule: "#DAD4C4", // muted ledger-line grey for hairline dividers
        profit: "#1F5A45", // deep emerald — positive margin / success
        signal: "#B8862B", // muted gold — single accent, used sparingly for the primary CTA
        muted: "#5B5A52", // secondary text on paper background
      },
      fontFamily: {
        sans: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
