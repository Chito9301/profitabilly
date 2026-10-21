import { sumCents, calculateMarginPercent } from "@/lib/finance/money";

// Mini-Sprint 53 — single home for the financial aggregation that used to
// be written inline in the Projects list, the Project detail page and the
// Dashboard. Every function here is a literal move of that inline code:
// same operations, same order, same helpers from lib/finance/money.ts
// (sumCents / calculateMarginPercent) — no new formula, no rounding
// change. money.ts itself is untouched. Pure TypeScript: no React, no
// Next, no Supabase, so it can be unit-checked anywhere.
//
// All values are integer cents; margins are percentages (or null when
// revenue is 0, exactly as calculateMarginPercent returns).

export type FinancialTotals = {
  revenueCents: number;
  costCents: number;
  profitCents: number;
  marginPercent: number | null;
};

// Revenue, costs, profit and margin from lists of amount strings
// (numeric(12,2) as returned by PostgREST). An empty list sums to 0.
export function calculateTotals(
  revenueAmounts: string[],
  costAmounts: string[],
): FinancialTotals {
  const revenueCents = sumCents(revenueAmounts);
  const costCents = sumCents(costAmounts);
  const profitCents = revenueCents - costCents;
  const marginPercent = calculateMarginPercent(profitCents, revenueCents);
  return { revenueCents, costCents, profitCents, marginPercent };
}

// Groups the amounts of rows that carry a project_id, preserving row
// order within each project (used by the Projects list and the Dashboard).
export function groupAmountsByProject(
  rows: { project_id: string; amount: string }[],
): Map<string, string[]> {
  const byProject = new Map<string, string[]>();
  for (const row of rows) {
    const list = byProject.get(row.project_id) ?? [];
    list.push(row.amount);
    byProject.set(row.project_id, list);
  }
  return byProject;
}

export type EstimateComparison = {
  revenueDiffCents: number;
  costDiffCents: number;
  profitDiffCents: number;
  marginDiffPercent: number | null;
};

// Estimated vs Actual: plain differences (Actual - Estimated) between two
// sets of totals. The margin difference is null if either margin is null,
// since a percentage-point gap against an undefined margin is meaningless.
export function compareActualToEstimate(
  actual: FinancialTotals,
  estimated: FinancialTotals,
): EstimateComparison {
  const revenueDiffCents = actual.revenueCents - estimated.revenueCents;
  const costDiffCents = actual.costCents - estimated.costCents;
  const profitDiffCents = actual.profitCents - estimated.profitCents;
  const marginDiffPercent =
    actual.marginPercent !== null && estimated.marginPercent !== null
      ? actual.marginPercent - estimated.marginPercent
      : null;
  return { revenueDiffCents, costDiffCents, profitDiffCents, marginDiffPercent };
}

export type CategoryVariance<C extends string = string> = {
  category: C;
  estimatedCategoryCents: number;
  actualCategoryCents: number;
  diffCategoryCents: number;
};

// Cost Variance by Category: for each category of the given fixed list
// (in that order), sums the estimated and the actual cost rows of that
// category and returns Actual - Estimated. A category with no rows on
// either side sums to 0.
export function calculateCostVarianceByCategory<C extends string>(
  categories: readonly C[],
  actualCostRows: { category: string; amount: string }[],
  estimatedCostRows: { category: string; amount: string }[],
): CategoryVariance<C>[] {
  return categories.map((category) => {
    const estimatedCategoryCents = sumCents(
      estimatedCostRows.filter((c) => c.category === category).map((c) => c.amount),
    );
    const actualCategoryCents = sumCents(
      actualCostRows.filter((c) => c.category === category).map((c) => c.amount),
    );
    return {
      category,
      estimatedCategoryCents,
      actualCategoryCents,
      diffCategoryCents: actualCategoryCents - estimatedCategoryCents,
    };
  });
}

export type ProjectedFinal = {
  remainingEstimatedRevenueCents: number;
  remainingEstimatedCostCents: number;
  projectedFinalRevenueCents: number;
  projectedFinalCostCents: number;
  projectedFinalProfitCents: number;
};

// Projected Final Profit: "if the remaining estimate is applied to what
// has actually happened so far, where would this land?" Once actual
// already reaches the estimate on either side nothing is left to project:
// Math.max(..., 0) clamps the remainder to zero, so an already-realized
// amount is never added on top of itself.
export function calculateProjectedFinal(
  actual: FinancialTotals,
  estimated: FinancialTotals,
): ProjectedFinal {
  const remainingEstimatedRevenueCents = Math.max(
    estimated.revenueCents - actual.revenueCents,
    0,
  );
  const remainingEstimatedCostCents = Math.max(
    estimated.costCents - actual.costCents,
    0,
  );
  const projectedFinalRevenueCents =
    actual.revenueCents + remainingEstimatedRevenueCents;
  const projectedFinalCostCents = actual.costCents + remainingEstimatedCostCents;
  const projectedFinalProfitCents =
    projectedFinalRevenueCents - projectedFinalCostCents;
  return {
    remainingEstimatedRevenueCents,
    remainingEstimatedCostCents,
    projectedFinalRevenueCents,
    projectedFinalCostCents,
    projectedFinalProfitCents,
  };
}
