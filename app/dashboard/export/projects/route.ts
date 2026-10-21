import writeExcelFile from "write-excel-file/node";
import { createClient } from "@/lib/supabase/server";
import { getMessages } from "@/lib/i18n/server";
import { calculateTotals, groupAmountsByProject } from "@/lib/finance/summary";
import type { Project } from "@/types/supabase";

// Mini-Sprint 54 — Excel export of the user's projects (one row per project).
//
// Security model (same as the Projects page):
// - Path is under /dashboard, so middleware.ts already redirects anonymous
//   visitors; the handler still verifies the session itself with
//   supabase.auth.getUser() and answers 401 without a user.
// - Uses the server Supabase client (anon key + the user's session cookie),
//   so RLS applies; every query is also filtered explicitly by user_id.
// - No service_role key, no external service, and nothing is read from the
//   request (no query string, no body, no ids) — the report is built only
//   from what the authenticated user may read.
// - The response is private/no-store.
//
// Cell policy:
// - User-written text (project/customer names) is always written as an
//   explicit String cell, never as a Formula, so a value such as
//   "=1+1" is just text.
// - Money: totals are summed in integer cents by lib/finance/summary.ts and
//   converted to a decimal number only when the cell is written; the currency
//   code is its own column (no symbol is assumed).
// - Margin: the unrounded value from calculateTotals / 100, shown as 0.00%.
//   When revenue is 0 the margin is undefined (the UI shows "N/A") and the
//   cell is left EMPTY instead of inventing a number.
// - Optional data (customer not found, project not accepted yet) -> empty cell.
// - Dates are Excel date cells built from the UTC calendar date
//   (YYYY-MM-DD of the stored ISO value, like the UI does), shown as
//   yyyy-mm-dd, so there is no timezone shift.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  Pragma: "no-cache",
  Vary: "Cookie, Accept-Language",
  "X-Content-Type-Options": "nosniff",
};

function jsonError(status: number, error: string): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { ...PRIVATE_HEADERS, "Content-Type": "application/json" },
  });
}

// "2026-10-05T12:00:00+00:00" -> Date at 00:00 UTC of 2026-10-05, or null.
function utcDateOrNull(iso: string | null | undefined): Date | null {
  const match = iso ? /^(\d{4})-(\d{2})-(\d{2})/.exec(iso) : null;
  if (!match) return null;
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return jsonError(401, "unauthorized");

    const { messages } = await getMessages();
    const x = messages.exportProjects;
    const statusLabels: Record<string, string> = messages.projects.status;

    // Same queries and filters as app/dashboard/projects/page.tsx.
    const projectsResult = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    const customersResult = await supabase
      .from("customers")
      .select("id, name")
      .eq("user_id", user.id);
    const profileResult = await supabase
      .from("profiles")
      .select("currency")
      .eq("id", user.id)
      .single();
    const revenuesResult = await supabase
      .from("revenues")
      .select("project_id, amount")
      .eq("user_id", user.id);
    const costsResult = await supabase
      .from("costs")
      .select("project_id, amount")
      .eq("user_id", user.id);

    if (
      projectsResult.error ||
      customersResult.error ||
      revenuesResult.error ||
      costsResult.error
    ) {
      return jsonError(500, "export_failed");
    }

    const projects: Project[] = projectsResult.data ?? [];
    const customerNameById = new Map(
      (customersResult.data ?? []).map(
        (c: { id: string; name: string }): [string, string] => [c.id, c.name],
      ),
    );
    const currency = profileResult.data?.currency ?? "USD";
    const revenueAmountsByProject = groupAmountsByProject(revenuesResult.data ?? []);
    const costAmountsByProject = groupAmountsByProject(costsResult.data ?? []);

    const header = [
      x.columns.project,
      x.columns.customer,
      x.columns.status,
      x.columns.created,
      x.columns.accepted,
      x.columns.currency,
      x.columns.revenue,
      x.columns.costs,
      x.columns.profit,
      x.columns.margin,
    ].map((text) => ({ value: text, type: String, fontWeight: "bold" as const }));

    const dataRows = projects.map((project) => {
      const totals = calculateTotals(
        revenueAmountsByProject.get(project.id) ?? [],
        costAmountsByProject.get(project.id) ?? [],
      );
      const customerName = customerNameById.get(project.customer_id);
      const created = utcDateOrNull(project.created_at);
      const accepted = utcDateOrNull(project.accepted_at);
      const money = (cents: number) => ({
        value: cents / 100,
        type: Number,
        format: "#,##0.00",
      });
      return [
        { value: project.name, type: String },
        customerName ? { value: customerName, type: String } : null,
        { value: statusLabels[project.status] ?? project.status, type: String },
        created ? { value: created, type: Date, format: "yyyy-mm-dd" } : null,
        accepted ? { value: accepted, type: Date, format: "yyyy-mm-dd" } : null,
        { value: currency, type: String },
        money(totals.revenueCents),
        money(totals.costCents),
        money(totals.profitCents),
        totals.marginPercent === null
          ? null
          : { value: totals.marginPercent / 100, type: Number, format: "0.00%" },
      ];
    });

    const buffer = await writeExcelFile([header, ...dataRows], {
      sheet: x.sheetName,
      columns: [
        { width: 32 },
        { width: 26 },
        { width: 14 },
        { width: 12 },
        { width: 12 },
        { width: 10 },
        { width: 18 },
        { width: 18 },
        { width: 18 },
        { width: 16 },
      ],
      stickyRowsCount: 1,
    }).toBuffer();

    // Generation date in UTC; the prefix comes from the dictionary
    // (ASCII) and is sanitized anyway so the header can never be injected.
    const day = new Date().toISOString().slice(0, 10);
    const prefix = x.fileName.replace(/[^A-Za-z0-9_-]/g, "");
    const fileName = `${prefix}-${day}.xlsx`;

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        ...PRIVATE_HEADERS,
        "Content-Type": XLSX_MIME,
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    // Log only the message: never the rows or any user data.
    console.error(
      "Projects export failed:",
      error instanceof Error ? error.message : "unknown error",
    );
    return jsonError(500, "export_failed");
  }
}
