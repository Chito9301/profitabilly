import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Button from "@/components/Button";
import DeleteRevenueButton from "./DeleteRevenueButton";
import DeleteCostButton from "./DeleteCostButton";
import DeleteEstimatedRevenueButton from "./DeleteEstimatedRevenueButton";
import DeleteEstimatedCostButton from "./DeleteEstimatedCostButton";
import AcceptProjectButton from "./AcceptProjectButton";
import CompleteProjectButton from "./CompleteProjectButton";
import { sumCents, formatCents, calculateMarginPercent, formatMarginPercent, profitToneClass } from "@/lib/finance/money";
import type { Revenue, Cost, EstimatedRevenue, EstimatedCost } from "@/types/supabase";

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Duplicated from app/dashboard/projects/page.tsx rather than shared —
// same small-local-helper precedent already established there.
function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "Active"
      ? "bg-profit/10 text-profit"
      : status === "Completed"
        ? "bg-signal/10 text-signal"
        : "bg-ink/5 text-muted";
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${styles}`}>
      {status}
    </span>
  );
}

const SUCCESS_MESSAGES: Record<string, string> = {
  revenueCreated: "Revenue added.",
  revenueUpdated: "Revenue updated.",
  revenueDeleted: "Revenue deleted.",
  costCreated: "Cost added.",
  costUpdated: "Cost updated.",
  costDeleted: "Cost deleted.",
  estimatedRevenueCreated: "Estimated revenue added.",
  estimatedRevenueUpdated: "Estimated revenue updated.",
  estimatedRevenueDeleted: "Estimated revenue deleted.",
  estimatedCostCreated: "Estimated cost added.",
  estimatedCostUpdated: "Estimated cost updated.",
  estimatedCostDeleted: "Estimated cost deleted.",
  accepted: "Project accepted.",
  completed: "Project marked as completed.",
};

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id } = await params;
  const searchParamsResolved = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Scoped to id + user_id: RLS already hides other users' rows, so a
  // wrong id and someone else's project look identical here — both
  // just come back empty, and both should render as "not found".
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!project) notFound();

  const { data: customer } = await supabase
    .from("customers")
    .select("name")
    .eq("id", project.customer_id)
    .eq("user_id", user.id)
    .single();

  const { data: profile } = await supabase
    .from("profiles")
    .select("currency")
    .eq("id", user.id)
    .single();
  const currency = profile?.currency ?? "USD";

  // Scoped by both project_id and user_id (redundant with RLS, same
  // reasoning used throughout: keep the query's intent explicit).
  const { data: revenues } = await supabase
    .from("revenues")
    .select("*")
    .eq("project_id", id)
    .eq("user_id", user.id)
    .order("date", { ascending: false });

  const { data: costs } = await supabase
    .from("costs")
    .select("*")
    .eq("project_id", id)
    .eq("user_id", user.id)
    .order("date", { ascending: false });

  const revenueRows: Revenue[] = revenues ?? [];
  const costRows: Cost[] = costs ?? [];

  const revenueCents = sumCents(revenueRows.map((r) => r.amount));
  const costCents = sumCents(costRows.map((c) => c.amount));
  const profitCents = revenueCents - costCents;
  const marginPercent = calculateMarginPercent(profitCents, revenueCents);

  // Estimated revenue/costs: separate tables from actual revenues/costs
  // (Sprint 18/19 decision — never mixed in one table), but scoped and
  // aggregated with the exact same pattern and the exact same
  // lib/finance/money.ts functions used above for the actual totals.
  const { data: estimatedRevenues } = await supabase
    .from("estimated_revenues")
    .select("*")
    .eq("project_id", id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data: estimatedCosts } = await supabase
    .from("estimated_costs")
    .select("*")
    .eq("project_id", id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const estimatedRevenueRows: EstimatedRevenue[] = estimatedRevenues ?? [];
  const estimatedCostRows: EstimatedCost[] = estimatedCosts ?? [];

  const estimatedRevenueCents = sumCents(estimatedRevenueRows.map((r) => r.amount));
  const estimatedCostCents = sumCents(estimatedCostRows.map((c) => c.amount));
  const estimatedProfitCents = estimatedRevenueCents - estimatedCostCents;
  const estimatedMarginPercent = calculateMarginPercent(
    estimatedProfitCents,
    estimatedRevenueCents,
  );

  const successKey = Object.keys(SUCCESS_MESSAGES).find(
    (key) => searchParamsResolved[key] !== undefined,
  );
  const successMessage = successKey ? SUCCESS_MESSAGES[successKey] : null;

  // Estimated vs Actual: plain differences between totals already
  // computed above — not a new calculation engine. Margin difference
  // is null (shown as "N/A") if either side is null, since a
  // percentage-point gap against an undefined margin is meaningless.
  const revenueDiffCents = revenueCents - estimatedRevenueCents;
  const costDiffCents = costCents - estimatedCostCents;
  const profitDiffCents = profitCents - estimatedProfitCents;
  const marginDiffPercent =
    marginPercent !== null && estimatedMarginPercent !== null
      ? marginPercent - estimatedMarginPercent
      : null;

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <Link href="/dashboard/projects" className="text-sm text-muted underline underline-offset-2">
        ← Projects
      </Link>

      <div className="mt-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-medium tracking-tight">{project.name}</h1>
          <StatusBadge status={project.status} />
        </div>
        {customer?.name && <p className="text-muted">{customer.name}</p>}
      </div>

      {successMessage && (
        <p
          role="status"
          className="mt-6 rounded-md bg-profit/10 px-4 py-2 text-sm text-profit"
        >
          {successMessage}
        </p>
      )}

      {/* Profit = Total Revenue - Total Costs, and Margin = Profit /
          Revenue x 100, both computed from exact integer-cent totals
          (lib/finance/money.ts) — not from these already-rounded
          display strings. */}
      <h2 className="mt-6 text-lg font-medium tracking-tight">Actual</h2>
      <div className="mt-2 grid grid-cols-4 gap-4 rounded-md border border-rule p-4 text-center">
        <div>
          <p className="text-xs text-muted">Revenue</p>
          <p className="text-lg font-medium">
            {currency} {formatCents(revenueCents)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted">Costs</p>
          <p className="text-lg font-medium">
            {currency} {formatCents(costCents)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted">Profit</p>
          <p className={`text-lg font-medium ${profitToneClass(profitCents)}`}>
            {currency} {formatCents(profitCents)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted">Margin</p>
          <p className={`text-lg font-medium ${profitToneClass(marginPercent)}`}>
            {formatMarginPercent(marginPercent)}
          </p>
        </div>
      </div>

      {/* Marking complete is only offered while Active — once
          Completed or Archived, the final Actual result above already
          speaks for itself and completeProject's own "status = Active"
          guard would reject the action anyway. */}
      {project.status === "Active" && (
        <div className="mt-4">
          <CompleteProjectButton projectId={id} />
        </div>
      )}

      {/* Revenue */}
      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium tracking-tight">Revenue</h2>
          <Button href={`/dashboard/projects/${id}/revenue/new`} variant="primary">
            Add Revenue
          </Button>
        </div>

        {revenueRows.length === 0 ? (
          <p className="text-sm text-muted">No revenue entries yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {revenueRows.map((revenue) => (
              <li
                key={revenue.id}
                className="flex items-center justify-between gap-3 rounded-md border border-rule p-3"
              >
                <div>
                  <p className="text-sm">{revenue.description}</p>
                  <p className="text-xs text-muted">{formatDate(revenue.date)}</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-sm font-medium">
                    {currency} {revenue.amount}
                  </p>
                  <Link
                    href={`/dashboard/projects/${id}/revenue/${revenue.id}/edit`}
                    className="text-sm underline underline-offset-2"
                  >
                    Edit
                  </Link>
                  <DeleteRevenueButton revenueId={revenue.id} projectId={id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Costs */}
      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium tracking-tight">Costs</h2>
          <Button href={`/dashboard/projects/${id}/costs/new`} variant="primary">
            Add Cost
          </Button>
        </div>

        {costRows.length === 0 ? (
          <p className="text-sm text-muted">No cost entries yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {costRows.map((cost) => (
              <li
                key={cost.id}
                className="flex items-center justify-between gap-3 rounded-md border border-rule p-3"
              >
                <div>
                  <p className="text-sm">{cost.description}</p>
                  <p className="text-xs text-muted">
                    {cost.category} · {formatDate(cost.date)}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-sm font-medium">
                    {currency} {cost.amount}
                  </p>
                  <Link
                    href={`/dashboard/projects/${id}/costs/${cost.id}/edit`}
                    className="text-sm underline underline-offset-2"
                  >
                    Edit
                  </Link>
                  <DeleteCostButton costId={cost.id} projectId={id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Estimated — kept visually and structurally separate from the
          Actual figures above: its own heading, its own stat box, its
          own lists, backed by separate tables (estimated_revenues /
          estimated_costs), never merged with revenues/costs. */}
      <h2 className="mt-14 text-lg font-medium tracking-tight">Estimated</h2>
      <div className="mt-2 grid grid-cols-4 gap-4 rounded-md border border-rule p-4 text-center">
        <div>
          <p className="text-xs text-muted">Est. Revenue</p>
          <p className="text-lg font-medium">
            {currency} {formatCents(estimatedRevenueCents)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted">Est. Costs</p>
          <p className="text-lg font-medium">
            {currency} {formatCents(estimatedCostCents)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted">Est. Profit</p>
          <p className={`text-lg font-medium ${profitToneClass(estimatedProfitCents)}`}>
            {currency} {formatCents(estimatedProfitCents)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted">Est. Margin</p>
          <p className={`text-lg font-medium ${profitToneClass(estimatedMarginPercent)}`}>
            {formatMarginPercent(estimatedMarginPercent)}
          </p>
        </div>
      </div>

      {/* Profitability Check: a plain-language read of the Estimated
          numbers above, for before the job is accepted. Reuses the
          same estimatedRevenueCents/estimatedProfitCents/
          estimatedMarginPercent already computed for the stat box —
          no new calculation. This is informational only: it states
          profitable/break-even/loss and lets the user decide, it never
          recommends accepting or rejecting the project. */}
      <section className="mt-10 rounded-md border border-rule p-4">
        <h2 className="text-lg font-medium tracking-tight">Profitability Check</h2>

        {estimatedRevenueCents === 0 ? (
          <p className="mt-2 text-sm text-muted">
            Add an estimated revenue to see a profitability check for this project.
          </p>
        ) : (
          <>
            <p className={`mt-2 text-base font-medium ${profitToneClass(estimatedProfitCents)}`}>
              {estimatedProfitCents > 0
                ? "Estimated result: profitable."
                : estimatedProfitCents < 0
                  ? "Estimated result: loss."
                  : "Estimated result: break-even."}
            </p>

            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-xs text-muted">Estimated Revenue</dt>
                <dd>{currency} {formatCents(estimatedRevenueCents)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Estimated Costs</dt>
                <dd>{currency} {formatCents(estimatedCostCents)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Estimated Profit</dt>
                <dd className={profitToneClass(estimatedProfitCents)}>
                  {currency} {formatCents(estimatedProfitCents)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Estimated Margin</dt>
                <dd className={profitToneClass(estimatedMarginPercent)}>
                  {formatMarginPercent(estimatedMarginPercent)}
                </dd>
              </div>
            </dl>
          </>
        )}
      </section>

      {/* Explicit accept action, right after the Profitability Check —
          intentionally not gated by the check's result: the app states
          facts, the user decides. Once accepted_at is set, the action
          is hidden rather than shown-disabled, since this is a
          one-way, non-reversible decision in this sprint (no un-accept
          workflow requested or built). */}
      <section className="mt-6">
        {project.accepted_at ? (
          <p className="text-sm text-muted">
            This project was accepted on {formatDate(project.accepted_at.slice(0, 10))}.
          </p>
        ) : (
          <AcceptProjectButton projectId={id} />
        )}
      </section>

      {/* Estimated Revenue */}
      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium tracking-tight">Estimated Revenue</h2>
          <Button href={`/dashboard/projects/${id}/estimated-revenue/new`} variant="primary">
            Add Estimated Revenue
          </Button>
        </div>

        {estimatedRevenueRows.length === 0 ? (
          <p className="text-sm text-muted">No estimated revenue entries yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {estimatedRevenueRows.map((estimatedRevenue) => (
              <li
                key={estimatedRevenue.id}
                className="flex items-center justify-between gap-3 rounded-md border border-rule p-3"
              >
                <p className="text-sm">{estimatedRevenue.description}</p>
                <div className="flex items-center gap-4">
                  <p className="text-sm font-medium">
                    {currency} {estimatedRevenue.amount}
                  </p>
                  <Link
                    href={`/dashboard/projects/${id}/estimated-revenue/${estimatedRevenue.id}/edit`}
                    className="text-sm underline underline-offset-2"
                  >
                    Edit
                  </Link>
                  <DeleteEstimatedRevenueButton
                    estimatedRevenueId={estimatedRevenue.id}
                    projectId={id}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Estimated Costs */}
      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium tracking-tight">Estimated Costs</h2>
          <Button href={`/dashboard/projects/${id}/estimated-costs/new`} variant="primary">
            Add Estimated Cost
          </Button>
        </div>

        {estimatedCostRows.length === 0 ? (
          <p className="text-sm text-muted">No estimated cost entries yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {estimatedCostRows.map((estimatedCost) => (
              <li
                key={estimatedCost.id}
                className="flex items-center justify-between gap-3 rounded-md border border-rule p-3"
              >
                <div>
                  <p className="text-sm">{estimatedCost.description}</p>
                  <p className="text-xs text-muted">{estimatedCost.category}</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-sm font-medium">
                    {currency} {estimatedCost.amount}
                  </p>
                  <Link
                    href={`/dashboard/projects/${id}/estimated-costs/${estimatedCost.id}/edit`}
                    className="text-sm underline underline-offset-2"
                  >
                    Edit
                  </Link>
                  <DeleteEstimatedCostButton
                    estimatedCostId={estimatedCost.id}
                    projectId={id}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Estimated vs Actual: a straight side-by-side of the totals
          already shown in the Actual and Estimated boxes above, plus
          their difference. Cost's difference is colored with the sign
          flipped (profitToneClass(-costDiffCents)): a higher actual
          cost than estimated is worse, not better, unlike Revenue and
          Profit where higher-than-estimated is good. */}
      <h2 className="mt-14 text-lg font-medium tracking-tight">Estimated vs Actual</h2>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-rule text-muted">
              <th className="py-2 pr-4 font-medium"></th>
              <th className="py-2 pr-4 font-medium">Estimated</th>
              <th className="py-2 pr-4 font-medium">Actual</th>
              <th className="py-2 font-medium">Difference</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-rule/60">
              <td className="py-2 pr-4 text-muted">Revenue</td>
              <td className="py-2 pr-4">{currency} {formatCents(estimatedRevenueCents)}</td>
              <td className="py-2 pr-4">{currency} {formatCents(revenueCents)}</td>
              <td className={`py-2 ${profitToneClass(revenueDiffCents)}`}>
                {currency} {formatCents(revenueDiffCents)}
              </td>
            </tr>
            <tr className="border-b border-rule/60">
              <td className="py-2 pr-4 text-muted">Costs</td>
              <td className="py-2 pr-4">{currency} {formatCents(estimatedCostCents)}</td>
              <td className="py-2 pr-4">{currency} {formatCents(costCents)}</td>
              <td className={`py-2 ${profitToneClass(-costDiffCents)}`}>
                {currency} {formatCents(costDiffCents)}
              </td>
            </tr>
            <tr className="border-b border-rule/60">
              <td className="py-2 pr-4 text-muted">Profit</td>
              <td className={`py-2 pr-4 ${profitToneClass(estimatedProfitCents)}`}>
                {currency} {formatCents(estimatedProfitCents)}
              </td>
              <td className={`py-2 pr-4 ${profitToneClass(profitCents)}`}>
                {currency} {formatCents(profitCents)}
              </td>
              <td className={`py-2 ${profitToneClass(profitDiffCents)}`}>
                {currency} {formatCents(profitDiffCents)}
              </td>
            </tr>
            <tr>
              <td className="py-2 pr-4 text-muted">Margin</td>
              <td className={`py-2 pr-4 ${profitToneClass(estimatedMarginPercent)}`}>
                {formatMarginPercent(estimatedMarginPercent)}
              </td>
              <td className={`py-2 pr-4 ${profitToneClass(marginPercent)}`}>
                {formatMarginPercent(marginPercent)}
              </td>
              <td className={`py-2 ${profitToneClass(marginDiffPercent)}`}>
                {formatMarginPercent(marginDiffPercent)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  );
}
