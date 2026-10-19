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
import { CATEGORIES } from "@/lib/costs/constants";

export type EstimatedCostFormState = {
  error?: string;
};

function requiredField(formData: FormData, field: string): string | null {
  const value = formData.get(field);
  if (typeof value !== "string" || value.trim().length === 0) return null;
  return value.trim();
}

// Same rule as costs' validateCategory: an invalid category is
// rejected outright, not silently defaulted.
function validateCategory(
  formData: FormData,
): { value: (typeof CATEGORIES)[number] } | { error: string } {
  const raw = formData.get("category");
  if (
    typeof raw !== "string" ||
    !CATEGORIES.includes(raw as (typeof CATEGORIES)[number])
  ) {
    return { error: "Please select a valid category." };
  }
  return { value: raw as (typeof CATEGORIES)[number] };
}

export async function createEstimatedCost(
  _prevState: EstimatedCostFormState,
  formData: FormData,
): Promise<EstimatedCostFormState> {
  // The active language only affects the text returned to the user.
  const { messages } = await getMessages();

  const projectId = requiredField(formData, "projectId");
  if (!projectId) return { error: messages.common.genericError };

  const description = validateDescription(formData);
  if ("error" in description) return { error: translateFinanceError(description.error, messages) };
  const amount = validateAmount(formData);
  if ("error" in amount) return { error: translateFinanceError(amount.error, messages) };
  const category = validateCategory(formData);
  if ("error" in category) return { error: translateFinanceError(category.error, messages) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  if (!(await projectBelongsToUser(supabase, projectId, user.id))) {
    return { error: messages.entries.errors.invalidProject };
  }

  const { error } = await supabase.from("estimated_costs").insert({
    user_id: user.id, // from the session, never from the submitted form
    project_id: projectId,
    description: description.value,
    amount: amount.value,
    category: category.value,
  });

  if (error) {
    return { error: messages.entries.errors.estimatedCostSaveFailed };
  }

  redirect(`/dashboard/projects/${projectId}?estimatedCostCreated=1`);
}

export async function updateEstimatedCost(
  _prevState: EstimatedCostFormState,
  formData: FormData,
): Promise<EstimatedCostFormState> {
  // The active language only affects the text returned to the user.
  const { messages } = await getMessages();

  const id = requiredField(formData, "id");
  const projectId = requiredField(formData, "projectId");
  if (!id || !projectId) return { error: messages.common.genericError };

  const description = validateDescription(formData);
  if ("error" in description) return { error: translateFinanceError(description.error, messages) };
  const amount = validateAmount(formData);
  if ("error" in amount) return { error: translateFinanceError(amount.error, messages) };
  const category = validateCategory(formData);
  if ("error" in category) return { error: translateFinanceError(category.error, messages) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  if (!(await projectBelongsToUser(supabase, projectId, user.id))) {
    return { error: messages.entries.errors.invalidProject };
  }

  const { data: updated, error } = await supabase
    .from("estimated_costs")
    .update({
      description: description.value,
      amount: amount.value,
      category: category.value,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("project_id", projectId)
    .select("id")
    .single();

  if (error || !updated) {
    return {
      error: messages.entries.errors.estimatedCostUpdateFailed,
    };
  }

  redirect(`/dashboard/projects/${projectId}?estimatedCostUpdated=1`);
}

export async function deleteEstimatedCost(
  id: string,
  projectId: string,
  _prevState: EstimatedCostFormState,
  _formData: FormData,
): Promise<EstimatedCostFormState> {
  // The active language only affects the text returned to the user.
  const { messages } = await getMessages();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: deleted, error } = await supabase
    .from("estimated_costs")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("project_id", projectId)
    .select("id")
    .single();

  if (error || !deleted) {
    return {
      error: messages.entries.errors.estimatedCostDeleteFailed,
    };
  }

  redirect(`/dashboard/projects/${projectId}?estimatedCostDeleted=1`);
}
