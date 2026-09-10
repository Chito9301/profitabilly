import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createProject } from "@/lib/projects/actions";
import ProjectForm from "../ProjectForm";

export default async function NewProjectPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: customers } = await supabase
    .from("customers")
    .select("id, name")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <Link
        href="/dashboard/projects"
        className="text-sm text-muted underline underline-offset-2"
      >
        ← Projects
      </Link>

      <h1 className="mb-6 mt-2 text-2xl font-medium tracking-tight">
        Add Project
      </h1>

      {!customers || customers.length === 0 ? (
        // A project must belong to a customer (customer_id is
        // not-null), so there's nothing valid to submit yet.
        <p className="text-sm text-muted">
          You need a customer before adding a project.{" "}
          <Link
            href="/dashboard/customers/new"
            className="text-ink underline underline-offset-2"
          >
            Add a customer
          </Link>{" "}
          first.
        </p>
      ) : (
        <ProjectForm
          action={createProject}
          customers={customers}
          submitLabel="Add Project"
        />
      )}
    </main>
  );
}
