import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logOut } from "@/lib/auth/actions";
import Button from "@/components/Button";
import {
  sumCents,
  formatCents,
  calculateMarginPercent,
  formatMarginPercent,
  profitToneClass,
} from "@/lib/finance/money";

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
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-medium tracking-tight">
          Welcome to Profitabilly
        </h1>
        {profile?.business_name && (
          <p className="mt-2 text-muted">{profile.business_name}</p>
        )}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 rounded-md border border-rule p-4 text-center sm:grid-cols-4">
        <div>
          <p className="text-xs text-muted">Total Revenue</p>
          <p className="text-lg font-medium">
            {currency} {formatCents(revenueCents)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted">Total Costs</p>
          <p className="text-lg font-medium">
            {currency} {formatCents(costCents)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted">Total Profit</p>
          <p className={`text-lg font-medium ${profitToneClass(profitCents)}`}>
            {currency} {formatCents(profitCents)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted">Average Margin</p>
          <p className={`text-lg font-medium ${profitToneClass(marginPercent)}`}>
            {formatMarginPercent(marginPercent)}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 rounded-md border border-rule p-4 text-center">
        <div>
          <p className="text-xs text-muted">Total Projects</p>
          <p className="text-lg font-medium">{totalProjects}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Active</p>
          <p className="text-lg font-medium">{activeProjects}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Completed</p>
          <p className="text-lg font-medium">{completedProjects}</p>
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center gap-2">
        <Link
          href="/dashboard/customers"
          className="text-sm underline underline-offset-2"
        >
          Customers
        </Link>

        <Link
          href="/dashboard/projects"
          className="text-sm underline underline-offset-2"
        >
          Projects
        </Link>

        <form action={logOut} className="mt-2">
          <Button type="submit" variant="secondary">
            Log out
          </Button>
        </form>
      </div>
    </main>
  );
}
