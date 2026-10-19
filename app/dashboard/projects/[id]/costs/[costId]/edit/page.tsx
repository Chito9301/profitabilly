import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateCost } from "@/lib/costs/actions";
import CostForm from "../../../CostForm";
import { getMessages } from "@/lib/i18n/server";

export default async function EditCostPage({
  params,
}: {
  params: Promise<{ id: string; costId: string }>;
}) {
  const { id: projectId, costId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Scoped to id + project_id + user_id: RLS already hides other
  // users' rows, so a wrong id and someone else's entry look identical
  // here — both just come back empty, and both render as "not found".
  const { data: cost } = await supabase
    .from("costs")
    .select("*")
    .eq("id", costId)
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!cost) notFound();

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
        {messages.projectDetail.buttons.editCost}
      </h1>

      <CostForm
        action={updateCost}
        projectId={projectId}
        defaultValues={cost}
        submitLabel={messages.common.saveChanges}
      />
    </main>
  );
}
