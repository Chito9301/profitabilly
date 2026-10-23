import type { createClient } from "@/lib/supabase/server";
import { calculateTotals, groupAmountsByProject } from "@/lib/finance/summary";
import type { Project } from "@/types/supabase";

// Mini-Sprint 55 — data for the PDF export of projects.
//
// This module mirrors, query for query, what the Excel export (Mini-Sprint
// 54, app/dashboard/export/projects/route.ts) reads: the same five queries,
// the same explicit `user_id` filters, the same ordering, and the same
// calculateTotals / groupAmountsByProject helpers from
// lib/finance/summary.ts. It deliberately lives in its own file so the
// already-tested Excel route handler is NOT modified. No financial formula
// is written here: every figure is an integer-cent value returned by
// lib/finance/summary.ts.
//
// Security: the caller passes the *server* Supabase client (anon key + the
// user's session, so RLS applies) and the id obtained from
// supabase.auth.getUser(). Nothing here reads from the request.

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type ProjectReportRow = {
  id: string;
  name: string;
  // null = the customer was not found (shown as an empty cell).
  customerName: string | null;
  // Stored value ("Active" | "Completed" | "Archived"); the label is
  // translated by the consumer.
  status: string;
  // YYYY-MM-DD (UTC calendar date of the stored timestamp), or null.
  createdYmd: string | null;
  acceptedYmd: string | null;
  revenueCents: number;
  costCents: number;
  profitCents: number;
  // null when revenue is 0 (undefined margin) — never an invented number.
  marginPercent: number | null;
};

export type ProjectsReport = {
  currency: string;
  rows: ProjectReportRow[];
};

// "2026-10-05T12:00:00+00:00" -> "2026-10-05", or null. Same rule as the
// Excel export: the calendar date of the stored ISO string, no timezone
// conversion.
export function ymdOrNull(iso: string | null | undefined): string | null {
  const match = iso ? /^(\d{4})-(\d{2})-(\d{2})/.exec(iso) : null;
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
}

// Throws on any query error; the Route Handler turns that into a generic
// 500 so no internal detail reaches the browser.
export async function loadProjectsReport(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<ProjectsReport> {
  // Same queries and filters as the Excel export / Projects page.
  const projectsResult = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  const customersResult = await supabase
    .from("customers")
    .select("id, name")
    .eq("user_id", userId);
  const profileResult = await supabase
    .from("profiles")
    .select("currency")
    .eq("id", userId)
    .single();
  const revenuesResult = await supabase
    .from("revenues")
    .select("project_id, amount")
    .eq("user_id", userId);
  const costsResult = await supabase
    .from("costs")
    .select("project_id, amount")
    .eq("user_id", userId);

  if (
    projectsResult.error ||
    customersResult.error ||
    revenuesResult.error ||
    costsResult.error
  ) {
    throw new Error("projects report query failed");
  }

  const projects: Project[] = projectsResult.data ?? [];
  const customerNameById = new Map<string, string>(
    (customersResult.data ?? []).map(
      (c: { id: string; name: string }): [string, string] => [c.id, c.name],
    ),
  );
  const currency = profileResult.data?.currency ?? "USD";
  const revenueAmountsByProject = groupAmountsByProject(revenuesResult.data ?? []);
  const costAmountsByProject = groupAmountsByProject(costsResult.data ?? []);

  const rows: ProjectReportRow[] = projects.map((project) => {
    const totals = calculateTotals(
      revenueAmountsByProject.get(project.id) ?? [],
      costAmountsByProject.get(project.id) ?? [],
    );
    return {
      id: project.id,
      name: project.name,
      customerName: customerNameById.get(project.customer_id) ?? null,
      status: project.status,
      createdYmd: ymdOrNull(project.created_at),
      acceptedYmd: ymdOrNull(project.accepted_at),
      revenueCents: totals.revenueCents,
      costCents: totals.costCents,
      profitCents: totals.profitCents,
      marginPercent: totals.marginPercent,
    };
  });

  return { currency, rows };
}
