import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Button from "@/components/Button";
import StatusBadge from "@/components/StatusBadge";
import DeleteProjectButton from "./DeleteProjectButton";
import { getMessages } from "@/lib/i18n/server";
import { formatCents, formatMarginPercent, profitToneClass } from "@/lib/finance/money";
import { calculateTotals, groupAmountsByProject } from "@/lib/finance/summary";
import type { Project } from "@/types/supabase";

export default async function ProjectsPage({
  searchParams,
}: {
  // Next 15 passes searchParams as a Promise.
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { messages } = await getMessages();
  const t = messages.projects;

  // Query-string flags are unchanged; only the text shown for each comes
  // from the active dictionary.
  const SUCCESS_MESSAGES: Record<string, string> = {
    created: t.messages.created,
    updated: t.messages.updated,
    deleted: t.messages.deleted,
  };
  const statusLabel = (status: string) =>
    t.status[status as keyof typeof t.status] ?? status;

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

  // Grouping and totals live in lib/finance/summary.ts (Mini-Sprint 53);
  // the logic is the same one that used to be written inline here.
  const revenueAmountsByProject = groupAmountsByProject(revenues ?? []);
  const costAmountsByProject = groupAmountsByProject(costs ?? []);

  // A project with no revenue/cost rows simply has no entry in either
  // map, so `.get(id) ?? []` below is an empty list — sumCents([]) is
  // 0, not an error, so it can never produce an incorrect total.
  function projectTotals(projectId: string) {
    return calculateTotals(
      revenueAmountsByProject.get(projectId) ?? [],
      costAmountsByProject.get(projectId) ?? [],
    );
  }

  const successKey = Object.keys(SUCCESS_MESSAGES).find(
    (key) => params[key] !== undefined,
  );
  const successMessage = successKey ? SUCCESS_MESSAGES[successKey] : null;

  const rows: Project[] = projects ?? [];

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <Link href="/dashboard" className="text-sm text-muted underline underline-offset-2">
        ← {messages.nav.dashboard}
      </Link>

      <div className="mb-8 mt-2 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-medium tracking-tight">{t.title}</h1>
        <Button href="/dashboard/projects/new" variant="primary">
          {t.add}
        </Button>
      </div>

      {successMessage && (
        <p
          role="status"
          className="mb-6 rounded-md bg-profit/10 px-4 py-2 text-sm text-profit-strong"
        >
          {successMessage}
        </p>
      )}

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-md border border-dashed border-rule py-16 text-center">
          <p className="text-muted">{t.empty}</p>
          <Button href="/dashboard/projects/new" variant="primary">
            {t.add}
          </Button>
        </div>
      ) : (
        <>
          {/* Same desktop-table / mobile-cards split as the customers
              list — a table doesn't fit a phone width. */}
          <table className="hidden w-full text-left text-sm md:table">
            <thead>
              <tr className="border-b border-rule text-muted">
                <th className="py-2 pr-4 font-medium">{messages.common.name}</th>
                <th className="py-2 pr-4 font-medium">{t.fields.customer}</th>
                <th className="py-2 pr-4 font-medium">{messages.common.status}</th>
                <th className="py-2 pr-4 font-medium">{t.fields.revenue}</th>
                <th className="py-2 pr-4 font-medium">{t.fields.costs}</th>
                <th className="py-2 pr-4 font-medium">{t.fields.profit}</th>
                <th className="py-2 pr-4 font-medium">{t.fields.margin}</th>
                <th className="py-2 font-medium">{messages.common.actions}</th>
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
                    <StatusBadge
                      status={project.status}
                      label={statusLabel(project.status)}
                    />
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
                        {messages.common.edit}
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
                  <StatusBadge
                      status={project.status}
                      label={statusLabel(project.status)}
                    />
                </div>

                <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
                  <div>
                    <p className="text-muted">{t.fields.revenue}</p>
                    <p>{currency} {formatCents(revenueCents)}</p>
                  </div>
                  <div>
                    <p className="text-muted">{t.fields.costs}</p>
                    <p>{currency} {formatCents(costCents)}</p>
                  </div>
                  <div>
                    <p className="text-muted">{t.fields.profit}</p>
                    <p className={profitToneClass(profitCents)}>
                      {currency} {formatCents(profitCents)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted">{t.fields.margin}</p>
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
                    {messages.common.edit}
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
