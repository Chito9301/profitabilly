"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { STATUSES } from "@/lib/projects/constants";

export type ProjectFormState = {
  error?: string;
};

function requiredField(formData: FormData, field: string): string | null {
  const value = formData.get(field);
  if (typeof value !== "string" || value.trim().length === 0) return null;
  return value.trim();
}

function statusFromForm(formData: FormData): (typeof STATUSES)[number] {
  const raw = formData.get("status");
  return typeof raw === "string" && STATUSES.includes(raw as (typeof STATUSES)[number])
    ? (raw as (typeof STATUSES)[number])
    : "Active";
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

// Confirms customer_id belongs to this user before a project is allowed
// to reference it. The insert/update RLS policies enforce the same
// rule independently (see the migration) — this check exists so a bad
// customer_id gets a clear message here instead of a raw RLS-denial
// error from Supabase.
async function customerBelongsToUser(
  supabase: SupabaseServerClient,
  customerId: string,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("customers")
    .select("id")
    .eq("id", customerId)
    .eq("user_id", userId)
    .single();
  return Boolean(data);
}

export async function createProject(
  _prevState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const name = requiredField(formData, "name");
  const customerId = requiredField(formData, "customerId");

  if (!name) return { error: "Name is required." };
  if (!customerId) return { error: "Please select a customer." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The route/page already checks auth before rendering the form, but a
  // server action is a public endpoint in its own right, so it must
  // re-verify rather than trust that the page did.
  if (!user) redirect("/login");

  if (!(await customerBelongsToUser(supabase, customerId, user.id))) {
    return { error: "Please select a valid customer." };
  }

  const { error } = await supabase.from("projects").insert({
    user_id: user.id, // from the session, never from the submitted form
    customer_id: customerId,
    name,
    status: statusFromForm(formData),
  });

  if (error) {
    return { error: "Could not save the project. Please try again." };
  }

  redirect("/dashboard/projects?created=1");
}

export async function updateProject(
  _prevState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const id = requiredField(formData, "id");
  const name = requiredField(formData, "name");
  const customerId = requiredField(formData, "customerId");

  if (!id) return { error: "Something went wrong. Please try again." };
  if (!name) return { error: "Name is required." };
  if (!customerId) return { error: "Please select a customer." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  if (!(await customerBelongsToUser(supabase, customerId, user.id))) {
    return { error: "Please select a valid customer." };
  }

  // .eq("user_id", user.id) scopes the write to rows this user owns —
  // RLS enforces this too, but this keeps the query's intent explicit.
  // .select("id").single() distinguishes an actual update (row
  // returned) from zero rows matched (wrong id, or another user's
  // project — RLS already hides which) or a real DB error; without it,
  // a zero-row update reports no `error` and would look like success.
  const { data: updated, error } = await supabase
    .from("projects")
    .update({ name, customer_id: customerId, status: statusFromForm(formData) })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .single();

  if (error || !updated) {
    return {
      error: "Could not update the project. It may not exist or you may not have access to it.",
    };
  }

  redirect("/dashboard/projects?updated=1");
}

// Explicit, one-way acceptance: separate from status (which already
// defaults to "Active" automatically on creation — see
// statusFromForm/insert above — so it can't represent a deliberate
// decision) and separate from the general-purpose updateProject form,
// since this isn't an edit of the project's fields, it's a single
// specific fact recorded once. Never called automatically anywhere;
// only ever triggered by the user clicking "Accept Project".
export async function acceptProject(
  id: string,
  _prevState: ProjectFormState,
  _formData: FormData,
): Promise<ProjectFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Same zero-row reasoning as updateProject/deleteProject above.
  const { data: updated, error } = await supabase
    .from("projects")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .single();

  if (error || !updated) {
    return {
      error: "Could not accept the project. It may not exist or you may not have access to it.",
    };
  }

  redirect(`/dashboard/projects/${id}?accepted=1`);
}

// Reuses the existing status column and the existing "Completed" value
// from STATUSES — not a second status system. Kept as its own action
// (rather than routed through the generic updateProject form) for the
// same reason as acceptProject: this is one deliberate lifecycle
// transition, not a general field edit. The extra .eq("status",
// "Active") guard means this can only ever move Active -> Completed
// through this action; it can't complete an already-Archived project
// or silently no-op back onto an already-Completed one.
export async function completeProject(
  id: string,
  _prevState: ProjectFormState,
  _formData: FormData,
): Promise<ProjectFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: updated, error } = await supabase
    .from("projects")
    .update({ status: "Completed" })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "Active")
    .select("id")
    .single();

  if (error || !updated) {
    return {
      error: "Could not mark the project as completed. It may not exist, may not be Active, or you may not have access to it.",
    };
  }

  redirect(`/dashboard/projects/${id}?completed=1`);
}

export async function deleteProject(
  id: string,
  _prevState: ProjectFormState,
  _formData: FormData,
): Promise<ProjectFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Same zero-row reasoning as updateProject above.
  const { data: deleted, error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .single();

  if (error) {
    // 23503 = foreign_key_violation, a standard PostgreSQL SQLSTATE
    // code — see the matching comment in lib/customers/actions.ts
    // deleteCustomer. This project still has revenue or cost entries
    // referencing it (revenues.project_id / costs.project_id are both
    // ON DELETE RESTRICT), so the delete was correctly rejected.
    if (error.code === "23503") {
      return {
        error: "Cannot delete this project because it has revenue or costs associated with it.",
      };
    }
    return { error: "Could not delete the project. Please try again." };
  }

  if (!deleted) {
    return {
      error: "Could not delete the project. It may not exist or you may not have access to it.",
    };
  }

  redirect("/dashboard/projects?deleted=1");
}
