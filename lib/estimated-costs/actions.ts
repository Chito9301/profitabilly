"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
  const projectId = requiredField(formData, "projectId");
  if (!projectId) return { error: "Something went wrong. Please try again." };

  const description = validateDescription(formData);
  if ("error" in description) return { error: description.error };
  const amount = validateAmount(formData);
  if ("error" in amount) return { error: amount.error };
  const category = validateCategory(formData);
  if ("error" in category) return { error: category.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  if (!(await projectBelongsToUser(supabase, projectId, user.id))) {
    return { error: "Please select a valid project." };
  }

  const { error } = await supabase.from("estimated_costs").insert({
    user_id: user.id, // from the session, never from the submitted form
    project_id: projectId,
    description: description.value,
    amount: amount.value,
    category: category.value,
  });

  if (error) {
    return { error: "Could not save the estimated cost. Please try again." };
  }

  redirect(`/dashboard/projects/${projectId}?estimatedCostCreated=1`);
}

export async function updateEstimatedCost(
  _prevState: EstimatedCostFormState,
  formData: FormData,
): Promise<EstimatedCostFormState> {
  const id = requiredField(formData, "id");
  const projectId = requiredField(formData, "projectId");
  if (!id || !projectId) return { error: "Something went wrong. Please try again." };

  const description = validateDescription(formData);
  if ("error" in description) return { error: description.error };
  const amount = validateAmount(formData);
  if ("error" in amount) return { error: amount.error };
  const category = validateCategory(formData);
  if ("error" in category) return { error: category.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  if (!(await projectBelongsToUser(supabase, projectId, user.id))) {
    return { error: "Please select a valid project." };
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
      error: "Could not update the estimated cost. It may not exist or you may not have access to it.",
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
      error: "Could not delete the estimated cost. It may not exist or you may not have access to it.",
    };
  }

  redirect(`/dashboard/projects/${projectId}?estimatedCostDeleted=1`);
}
