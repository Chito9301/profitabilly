import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateEstimatedCost } from "@/lib/estimated-costs/actions";
import EstimatedCostForm from "../../../EstimatedCostForm";

export default async function EditEstimatedCostPage({
  params,
}: {
  params: Promise<{ id: string; estimatedCostId: string }>;
}) {
  const { id: projectId, estimatedCostId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: estimatedCost } = await supabase
    .from("estimated_costs")
    .select("*")
    .eq("id", estimatedCostId)
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!estimatedCost) notFound();

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <Link
        href={`/dashboard/projects/${projectId}`}
        className="text-sm text-muted underline underline-offset-2"
      >
        ← Project
      </Link>

      <h1 className="mb-6 mt-2 text-2xl font-medium tracking-tight">
        Edit Estimated Cost
      </h1>

      <EstimatedCostForm
        action={updateEstimatedCost}
        projectId={projectId}
        defaultValues={estimatedCost}
        submitLabel="Save changes"
      />
    </main>
  );
}
