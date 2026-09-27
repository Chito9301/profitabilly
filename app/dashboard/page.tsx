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

type ProjectBar = {
  id: string;
  name: string;
  revenueCents: number;
  costCents: number;
  profitCents: number;
};

const BAR_HEIGHT_PX = 96;
const CHART_LEGEND: Array<{ label: string; swatchClass: string }> = [
  { label: "Revenue", swatchClass: "bg-ink-soft" },
  { label: "Costs", swatchClass: "bg-warning" },
  { label: "Profit", swatchClass: "bg-profit" },
];

// One Revenue/Costs/Profit bar. `cents` is only used to size and color
// the bar; the exact value is always shown as text underneath by the
// caller, so height/color are never the only way to read the amount.
function Bar({
  cents,
  maxCents,
  colorClass,
  label,
  currency,
}: {
  cents: number;
  maxCents: number;
  colorClass: string;
  label: string;
  currency: string;
}) {
  const magnitude = Math.abs(cents);
  const heightPx =
    maxCents === 0 ? 0 : Math.max((magnitude / maxCents) * BAR_HEIGHT_PX, magnitude === 0 ? 0 : 3);
  return (
    <div
      title={`${label}: ${currency} ${formatCents(cents)}`}
      className={`w-3 rounded-t sm:w-3.5 ${colorClass}`}
      style={{ height: `${heightPx}px` }}
    />
  );
}

