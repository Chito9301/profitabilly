"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMessages } from "@/lib/i18n/server";
import { translateFinanceError } from "@/lib/i18n/finance-errors";
import {
  validateDescription,
  validateAmount,
  projectBelongsToUser,
} from "@/lib/finance/validation";

export type EstimatedRevenueFormState = {
  error?: string;
};

function requiredField(formData: FormData, field: string): string | null {
  const value = formData.get(field);
  if (typeof value !== "string" || value.trim().length === 0) return null;
  return value.trim();
}

export async function createEstimatedRevenue(
  _prevState: EstimatedRevenueFormState,
  formData: FormData,
): Promise<EstimatedRevenueFormState> {
  // The active language only affects the text returned to the user.
  const { messages } = await getMessages();

  const projectId = requiredField(formData, "projectId");
  if (!projectId) return { error: messages.common.genericError };

  const description = validateDescription(formData);
  if ("error" in description) return { error: translateFinanceError(description.error, messages) };
  const amount = validateAmount(formData);
  if ("error" in amount) return { error: translateFinanceError(amount.error, messages) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The page already checks auth before rendering the form, but a
  // server action is a public endpoint in its own right, so it must
  // re-verify rather than trust that the page did.
  if (!user) redirect("/login");

  if (!(await projectBelongsToUser(supabase, projectId, user.id))) {
    return { error: messages.entries.errors.invalidProject };
  }

  const { error } = await supabase.from("estimated_revenues").insert({
    user_id: user.id, // from the session, never from the submitted form
    project_id: projectId,
    description: description.value,
    amount: amount.value,
  });

  if (error) {
    return { error: messages.entries.errors.estimatedRevenueSaveFailed };
  }

  redirect(`/dashboard/projects/${projectId}?estimatedRevenueCreated=1`);
}

export async function updateEstimatedRevenue(
  _prevState: EstimatedRevenueFormState,
  formData: FormData,
): Promise<EstimatedRevenueFormState> {
  // The active language only affects the text returned to the user.
  const { messages } = await getMessages();

  const id = requiredField(formData, "id");
  const projectId = requiredField(formData, "projectId");
  if (!id || !projectId) return { error: messages.common.genericError };

  const description = validateDescription(formData);
  if ("error" in description) return { error: translateFinanceError(description.error, messages) };
  const amount = validateAmount(formData);
  if ("error" in amount) return { error: translateFinanceError(amount.error, messages) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  if (!(await projectBelongsToUser(supabase, projectId, user.id))) {
    return { error: messages.entries.errors.invalidProject };
  }

  // Scoped by id + user_id + project_id — see the matching comment in
  // lib/revenue/actions.ts updateRevenue for why project_id is needed
  // in addition to id + user_id.
  const { data: updated, error } = await supabase
    .from("estimated_revenues")
    .update({
      description: description.value,
      amount: amount.value,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("project_id", projectId)
    .select("id")
    .single();

  if (error || !updated) {
    return {
      error: messages.entries.errors.estimatedRevenueUpdateFailed,
    };
  }

  redirect(`/dashboard/projects/${projectId}?estimatedRevenueUpdated=1`);
}

export async function deleteEstimatedRevenue(
  id: string,
  projectId: string,
  _prevState: EstimatedRevenueFormState,
  _formData: FormData,
): Promise<EstimatedRevenueFormState> {
  // The active language only affects the text returned to the user.
  const { messages } = await getMessages();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Same reasoning as deleteRevenue: scoped by id + user_id +
  // project_id so a delete can't act on a record from a different
  // project than the one declared, even if both belong to this user.
  const { data: deleted, error } = await supabase
    .from("estimated_revenues")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("project_id", projectId)
    .select("id")
    .single();

  if (error || !deleted) {
    return {
      error: messages.entries.errors.estimatedRevenueDeleteFailed,
    };
  }

  redirect(`/dashboard/projects/${projectId}?estimatedRevenueDeleted=1`);
}
