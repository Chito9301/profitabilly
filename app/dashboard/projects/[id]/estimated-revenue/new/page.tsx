import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createEstimatedRevenue } from "@/lib/estimated-revenue/actions";
import EstimatedRevenueForm from "../../EstimatedRevenueForm";
import { getMessages } from "@/lib/i18n/server";

export default async function NewEstimatedRevenuePage({
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

  const { messages } = await getMessages();

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <Link
        href={`/dashboard/projects/${projectId}`}
        className="text-sm text-muted underline underline-offset-2"
      >
        ← {messages.projects.backToProject}
      </Link>

      <h1 className="mb-6 mt-2 text-2xl font-medium tracking-tight">
        {messages.projectDetail.buttons.addEstimatedRevenue}
      </h1>

      <EstimatedRevenueForm
        action={createEstimatedRevenue}
        projectId={projectId}
        submitLabel={messages.projectDetail.buttons.addEstimatedRevenue}
      />
    </main>
  );
}
