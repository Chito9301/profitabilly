import type { ReactNode } from "react";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Button from "@/components/Button";
import Card from "@/components/Card";
import StatusBadge from "@/components/StatusBadge";
import DeleteRevenueButton from "./DeleteRevenueButton";
import DeleteCostButton from "./DeleteCostButton";
import DeleteEstimatedRevenueButton from "./DeleteEstimatedRevenueButton";
import DeleteEstimatedCostButton from "./DeleteEstimatedCostButton";
import AcceptProjectButton from "./AcceptProjectButton";
import CompleteProjectButton from "./CompleteProjectButton";
import { getMessages } from "@/lib/i18n/server";
import { formatCents, formatMarginPercent, profitToneClass } from "@/lib/finance/money";
import {
  calculateCostVarianceByCategory,
  calculateProjectedFinal,
  calculateTotals,
  compareActualToEstimate,
} from "@/lib/finance/summary";
import { CATEGORIES } from "@/lib/costs/constants";
import type { Revenue, Cost, EstimatedRevenue, EstimatedCost } from "@/types/supabase";

// Month names follow the active language (was the server default).
function formatDate(iso: string, locale: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Presentation-only helpers, local to this page (same convention as the
// Dashboard's Kpi): they receive values already computed and formatted
// above and do no math. Currency is rendered as a small prefix so long
// amounts stay compact on a phone.
function Stat({
  label,
  currency,
  value,
  tone = "",
}: {
  label: string;
  currency?: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 flex flex-wrap items-baseline gap-x-1.5">
        {currency && (
          <span className="text-xs font-medium text-muted">{currency}</span>
        )}
        <span className={`text-xl font-semibold ${tone}`}>{value}</span>
      </dd>
    </div>
  );
}

// Section heading with an optional primary action. Stacks on mobile (the
// action becomes full-width, 48px tall); sits inline from `sm` up.
function SectionHeader({
  title,
  level = 3,
  children,
}: {
  title: string;
  level?: 2 | 3;
  children?: ReactNode;
}) {
  const Heading = level === 2 ? "h2" : "h3";
  return (
    <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Heading
        className={
          level === 2
            ? "text-lg font-medium tracking-tight"
            : "text-base font-medium tracking-tight"
        }
      >
        {title}
      </Heading>
      {children}
    </div>
  );
}

const EDIT_LINK =
  "inline-flex min-h-12 items-center text-sm font-medium underline underline-offset-2 sm:min-h-10";

// One ledger row: description/meta on the left, amount + actions on the
// right. On mobile the amount and actions drop below the description so
// nothing is squeezed and the row never overflows.
function EntryRow({
  description,
  meta,
  amount,
  currency,
  editHref,
  editLabel,
  deleteButton,
}: {
  description: string;
  meta?: string;
  amount: string;
  currency: string;
  editHref: string;
  editLabel: string;
  deleteButton: ReactNode;
}) {
  return (
    <li className="flex flex-col gap-1 rounded-lg border border-rule bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <p className="break-words text-sm">{description}</p>
        {meta && <p className="text-xs text-muted">{meta}</p>}
      </div>
      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <p className="whitespace-nowrap text-sm font-semibold">
          {currency} {amount}
        </p>
        <div className="flex items-center gap-4">
          <Link href={editHref} className={EDIT_LINK}>
            {editLabel}
          </Link>
          {deleteButton}
        </div>
      </div>
    </li>
  );
}

const TH = "py-2 pr-4 font-medium whitespace-nowrap";
const TD = "py-2 pr-4 whitespace-nowrap";

// Query-string flags set by the redirects in lib/*/actions.ts. The text
// shown for each comes from the active dictionary (projectDetail.messages).
const SUCCESS_KEYS = [
  "revenueCreated",
  "revenueUpdated",
  "revenueDeleted",
  "costCreated",
  "costUpdated",
  "costDeleted",
  "estimatedRevenueCreated",
  "estimatedRevenueUpdated",
  "estimatedRevenueDeleted",
  "estimatedCostCreated",
  "estimatedCostUpdated",
  "estimatedCostDeleted",
  "accepted",
  "completed",
] as const;

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id } = await params;
  const searchParamsResolved = await searchParams;
  const { locale, messages } = await getMessages();
  const t = messages.projects;
  const d = messages.projectDetail;
  const categoryLabel = (category: string) =>
    messages.entries.categories[category as keyof typeof messages.entries.categories] ??
    category;
  const statusLabel = (status: string) =>
    t.status[status as keyof typeof t.status] ?? status;

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

  // Totals, comparison, category variance and projection are computed in
  // lib/finance/summary.ts (Mini-Sprint 53) — the same logic that used to
  // be written inline here, moved unchanged.
  const actualTotals = calculateTotals(
    revenueRows.map((r) => r.amount),
    costRows.map((c) => c.amount),
  );
  const { revenueCents, costCents, profitCents, marginPercent } = actualTotals;

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

  const estimatedTotals = calculateTotals(
    estimatedRevenueRows.map((r) => r.amount),
    estimatedCostRows.map((c) => c.amount),
  );
  const {
    revenueCents: estimatedRevenueCents,
    costCents: estimatedCostCents,
    profitCents: estimatedProfitCents,
    marginPercent: estimatedMarginPercent,
  } = estimatedTotals;

  const successKey = SUCCESS_KEYS.find(
    (key) => searchParamsResolved[key] !== undefined,
  );
  const successMessage = successKey ? d.messages[successKey] : null;

  // Estimated vs Actual: plain differences between totals already
  // computed above — not a new calculation engine. Margin difference
  // is null (shown as "N/A") if either side is null, since a
  // percentage-point gap against an undefined margin is meaningless.
  const { revenueDiffCents, costDiffCents, profitDiffCents, marginDiffPercent } =
    compareActualToEstimate(actualTotals, estimatedTotals);

  // Cost Variance by Category: groups the same costRows/estimatedCostRows
  // already loaded above by the existing fixed category list — no new
  // query, no new category, no new sum logic. A category with no rows
  // on either side sums to 0 via sumCents([]), the same safe behavior
  // already used everywhere else for empty lists (not invented data,
  // just an accurate zero).
  const costVarianceByCategory = calculateCostVarianceByCategory(
    CATEGORIES,
    costRows,
    estimatedCostRows,
  );

  // Projected Final Profit: "if the remaining estimate is applied to
  // what's actually happened so far, where would this land?" Once
  // actual already exceeds (or equals) the estimate on either side,
  // there's nothing left to project — Math.max(..., 0) clamps that to
  // zero so an already-realized amount is never added on top of
  // itself (no double counting).
  const {
    projectedFinalRevenueCents,
    projectedFinalCostCents,
    projectedFinalProfitCents,
  } = calculateProjectedFinal(actualTotals, estimatedTotals);

  return (
    <main className="mx-auto max-w-4xl px-6 py-8 sm:py-12">
      {/* 1. Header: project, customer, status */}
      <Link
        href="/dashboard/projects"
        className="inline-flex min-h-12 items-center text-sm text-muted underline underline-offset-2 sm:min-h-10"
      >
        ← {t.title}
      </Link>

      <header className="mt-1 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="break-words text-page font-semibold">
              {project.name}
            </h1>
            <StatusBadge
              status={project.status}
              label={statusLabel(project.status)}
            />
          </div>
          {customer?.name && (
            <p className="mt-1 text-sm text-muted">{customer.name}</p>
          )}
        </div>
        <Button
          href={`/dashboard/projects/${id}/edit`}
          variant="secondary"
          className="w-full sm:w-auto"
        >
          {messages.common.edit}
        </Button>
      </header>

      {successMessage && (
        <p
          role="status"
          className="mt-6 rounded-lg bg-profit/10 px-4 py-3 text-sm text-profit-strong"
        >
          {successMessage}
        </p>
      )}

      {/* 2. Profitability overview. A plain-language read of the
          Estimated numbers, for before the job is accepted. Reuses the
          estimated values computed above — no new calculation. It is
          informational only: it states profitable/break-even/loss and
          never recommends accepting or rejecting the project. */}
      <section aria-labelledby="profitability-check" className="mt-8">
        <Card>
          <h2
            id="profitability-check"
            className="text-lg font-medium tracking-tight"
          >
            {d.profitabilityCheck.title}
          </h2>

          {estimatedRevenueCents === 0 ? (
            <p className="mt-2 text-sm text-muted">
              {d.profitabilityCheck.empty}
            </p>
          ) : (
            <>
              <p
                className={`mt-2 text-base font-medium ${profitToneClass(estimatedProfitCents)}`}
              >
                {estimatedProfitCents > 0
                  ? d.profitabilityCheck.profitable
                  : estimatedProfitCents < 0
                    ? d.profitabilityCheck.loss
                    : d.profitabilityCheck.breakEven}
              </p>

              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-rule pt-4 lg:grid-cols-4">
                <Stat
                  label={d.stats.estimatedRevenue}
                  currency={currency}
                  value={formatCents(estimatedRevenueCents)}
                />
                <Stat
                  label={d.stats.estimatedCosts}
                  currency={currency}
                  value={formatCents(estimatedCostCents)}
                />
                <Stat
                  label={d.stats.estimatedProfit}
                  currency={currency}
                  value={formatCents(estimatedProfitCents)}
                  tone={profitToneClass(estimatedProfitCents)}
                />
                <Stat
                  label={d.stats.estimatedMargin}
                  value={formatMarginPercent(estimatedMarginPercent)}
                  tone={profitToneClass(estimatedMarginPercent)}
                />
              </dl>
            </>
          )}
        </Card>
      </section>

      {/* 3. Actual financials. Profit = Total Revenue - Total Costs, and
          Margin = Profit / Revenue x 100, both computed from exact
          integer-cent totals (lib/finance/money.ts) — not from these
          already-rounded display strings. */}
      <section aria-labelledby="actual-heading" className="mt-10">
        <h2
          id="actual-heading"
          className="mb-3 text-lg font-medium tracking-tight"
        >
          {d.sections.actual}
        </h2>
        <Card>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-4 lg:grid-cols-4">
            <Stat
              label={t.fields.revenue}
              currency={currency}
              value={formatCents(revenueCents)}
            />
            <Stat
              label={t.fields.costs}
              currency={currency}
              value={formatCents(costCents)}
            />
            <Stat
              label={t.fields.profit}
              currency={currency}
              value={formatCents(profitCents)}
              tone={profitToneClass(profitCents)}
            />
            <Stat
              label={t.fields.margin}
              value={formatMarginPercent(marginPercent)}
              tone={profitToneClass(marginPercent)}
            />
          </dl>
        </Card>

        <div className="mt-6">
          <SectionHeader title={t.fields.revenue}>
            <Button
              href={`/dashboard/projects/${id}/revenue/new`}
              variant="primary"
              className="w-full sm:w-auto"
            >
              {d.buttons.addRevenue}
            </Button>
          </SectionHeader>

          {revenueRows.length === 0 ? (
            <p className="text-sm text-muted">{d.empty.revenue}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {revenueRows.map((revenue) => (
                <EntryRow
                  key={revenue.id}
                  description={revenue.description}
                  meta={formatDate(revenue.date, locale)}
                  amount={revenue.amount}
                  currency={currency}
                  editHref={`/dashboard/projects/${id}/revenue/${revenue.id}/edit`}
                  editLabel={messages.common.edit}
                  deleteButton={
                    <DeleteRevenueButton revenueId={revenue.id} projectId={id} />
                  }
                />
              ))}
            </ul>
          )}
        </div>

        <div className="mt-8">
          <SectionHeader title={t.fields.costs}>
            <Button
              href={`/dashboard/projects/${id}/costs/new`}
              variant="primary"
              className="w-full sm:w-auto"
            >
              {d.buttons.addCost}
            </Button>
          </SectionHeader>

          {costRows.length === 0 ? (
            <p className="text-sm text-muted">{d.empty.costs}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {costRows.map((cost) => (
                <EntryRow
                  key={cost.id}
                  description={cost.description}
                  meta={`${categoryLabel(cost.category)} · ${formatDate(cost.date, locale)}`}
                  amount={cost.amount}
                  currency={currency}
                  editHref={`/dashboard/projects/${id}/costs/${cost.id}/edit`}
                  editLabel={messages.common.edit}
                  deleteButton={
                    <DeleteCostButton costId={cost.id} projectId={id} />
                  }
                />
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* 4. Estimated financials — kept visually and structurally
          separate from Actual: its own heading, stat card and lists,
          backed by separate tables (estimated_revenues /
          estimated_costs), never merged with revenues/costs. */}
      <section aria-labelledby="estimated-heading" className="mt-12">
        <h2
          id="estimated-heading"
          className="mb-3 text-lg font-medium tracking-tight"
        >
          {d.sections.estimated}
        </h2>
        <Card>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-4 lg:grid-cols-4">
            <Stat
              label={d.stats.estRevenueShort}
              currency={currency}
              value={formatCents(estimatedRevenueCents)}
            />
            <Stat
              label={d.stats.estCostsShort}
              currency={currency}
              value={formatCents(estimatedCostCents)}
            />
            <Stat
              label={d.stats.estProfitShort}
              currency={currency}
              value={formatCents(estimatedProfitCents)}
              tone={profitToneClass(estimatedProfitCents)}
            />
            <Stat
              label={d.stats.estMarginShort}
              value={formatMarginPercent(estimatedMarginPercent)}
              tone={profitToneClass(estimatedMarginPercent)}
            />
          </dl>
        </Card>

        <div className="mt-6">
          <SectionHeader title={d.stats.estimatedRevenue}>
            <Button
              href={`/dashboard/projects/${id}/estimated-revenue/new`}
              variant="primary"
              className="w-full sm:w-auto"
            >
              {d.buttons.addEstimatedRevenue}
            </Button>
          </SectionHeader>

          {estimatedRevenueRows.length === 0 ? (
            <p className="text-sm text-muted">{d.empty.estimatedRevenue}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {estimatedRevenueRows.map((estimatedRevenue) => (
                <EntryRow
                  key={estimatedRevenue.id}
                  description={estimatedRevenue.description}
                  amount={estimatedRevenue.amount}
                  currency={currency}
                  editHref={`/dashboard/projects/${id}/estimated-revenue/${estimatedRevenue.id}/edit`}
                  editLabel={messages.common.edit}
                  deleteButton={
                    <DeleteEstimatedRevenueButton
                      estimatedRevenueId={estimatedRevenue.id}
                      projectId={id}
                    />
                  }
                />
              ))}
            </ul>
          )}
        </div>

        <div className="mt-8">
          <SectionHeader title={d.stats.estimatedCosts}>
            <Button
              href={`/dashboard/projects/${id}/estimated-costs/new`}
              variant="primary"
              className="w-full sm:w-auto"
            >
              {d.buttons.addEstimatedCost}
            </Button>
          </SectionHeader>

          {estimatedCostRows.length === 0 ? (
            <p className="text-sm text-muted">{d.empty.estimatedCosts}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {estimatedCostRows.map((estimatedCost) => (
                <EntryRow
                  key={estimatedCost.id}
                  description={estimatedCost.description}
                  meta={categoryLabel(estimatedCost.category)}
                  amount={estimatedCost.amount}
                  currency={currency}
                  editHref={`/dashboard/projects/${id}/estimated-costs/${estimatedCost.id}/edit`}
                  editLabel={messages.common.edit}
                  deleteButton={
                    <DeleteEstimatedCostButton
                      estimatedCostId={estimatedCost.id}
                      projectId={id}
                    />
                  }
                />
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* 5. Estimated vs Actual: a straight side-by-side of the totals
          already shown above, plus their difference. Cost's difference
          is colored with the sign flipped (profitToneClass(-costDiffCents)):
          a higher actual cost than estimated is worse, not better,
          unlike Revenue and Profit. Tables scroll inside their own
          container, so the page itself never scrolls sideways. */}
      <section aria-labelledby="comparison-heading" className="mt-12">
        <h2
          id="comparison-heading"
          className="mb-3 text-lg font-medium tracking-tight"
        >
          {d.sections.comparison}
        </h2>
        <Card className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-rule text-muted">
                <th className={TH}>
                  <span className="sr-only">{d.sections.measure}</span>
                </th>
                <th className={TH}>{d.sections.estimated}</th>
                <th className={TH}>{d.sections.actual}</th>
                <th className="py-2 font-medium whitespace-nowrap">{d.sections.difference}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-rule/60">
                <td className={`${TD} text-muted`}>{t.fields.revenue}</td>
                <td className={TD}>{currency} {formatCents(estimatedRevenueCents)}</td>
                <td className={TD}>{currency} {formatCents(revenueCents)}</td>
                <td className={`py-2 whitespace-nowrap ${profitToneClass(revenueDiffCents)}`}>
                  {currency} {formatCents(revenueDiffCents)}
                </td>
              </tr>
              <tr className="border-b border-rule/60">
                <td className={`${TD} text-muted`}>{t.fields.costs}</td>
                <td className={TD}>{currency} {formatCents(estimatedCostCents)}</td>
                <td className={TD}>{currency} {formatCents(costCents)}</td>
                <td className={`py-2 whitespace-nowrap ${profitToneClass(-costDiffCents)}`}>
                  {currency} {formatCents(costDiffCents)}
                </td>
              </tr>
              <tr className="border-b border-rule/60">
                <td className={`${TD} text-muted`}>{t.fields.profit}</td>
                <td className={`${TD} ${profitToneClass(estimatedProfitCents)}`}>
                  {currency} {formatCents(estimatedProfitCents)}
                </td>
                <td className={`${TD} ${profitToneClass(profitCents)}`}>
                  {currency} {formatCents(profitCents)}
                </td>
                <td className={`py-2 whitespace-nowrap ${profitToneClass(profitDiffCents)}`}>
                  {currency} {formatCents(profitDiffCents)}
                </td>
              </tr>
              <tr>
                <td className={`${TD} text-muted`}>{t.fields.margin}</td>
                <td className={`${TD} ${profitToneClass(estimatedMarginPercent)}`}>
                  {formatMarginPercent(estimatedMarginPercent)}
                </td>
                <td className={`${TD} ${profitToneClass(marginPercent)}`}>
                  {formatMarginPercent(marginPercent)}
                </td>
                <td className={`py-2 whitespace-nowrap ${profitToneClass(marginDiffPercent)}`}>
                  {formatMarginPercent(marginDiffPercent)}
                </td>
              </tr>
            </tbody>
          </table>
        </Card>

        {/* Cost Variance by Category: same Actual - Estimated convention
            and the same inverted tone as the aggregate Costs row above. */}
        <h3 className="mb-3 mt-8 text-base font-medium tracking-tight">
          {d.sections.costVariance}
        </h3>
        <Card className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-rule text-muted">
                <th className={TH}>{messages.common.category}</th>
                <th className={TH}>{d.sections.estimated}</th>
                <th className={TH}>{d.sections.actual}</th>
                <th className="py-2 font-medium whitespace-nowrap">{d.sections.difference}</th>
              </tr>
            </thead>
            <tbody>
              {costVarianceByCategory.map(
                ({ category, estimatedCategoryCents, actualCategoryCents, diffCategoryCents }) => (
                  <tr key={category} className="border-b border-rule/60 last:border-b-0">
                    <td className={`${TD} text-muted`}>{categoryLabel(category)}</td>
                    <td className={TD}>{currency} {formatCents(estimatedCategoryCents)}</td>
                    <td className={TD}>{currency} {formatCents(actualCategoryCents)}</td>
                    <td className={`py-2 whitespace-nowrap ${profitToneClass(-diffCategoryCents)}`}>
                      {currency} {formatCents(diffCategoryCents)}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </Card>

        {/* Projected Final Profit: informational only, shown only while
            the project is still Active — once Completed/Archived, the
            Actual figures above already are the final result. */}
        {project.status === "Active" && (
          <>
            <h3 className="mt-8 text-base font-medium tracking-tight">
              {d.sections.projectedTitle}
            </h3>
            <p className="mt-1 text-sm text-muted">
              {d.sections.projectedIntro}
            </p>
            <Card className="mt-3">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
                <Stat
                  label={d.stats.projectedRevenue}
                  currency={currency}
                  value={formatCents(projectedFinalRevenueCents)}
                />
                <Stat
                  label={d.stats.projectedCosts}
                  currency={currency}
                  value={formatCents(projectedFinalCostCents)}
                />
                <Stat
                  label={d.stats.projectedProfit}
                  currency={currency}
                  value={formatCents(projectedFinalProfitCents)}
                  tone={profitToneClass(projectedFinalProfitCents)}
                />
              </dl>
            </Card>
          </>
        )}
      </section>

      {/* 6. Project actions. Accept is intentionally not gated by the
          Profitability Check's result: the app states facts, the user
          decides. Once accepted_at is set it is hidden rather than
          shown-disabled (one-way decision). Marking complete is only
          offered while Active — completeProject's own "status =
          Active" guard would reject it otherwise. */}
      <section aria-labelledby="actions-heading" className="mt-12">
        <Card>
          <h2
            id="actions-heading"
            className="text-lg font-medium tracking-tight"
          >
            {d.sections.actionsTitle}
          </h2>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start">
            {project.accepted_at ? (
              <p className="text-sm text-muted">
                {d.sections.acceptedOn} {formatDate(project.accepted_at.slice(0, 10), locale)}.
              </p>
            ) : (
              <AcceptProjectButton projectId={id} />
            )}
            {project.status === "Active" && (
              <CompleteProjectButton projectId={id} />
            )}
          </div>
        </Card>
      </section>
    </main>
  );
}
