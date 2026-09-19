import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateEstimatedRevenue } from "@/lib/estimated-revenue/actions";
import EstimatedRevenueForm from "../../../EstimatedRevenueForm";

export default async function EditEstimatedRevenuePage({
  params,
}: {
  params: Promise<{ id: string; estimatedRevenueId: string }>;
}) {
  const { id: projectId, estimatedRevenueId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Scoped to id + project_id + user_id: RLS already hides other
  // users' rows, so a wrong id and someone else's entry look identical
  // here — both just come back empty, and both render as "not found".
  const { data: estimatedRevenue } = await supabase
    .from("estimated_revenues")
    .select("*")
    .eq("id", estimatedRevenueId)
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!estimatedRevenue) notFound();

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <Link
        href={`/dashboard/projects/${projectId}`}
        className="text-sm text-muted underline underline-offset-2"
      >
        ← Project
      </Link>

      <h1 className="mb-6 mt-2 text-2xl font-medium tracking-tight">
        Edit Estimated Revenue
      </h1>

      <EstimatedRevenueForm
        action={updateEstimatedRevenue}
        projectId={projectId}
        defaultValues={estimatedRevenue}
        submitLabel="Save changes"
      />
    </main>
  );
}
