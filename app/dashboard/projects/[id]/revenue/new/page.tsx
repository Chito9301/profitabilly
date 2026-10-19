import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createRevenue } from "@/lib/revenue/actions";
import RevenueForm from "../../RevenueForm";
import { getMessages } from "@/lib/i18n/server";

export default async function NewRevenuePage({
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
        {messages.projectDetail.buttons.addRevenue}
      </h1>

      <RevenueForm
        action={createRevenue}
        projectId={projectId}
        submitLabel={messages.projectDetail.buttons.addRevenue}
      />
    </main>
  );
}
