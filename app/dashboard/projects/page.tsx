import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Button from "@/components/Button";
import DeleteProjectButton from "./DeleteProjectButton";
import { sumCents, formatCents, calculateMarginPercent, formatMarginPercent, profitToneClass } from "@/lib/finance/money";
import type { Project } from "@/types/supabase";

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
  created: "Project added.",
  updated: "Project updated.",
  deleted: "Project deleted.",
};

export default async function ProjectsPage({
  searchParams,
}: {
  // Next 15 passes searchParams as a Promise.
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Fetched as a second scoped query rather than an embedded/join
  // select — the hand-written Database type (types/supabase.ts) has no
  // Relationships metadata for PostgREST's embedded-resource typing, so
  // this keeps the query result simply and correctly typed, consistent
  // with how the rest of the app queries so far.
  const { data: customers } = await supabase
    .from("customers")
    .select("id, name")
    .eq("user_id", user.id);

  const customerNameById = new Map(
    (customers ?? []).map(
      (c: { id: string; name: string }): [string, string] => [c.id, c.name],
    ),
  );

  const { data: profile } = await supabase
    .from("profiles")
    .select("currency")
    .eq("id", user.id)
    .single();
  const currency = profile?.currency ?? "USD";

  // Scoped by user_id only (not by project_id) and grouped in memory —
  // RLS on revenues/costs is auth.uid() = user_id, so this can never
  // return another user's rows regardless of which project_id they
  // belong to. Grouping locally avoids a per-project round trip and
  // matches the customerNameById lookup pattern already used above.
  const { data: revenues } = await supabase
    .from("revenues")
    .select("project_id, amount")
    .eq("user_id", user.id);

  const { data: costs } = await supabase
    .from("costs")
    .select("project_id, amount")
    .eq("user_id", user.id);

  const revenueAmountsByProject = new Map<string, string[]>();
  for (const r of revenues ?? []) {
    const list = revenueAmountsByProject.get(r.project_id) ?? [];
    list.push(r.amount);
    revenueAmountsByProject.set(r.project_id, list);
  }

  const costAmountsByProject = new Map<string, string[]>();
  for (const c of costs ?? []) {
    const list = costAmountsByProject.get(c.project_id) ?? [];
    list.push(c.amount);
    costAmountsByProject.set(c.project_id, list);
  }

  // A project with no revenue/cost rows simply has no entry in either
  // map, so `.get(id) ?? []` below is an empty list — sumCents([]) is
  // 0, not an error, so it can never produce an incorrect total.
  function projectTotals(projectId: string) {
    const revenueCents = sumCents(revenueAmountsByProject.get(projectId) ?? []);
    const costCents = sumCents(costAmountsByProject.get(projectId) ?? []);
    const profitCents = revenueCents - costCents;
    const marginPercent = calculateMarginPercent(profitCents, revenueCents);
    return { revenueCents, costCents, profitCents, marginPercent };
  }

  const successKey = Object.keys(SUCCESS_MESSAGES).find(
    (key) => params[key] !== undefined,
  );
  const successMessage = successKey ? SUCCESS_MESSAGES[successKey] : null;

  const rows: Project[] = projects ?? [];

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <Link href="/dashboard" className="text-sm text-muted underline underline-offset-2">
        ← Dashboard
      </Link>

      <div className="mb-8 mt-2 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-medium tracking-tight">Projects</h1>
        <Button href="/dashboard/projects/new" variant="primary">
          Add Project
        </Button>
      </div>

      {successMessage && (
        <p
          role="status"
          className="mb-6 rounded-md bg-profit/10 px-4 py-2 text-sm text-profit"
        >
          {successMessage}
        </p>
      )}

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-md border border-dashed border-rule py-16 text-center">
          <p className="text-muted">No projects yet.</p>
          <Button href="/dashboard/projects/new" variant="primary">
            Add Project
          </Button>
        </div>
      ) : (
        <>
          {/* Same desktop-table / mobile-cards split as the customers
              list — a table doesn't fit a phone width. */}
          <table className="hidden w-full text-left text-sm md:table">
            <thead>
              <tr className="border-b border-rule text-muted">
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 pr-4 font-medium">Customer</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Revenue</th>
                <th className="py-2 pr-4 font-medium">Costs</th>
                <th className="py-2 pr-4 font-medium">Profit</th>
                <th className="py-2 pr-4 font-medium">Margin</th>
                <th className="py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((project) => {
                const { revenueCents, costCents, profitCents, marginPercent } =
                  projectTotals(project.id);
                return (
                <tr key={project.id} className="border-b border-rule/60">
                  <td className="py-3 pr-4">
                    <Link
                      href={`/dashboard/projects/${project.id}`}
                      className="underline underline-offset-2"
                    >
                      {project.name}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-muted">
                    {customerNameById.get(project.customer_id) ?? "—"}
                  </td>
                  <td className="py-3 pr-4">
                    <StatusBadge status={project.status} />
                  </td>
                  <td className="py-3 pr-4 text-muted">
                    {currency} {formatCents(revenueCents)}
                  </td>
                  <td className="py-3 pr-4 text-muted">
                    {currency} {formatCents(costCents)}
                  </td>
                  <td className={`py-3 pr-4 font-medium ${profitToneClass(profitCents)}`}>
                    {currency} {formatCents(profitCents)}
                  </td>
                  <td className={`py-3 pr-4 font-medium ${profitToneClass(marginPercent)}`}>
                    {formatMarginPercent(marginPercent)}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-4">
                      <Link
                        href={`/dashboard/projects/${project.id}/edit`}
                        className="text-sm underline underline-offset-2"
                      >
                        Edit
                      </Link>
                      <DeleteProjectButton projectId={project.id} />
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>

          <ul className="flex flex-col gap-3 md:hidden">
            {rows.map((project) => {
              const { revenueCents, costCents, profitCents, marginPercent } =
                projectTotals(project.id);
              return (
              <li key={project.id} className="rounded-md border border-rule p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      <Link
                        href={`/dashboard/projects/${project.id}`}
                        className="underline underline-offset-2"
                      >
                        {project.name}
                      </Link>
                    </p>
                    <p className="text-sm text-muted">
                      {customerNameById.get(project.customer_id) ?? "—"}
                    </p>
                  </div>
                  <StatusBadge status={project.status} />
                </div>

                <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
                  <div>
                    <p className="text-muted">Revenue</p>
                    <p>{currency} {formatCents(revenueCents)}</p>
                  </div>
                  <div>
                    <p className="text-muted">Costs</p>
                    <p>{currency} {formatCents(costCents)}</p>
                  </div>
                  <div>
                    <p className="text-muted">Profit</p>
                    <p className={profitToneClass(profitCents)}>
                      {currency} {formatCents(profitCents)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted">Margin</p>
                    <p className={profitToneClass(marginPercent)}>
                      {formatMarginPercent(marginPercent)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-4">
                  <Link
                    href={`/dashboard/projects/${project.id}/edit`}
                    className="text-sm underline underline-offset-2"
                  >
                    Edit
                  </Link>
                  <DeleteProjectButton projectId={project.id} />
                </div>
              </li>
              );
            })}
          </ul>
        </>
      )}
    </main>
  );
}
