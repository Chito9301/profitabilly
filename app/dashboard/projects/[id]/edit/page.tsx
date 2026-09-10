import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateProject } from "@/lib/projects/actions";
import ProjectForm from "../../ProjectForm";

export default async function EditProjectPage({
  params,
}: {
  // Next 15 passes route params as a Promise.
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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
        Edit Project
      </h1>

      <ProjectForm
        action={updateProject}
        defaultValues={project}
        customers={customers ?? []}
        submitLabel="Save changes"
      />
    </main>
  );
}
