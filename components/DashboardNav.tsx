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
      </div>
    </nav>
  );
}
