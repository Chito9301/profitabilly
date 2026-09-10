import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Button from "@/components/Button";
import DeleteProjectButton from "./DeleteProjectButton";
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
                <th className="py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((project) => (
                <tr key={project.id} className="border-b border-rule/60">
                  <td className="py-3 pr-4">{project.name}</td>
                  <td className="py-3 pr-4 text-muted">
                    {customerNameById.get(project.customer_id) ?? "—"}
                  </td>
                  <td className="py-3 pr-4">
                    <StatusBadge status={project.status} />
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
              ))}
            </tbody>
          </table>

          <ul className="flex flex-col gap-3 md:hidden">
            {rows.map((project) => (
              <li key={project.id} className="rounded-md border border-rule p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{project.name}</p>
                    <p className="text-sm text-muted">
                      {customerNameById.get(project.customer_id) ?? "—"}
                    </p>
                  </div>
                  <StatusBadge status={project.status} />
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
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
