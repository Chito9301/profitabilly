import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logOut } from "@/lib/auth/actions";
import Button from "@/components/Button";
import Card from "@/components/Card";
import StatusBadge from "@/components/StatusBadge";
import {
  sumCents,
  formatCents,
  calculateMarginPercent,
  formatMarginPercent,
  profitToneClass,
} from "@/lib/finance/money";

// Presentational only: receives values that were already computed and
// formatted above (sumCents/formatCents/calculateMarginPercent/
// formatMarginPercent/profitToneClass) — it does no math. Local to this
// page on purpose; promote it to components/ when Project Details needs
// the same label/value pattern.
//
// Mobile: a compact label-left / value-right row, so long amounts like
// "USD 245,300.00" never have to squeeze into a half-width column.
// sm and up: label stacked above the value.
function Kpi({
  label,
  currency,
  value,
  tone = "",
  className = "",
}: {
  label: string;
  currency?: string;
  value: string;
  tone?: string;
  className?: string;
}) {
  return (
    <Card
      className={`flex items-baseline justify-between gap-3 sm:block ${className}`}
    >
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="flex flex-wrap items-baseline justify-end gap-x-1.5 sm:mt-1 sm:justify-start">
        {currency && (
          <span className="text-xs font-medium text-muted">{currency}</span>
        )}
        <span className={`text-xl font-semibold ${tone}`}>{value}</span>
      </dd>
    </Card>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Belt-and-suspenders with middleware.ts: getUser() is re-checked here
  // because middleware responses can be cached, so this is the
  // authoritative check for the page itself.
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_name, currency")
    .eq("id", user.id)
    .single();
  const currency = profile?.currency ?? "USD";

  const { data: projects } = await supabase
    .from("projects")
    .select("status")
    .eq("user_id", user.id);

  // Scoped by user_id only, same reasoning as the Projects list
  // (Sprint 13): RLS's select policy on revenues/costs is
  // auth.uid() = user_id, so these can never include another user's
  // rows. No per-project grouping needed here — the dashboard only
  // needs the grand total across all of the user's projects.
  const { data: revenues } = await supabase
    .from("revenues")
    .select("amount")
    .eq("user_id", user.id);

  const { data: costs } = await supabase
    .from("costs")
    .select("amount")
    .eq("user_id", user.id);

  const projectRows = projects ?? [];
  const totalProjects = projectRows.length;
  // Literal "Active"/"Completed" match the same values StatusBadge
  // already compares against elsewhere (lib/projects/constants.ts is
  // the source of truth for the form/validation, not for ad-hoc status
  // checks like this one — same convention already used in the
  // Projects list page).
  const activeProjects = projectRows.filter(
    (p: { status: string }) => p.status === "Active",
  ).length;
  const completedProjects = projectRows.filter(
    (p: { status: string }) => p.status === "Completed",
  ).length;

  const revenueCents = sumCents(
    (revenues ?? []).map((r: { amount: string }) => r.amount),
  );
  const costCents = sumCents(
    (costs ?? []).map((c: { amount: string }) => c.amount),
  );
  const profitCents = revenueCents - costCents;
  // Weighted overall margin: calculateMarginPercent(profit, revenue) is
  // the exact same function used per-project on the Projects list and
  // detail page — called here with the grand totals instead of one
  // project's totals, it naturally computes (TotalRevenue - TotalCosts)
  // / TotalRevenue x 100, not an average of individual percentages.
  const marginPercent = calculateMarginPercent(profitCents, revenueCents);

  return (
    <main className="mx-auto max-w-4xl px-6 py-8 sm:py-12">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-page font-semibold">Dashboard</h1>
          {profile?.business_name && (
            <p className="mt-1 text-sm text-muted">{profile.business_name}</p>
          )}
        </div>
        <Button
          href="/dashboard/projects/new"
          variant="primary"
          className="w-full sm:w-auto"
        >
          Add Project
        </Button>
      </header>

      <section aria-labelledby="financial-summary" className="mt-6 sm:mt-8">
        <h2 id="financial-summary" className="sr-only">
          Financial summary
        </h2>
        {/* DOM order is the accounting flow (Revenue, Costs, Profit,
            Margin), which is also the desktop row. Below lg, `order-*`
            promotes Profit and Margin to the top, per the approved
            mobile hierarchy. Cards are not interactive, so visual order
            differing from DOM order doesn't affect keyboard focus. */}
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi
            label="Total Revenue"
            currency={currency}
            value={formatCents(revenueCents)}
            className="order-3 lg:order-1"
          />
          <Kpi
            label="Total Costs"
            currency={currency}
            value={formatCents(costCents)}
            className="order-4 lg:order-2"
          />
          <Kpi
            label="Total Profit"
            currency={currency}
            value={formatCents(profitCents)}
            tone={profitToneClass(profitCents)}
            className="order-1 lg:order-3"
          />
          <Kpi
            label="Overall Margin"
            value={formatMarginPercent(marginPercent)}
            tone={profitToneClass(marginPercent)}
            className="order-2 lg:order-4"
          />
        </dl>
      </section>

      <section aria-labelledby="project-status" className="mt-6">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <h2
              id="project-status"
              className="text-lg font-medium tracking-tight"
            >
              Projects
            </h2>
            <Link
              href="/dashboard/projects"
              className="inline-flex min-h-10 items-center text-sm font-medium underline underline-offset-2"
            >
              View all projects
            </Link>
          </div>
          {/* Mobile: three compact rows. sm and up: three columns. The
              Active/Completed labels reuse StatusBadge, so they look
              exactly like the badges on the Projects pages. */}
          <dl className="mt-2 divide-y divide-rule sm:mt-3 sm:grid sm:grid-cols-3 sm:gap-3 sm:divide-y-0">
            <div className="flex items-center justify-between py-2 sm:block sm:py-0">
              <dt className="text-sm text-muted">Total Projects</dt>
              <dd className="text-xl font-semibold sm:mt-1">{totalProjects}</dd>
            </div>
            <div className="flex items-center justify-between py-2 sm:block sm:py-0">
              <dt>
                <StatusBadge status="Active" />
              </dt>
              <dd className="text-xl font-semibold sm:mt-1">
                {activeProjects}
              </dd>
            </div>
            <div className="flex items-center justify-between py-2 sm:block sm:py-0">
              <dt>
                <StatusBadge status="Completed" />
              </dt>
              <dd className="text-xl font-semibold sm:mt-1">
                {completedProjects}
              </dd>
            </div>
          </dl>
        </Card>
      </section>

      <div className="mt-10 border-t border-rule pt-6">
        <form action={logOut}>
          <Button
            type="submit"
            variant="secondary"
            className="w-full sm:w-auto"
          >
            Log out
          </Button>
        </form>
      </div>
    </main>
  );
}
