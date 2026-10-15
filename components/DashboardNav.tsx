"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

// The three main sections of the app. Keep this list small and flat —
// see ARCHITECTURE.md's Navigation section for why (no breadcrumbs, no
// dynamic nav system — that's a later stage).
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
// section (no route, no active-state marker), just a quiet way to
// reach the developer. Body is omitted (not set to ""), which is the
// standard way to leave a mailto's body empty for the user to fill in.
const FEEDBACK_MAILTO =
  "mailto:miproyecto353@gmail.com?subject=" +
  encodeURIComponent("JobWorth Feedback");

// One component, two layouts (Mini-Sprint 44), switched with CSS only so
// the links, active-state logic and Feedback link exist exactly once:
// - below `lg` (phones, tablets): a compact top bar — brand row, then a
//   row with the three sections and Feedback at the right (the same
//   arrangement as before). The active section has an underline bar.
// - from `lg` up: a left sidebar, sticky at full viewport height — brand
//   on top, sections stacked, Feedback quiet at the bottom. The active
//   section has a left marker (brand green) and a tinted fill.
// The active section is never marked by color alone: text turns darker
// and heavier, there is a marker/underline, and aria-current is set.
// min-h-11 = 44px touch target on mobile; 40px from `lg` up.
export default function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="border-b border-rule bg-surface lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-56 lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-r"
    >
      <Link
        href="/dashboard"
        className="flex items-center gap-2.5 px-6 pb-1 pt-3 lg:px-5 lg:pb-4 lg:pt-6"
      >
        {/* Decorative: the adjacent text already names the product. */}
        <Image
          src="/icons/icon-192.png"
          alt=""
          width={28}
          height={28}
          unoptimized
          className="h-7 w-7 shrink-0 lg:h-8 lg:w-8"
        />
        <span className="text-base font-semibold tracking-tight text-ink lg:text-lg">
          JobWorth
        </span>
      </Link>

      <div className="flex items-center gap-6 overflow-x-auto px-6 text-sm lg:flex-1 lg:flex-col lg:items-stretch lg:gap-0 lg:overflow-visible lg:px-3 lg:pb-4">
        <div className="flex items-center gap-6 lg:flex-col lg:items-stretch lg:gap-1">
          {LINKS.map(({ href, label }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-11 items-center border-b-2 font-medium transition-colors lg:min-h-10 lg:rounded-lg lg:border-b-0 lg:border-l-2 lg:px-3 ${
                  active
                    ? "border-ink text-ink lg:border-profit-bright lg:bg-ink/5"
                    : "border-transparent text-ink-soft hover:text-ink lg:hover:bg-ink/5"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Small and quiet on purpose (Mini-Sprint 43): smaller text,
            muted color, no active marker, no aria-current — it should
            read as a minor utility link, not a fourth nav section.
            ml-auto pushes it right on the top bar; lg:mt-auto pins it to
            the bottom of the sidebar. */}
        <a
          href={FEEDBACK_MAILTO}
          className="ml-auto inline-flex min-h-11 shrink-0 items-center gap-1 text-xs text-muted transition-colors hover:text-ink-soft lg:ml-0 lg:mt-auto lg:min-h-10 lg:px-3"
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
