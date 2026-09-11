"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  validateDescription,
  validateAmount,
  validateDate,
  projectBelongsToUser,
} from "@/lib/finance/validation";
import { CATEGORIES } from "@/lib/costs/constants";

export type CostFormState = {
  error?: string;
};

function requiredField(formData: FormData, field: string): string | null {
  const value = formData.get(field);
  if (typeof value !== "string" || value.trim().length === 0) return null;
  return value.trim();
}

// Unlike status on Customers/Projects (which silently falls back to a
// default for an unrecognized value), an invalid category is rejected
// outright — this sprint's brief is explicit that financial fields
// must not silently convert invalid input into something valid.
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

export async function createCost(
  _prevState: CostFormState,
  formData: FormData,
): Promise<CostFormState> {
  const projectId = requiredField(formData, "projectId");
  if (!projectId) return { error: "Something went wrong. Please try again." };

  const description = validateDescription(formData);
  if ("error" in description) return { error: description.error };
  const amount = validateAmount(formData);
  if ("error" in amount) return { error: amount.error };
  const category = validateCategory(formData);
  if ("error" in category) return { error: category.error };
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

  const { error } = await supabase.from("costs").insert({
    user_id: user.id, // from the session, never from the submitted form
    project_id: projectId,
    description: description.value,
    amount: amount.value,
    category: category.value,
    date: date.value,
  });

  if (error) {
    return { error: "Could not save the cost entry. Please try again." };
  }

  redirect(`/dashboard/projects/${projectId}?costCreated=1`);
}

export async function updateCost(
  _prevState: CostFormState,
  formData: FormData,
): Promise<CostFormState> {
  const id = requiredField(formData, "id");
  const projectId = requiredField(formData, "projectId");
  if (!id || !projectId) return { error: "Something went wrong. Please try again." };

  const description = validateDescription(formData);
  if ("error" in description) return { error: description.error };
  const amount = validateAmount(formData);
  if ("error" in amount) return { error: amount.error };
  const category = validateCategory(formData);
  if ("error" in category) return { error: category.error };
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

  const { data: updated, error } = await supabase
    .from("costs")
    .update({
      description: description.value,
      amount: amount.value,
      category: category.value,
      date: date.value,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .single();

  if (error || !updated) {
    return {
      error: "Could not update the cost entry. It may not exist or you may not have access to it.",
    };
  }

  redirect(`/dashboard/projects/${projectId}?costUpdated=1`);
}

export async function deleteCost(
  id: string,
  projectId: string,
  _prevState: CostFormState,
  _formData: FormData,
): Promise<CostFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: deleted, error } = await supabase
    .from("costs")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .single();

  if (error || !deleted) {
    return {
      error: "Could not delete the cost entry. It may not exist or you may not have access to it.",
    };
  }

  redirect(`/dashboard/projects/${projectId}?costDeleted=1`);
}
