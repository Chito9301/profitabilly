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
  return (
    <>
      <DashboardNav />
      {children}
    </>
  );
}
