import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createEstimatedCost } from "@/lib/estimated-costs/actions";
import EstimatedCostForm from "../../EstimatedCostForm";

export default async function NewEstimatedCostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();
  if (!project) notFound();

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <Link
        href={`/dashboard/projects/${projectId}`}
        className="text-sm text-muted underline underline-offset-2"
      >
        ← Project
      </Link>

      <h1 className="mb-6 mt-2 text-2xl font-medium tracking-tight">
        Add Estimated Cost
      </h1>

      <EstimatedCostForm
        action={createEstimatedCost}
        projectId={projectId}
        submitLabel="Add Estimated Cost"
      />
    </main>
  );
}
