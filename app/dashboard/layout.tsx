import type { ReactNode } from "react";
import DashboardNav from "@/components/DashboardNav";

// Applies to every route under /dashboard/** automatically (App
// Router layout nesting) — no individual page needed to change.
// Deliberately does not re-check auth here: every /dashboard/* page
// already calls supabase.auth.getUser() and redirect()s itself if
// signed out (see each page's own comment on this), and middleware.ts
// protects the same paths — adding a third check here would duplicate
// that existing pattern rather than fit into it.
export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Mini-Sprint 44: from `lg` up the nav is a left sidebar and the page
  // sits to its right; below `lg` the nav is a top bar above the page
  // (the wrapper only becomes a row at `lg`). min-w-0 lets wide content
  // (tables) scroll inside its own card instead of widening the page.
  return (
    <div className="min-h-dvh lg:flex">
      <DashboardNav />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
