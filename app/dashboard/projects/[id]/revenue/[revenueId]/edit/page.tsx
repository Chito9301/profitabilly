import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateRevenue } from "@/lib/revenue/actions";
import RevenueForm from "../../../RevenueForm";

export default async function EditRevenuePage({
  params,
}: {
  params: Promise<{ id: string; revenueId: string }>;
}) {
  const { id: projectId, revenueId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Scoped to id + project_id + user_id: RLS already hides other
  // users' rows, so a wrong id and someone else's entry look identical
  // here — both just come back empty, and both render as "not found".
  const { data: revenue } = await supabase
    .from("revenues")
    .select("*")
    .eq("id", revenueId)
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!revenue) notFound();

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <Link
        href={`/dashboard/projects/${projectId}`}
        className="text-sm text-muted underline underline-offset-2"
      >
        ← Project
      </Link>

      <h1 className="mb-6 mt-2 text-2xl font-medium tracking-tight">
        Edit Revenue
      </h1>

      <RevenueForm
        action={updateRevenue}
        projectId={projectId}
        defaultValues={revenue}
        submitLabel="Save changes"
      />
    </main>
  );
}
