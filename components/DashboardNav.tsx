"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// The three main sections of the app. Keep this list small and flat —
// see ARCHITECTURE.md's Navigation section for why (no sidebar, no
// breadcrumbs, no dynamic nav system — that's a later stage).
const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/projects", label: "Projects" },
  { href: "/dashboard/customers", label: "Customers" },
] as const;

// "/dashboard" only matches the Dashboard page itself; the other two
// match themselves and everything nested under them (e.g. a project
// detail or edit page still highlights "Projects"), so deep pages
// still show which main section they belong to.
function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

// mailto link is intentionally not part of LINKS: it's not an app
// section (no route, no active-state underline), just a quiet way to
// reach the developer. Body is omitted (not set to ""), which is the
// standard way to leave a mailto's body empty for the user to fill in.
const FEEDBACK_MAILTO =
  "mailto:miproyecto353@gmail.com?subject=" +
  encodeURIComponent("Profitabilly Feedback");

// The active section is marked by an underline bar AND darker text (never
// color alone), plus aria-current for screen readers. -mb-px lets the bar
// sit on the nav's own bottom border. min-h-12 = 48px touch target on
// mobile, 40px from `sm` up.
export default function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="border-b border-rule bg-surface">
      <div className="mx-auto flex max-w-4xl items-center gap-6 px-6 text-sm">
        {LINKS.map(({ href, label }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`-mb-px inline-flex min-h-12 items-center border-b-2 font-medium transition-colors sm:min-h-10 ${
                active
                  ? "border-ink text-ink"
                  : "border-transparent text-ink-soft hover:text-ink"
              }`}
            >
              {label}
            </Link>
          );
        })}

        {/* Small and quiet on purpose (Mini-Sprint 43): smaller text,
            muted color, no bottom-border indicator, no aria-current —
            it should read as a minor utility link, not a fourth nav
            section. ml-auto keeps it out of the way on the right. */}
        <a
          href={FEEDBACK_MAILTO}
          className="ml-auto inline-flex min-h-12 shrink-0 items-center gap-1 text-xs text-muted transition-colors hover:text-ink-soft sm:min-h-10"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            className="h-3.5 w-3.5 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
          >
            <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" />
            <path d="M2 4.5l6 4.5 6-4.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Feedback
        </a>
      </div>
    </nav>
  );
}