// Presentation only: renders bars from cents totals the page already
// computed per project (see projectTotals below) — reuses formatCents/
// profitToneClass, no new financial calculation. Single responsive
// implementation: columns grow to fill the card on desktop (flex-1)
// but never shrink past a readable minimum, so once there are enough
// projects to exceed the card width the row scrolls horizontally
// instead of squeezing labels — same behavior on mobile and desktop.
function ProjectProfitabilityChart({
  currency,
  projects,
}: {
  currency: string;
  projects: ProjectBar[];
}) {
  const maxCents = projects.reduce(
    (max, p) =>
      Math.max(max, p.revenueCents, p.costCents, Math.abs(p.profitCents)),
    0,
  );

  return (
    <Card>
      <h2 id="project-profitability" className="text-lg font-medium tracking-tight">
        Project Profitability
      </h2>
      <p id="project-profitability-desc" className="mt-1 text-sm text-muted">
        Revenue, costs and profit by project ({currency})
      </p>

      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1" aria-hidden="true">
        {CHART_LEGEND.map((item) => (
          <li key={item.label} className="flex items-center gap-1.5 text-xs text-muted">
            <span className={`h-2.5 w-2.5 rounded-sm ${item.swatchClass}`} />
            {item.label}
          </li>
        ))}
      </ul>

      <div
        role="group"
        aria-labelledby="project-profitability-desc"
        tabIndex={0}
        className="mt-4 flex gap-4 overflow-x-auto pb-1"
      >
        {projects.map((project) => (
          <div
            key={project.id}
            className="flex min-w-[108px] flex-1 shrink-0 flex-col items-center gap-2 sm:min-w-[128px]"
          >
            <div
              className="flex h-24 items-end justify-center gap-1.5 sm:gap-2"
              style={{ height: `${BAR_HEIGHT_PX}px` }}
            >
              <Bar
                cents={project.revenueCents}
                maxCents={maxCents}
                colorClass="bg-ink-soft"
                label="Revenue"
                currency={currency}
              />
              <Bar
                cents={project.costCents}
                maxCents={maxCents}
                colorClass="bg-warning"
                label="Costs"
                currency={currency}
              />
              <Bar
                cents={project.profitCents}
                maxCents={maxCents}
                colorClass={
                  project.profitCents < 0 ? "bg-danger" : "bg-profit"
                }
                label="Profit"
                currency={currency}
              />
            </div>

            <dl className="w-full text-center text-[11px] leading-tight text-muted">
              <div>
                <dt className="inline">Rev </dt>
                <dd className="inline tabular-nums">
                  {formatCents(project.revenueCents)}
                </dd>
              </div>
              <div>
                <dt className="inline">Cost </dt>
                <dd className="inline tabular-nums">
                  {formatCents(project.costCents)}
                </dd>
              </div>
              <div>
                <dt className="inline">Profit </dt>
                <dd
                  className={`inline tabular-nums font-medium ${profitToneClass(project.profitCents)}`}
                >
                  {formatCents(project.profitCents)}
                </dd>
              </div>
            </dl>

            <p
              className="w-full truncate text-center text-xs font-medium"
              title={project.name}
            >
              {project.name}
            </p>
          </div>
        ))}
      </div>
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
    .select("id, name, status, created_at")
    .eq("user_id", user.id);

  // Scoped by user_id only, same reasoning as the Projects list
  // (Sprint 13): RLS's select policy on revenues/costs is
  // auth.uid() = user_id, so these can never include another user's
  // rows. project_id is selected (Mini-Sprint 40) so the Project
  // Profitability chart can group the same rows per project below,
  // exactly like the Projects list page already does — the grand
  // total across all of the user's projects still just sums every row.
  const { data: revenues } = await supabase
    .from("revenues")
    .select("project_id, amount")
    .eq("user_id", user.id);

  const { data: costs } = await supabase
    .from("costs")
    .select("project_id, amount")
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
  const archivedProjects = projectRows.filter(
    (p: { status: string }) => p.status === "Archived",
  ).length;

  const revenueCents = sumCents(
    (revenues ?? []).map((r: { amount: string }) => r.amount),
  );
  const costCents = sumCents(
    (costs ?? []).map((c: { amount: string }) => c.amount),
  );
  const profitCents = revenueCents - costCents;

  // Same grouping-by-project_id pattern as the Projects list page
  // (app/dashboard/projects/page.tsx): a project with no rows in either
  // map simply gets sumCents([]) = 0, never an error or an invented
  // value.
  const revenueAmountsByProject = new Map<string, string[]>();
  for (const r of (revenues ?? []) as { project_id: string; amount: string }[]) {
    const list = revenueAmountsByProject.get(r.project_id) ?? [];
    list.push(r.amount);
    revenueAmountsByProject.set(r.project_id, list);
  }
  const costAmountsByProject = new Map<string, string[]>();
  for (const c of (costs ?? []) as { project_id: string; amount: string }[]) {
    const list = costAmountsByProject.get(c.project_id) ?? [];
    list.push(c.amount);
    costAmountsByProject.set(c.project_id, list);
  }

  // Mini-Sprint 42: order the Project Profitability chart by recent
  // activity. `projects` has no `updated_at` (see supabase/migrations
  // and types/supabase.ts — only `created_at` and `accepted_at`
  // exist, and neither is touched by updateProject/acceptProject on
  // every edit), so there is no reliable signal for "last modified".
  // `created_at` is the only real recency field, so it's what's used
  // here: most-recently-created project first. This does NOT reflect
  // later edits (e.g. renaming, changing status) — see the Mini-Sprint
  // 42 report/README note for that limitation. No new field, column,
  // or persistence logic was added to produce this order.
  const projectsByRecency = [...(projects ?? [])].sort(
    (a: { created_at: string }, b: { created_at: string }) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const projectBars: ProjectBar[] = projectsByRecency.map(
    (p: { id: string; name: string; status: string }) => {
      const projectRevenueCents = sumCents(
        revenueAmountsByProject.get(p.id) ?? [],
      );
      const projectCostCents = sumCents(costAmountsByProject.get(p.id) ?? []);
      return {
        id: p.id,
        name: p.name,
        revenueCents: projectRevenueCents,
        costCents: projectCostCents,
        profitCents: projectRevenueCents - projectCostCents,
      };
    },
  );
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

      {totalProjects > 0 && (
        <section aria-labelledby="project-profitability" className="mt-6">
          <ProjectProfitabilityChart currency={currency} projects={projectBars} />
        </section>
      )}

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
          {/* Mobile: four compact rows. sm and up: four columns. The
              Active/Completed/Archived labels reuse StatusBadge, so
              they look exactly like the badges on the Projects
              pages. */}
          <dl className="mt-2 divide-y divide-rule sm:mt-3 sm:grid sm:grid-cols-4 sm:gap-3 sm:divide-y-0">
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
            <div className="flex items-center justify-between py-2 sm:block sm:py-0">
              <dt>
                <StatusBadge status="Archived" />
              </dt>
              <dd className="text-xl font-semibold sm:mt-1">
                {archivedProjects}
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
