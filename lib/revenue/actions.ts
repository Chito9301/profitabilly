"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  validateDescription,
  validateAmount,
  validateDate,
  projectBelongsToUser,
} from "@/lib/finance/validation";

export type RevenueFormState = {
  error?: string;
};

function requiredField(formData: FormData, field: string): string | null {
  const value = formData.get(field);
  if (typeof value !== "string" || value.trim().length === 0) return null;
  return value.trim();
}

export async function createRevenue(
  _prevState: RevenueFormState,
  formData: FormData,
): Promise<RevenueFormState> {
  const projectId = requiredField(formData, "projectId");
  if (!projectId) return { error: "Something went wrong. Please try again." };

  const description = validateDescription(formData);
  if ("error" in description) return { error: description.error };
  const amount = validateAmount(formData);
  if ("error" in amount) return { error: amount.error };
  const date = validateDate(formData);
  if ("error" in date) return { error: date.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The page already checks auth before rendering the form, but a
  // server action is a public endpoint in its own right, so it must
  // re-verify rather than trust that the page did.
  if (!user) redirect("/login");

  if (!(await projectBelongsToUser(supabase, projectId, user.id))) {
    return { error: "Please select a valid project." };
  }

  const { error } = await supabase.from("revenues").insert({
    user_id: user.id, // from the session, never from the submitted form
    project_id: projectId,
    description: description.value,
    amount: amount.value,
    date: date.value,
  });

  if (error) {
    return { error: "Could not save the revenue entry. Please try again." };
  }

  redirect(`/dashboard/projects/${projectId}?revenueCreated=1`);
}

export async function updateRevenue(
  _prevState: RevenueFormState,
  formData: FormData,
): Promise<RevenueFormState> {
  const id = requiredField(formData, "id");
  const projectId = requiredField(formData, "projectId");
  if (!id || !projectId) return { error: "Something went wrong. Please try again." };

  const description = validateDescription(formData);
  if ("error" in description) return { error: description.error };
  const amount = validateAmount(formData);
  if ("error" in amount) return { error: amount.error };
  const date = validateDate(formData);
  if ("error" in date) return { error: date.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  if (!(await projectBelongsToUser(supabase, projectId, user.id))) {
    return { error: "Please select a valid project." };
  }

  // .eq("user_id", user.id) scopes the write to rows this user owns —
  // RLS enforces this too, but this keeps the query's intent explicit.
  // .select("id").single() distinguishes an actual update (row
  // returned) from zero rows matched (wrong id, or another user's
  // revenue entry) or a real DB error; without it a zero-row update
  // reports no `error` and would look like success.
  const { data: updated, error } = await supabase
    .from("revenues")
    .update({
      description: description.value,
      amount: amount.value,
      date: date.value,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .single();

  if (error || !updated) {
    return {
      error: "Could not update the revenue entry. It may not exist or you may not have access to it.",
    };
  }

  redirect(`/dashboard/projects/${projectId}?revenueUpdated=1`);
}

export async function deleteRevenue(
  id: string,
  projectId: string,
  _prevState: RevenueFormState,
  _formData: FormData,
): Promise<RevenueFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Same zero-row reasoning as updateRevenue above.
  const { data: deleted, error } = await supabase
    .from("revenues")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .single();

  if (error || !deleted) {
    return {
      error: "Could not delete the revenue entry. It may not exist or you may not have access to it.",
    };
  }

  redirect(`/dashboard/projects/${projectId}?revenueDeleted=1`);
}
