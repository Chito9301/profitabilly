"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMessages } from "@/lib/i18n/server";
import { translateFinanceError } from "@/lib/i18n/finance-errors";
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
  // The active language only affects the text returned to the user.
  const { messages } = await getMessages();

  const projectId = requiredField(formData, "projectId");
  if (!projectId) return { error: messages.common.genericError };

  const description = validateDescription(formData);
  if ("error" in description) return { error: translateFinanceError(description.error, messages) };
  const amount = validateAmount(formData);
  if ("error" in amount) return { error: translateFinanceError(amount.error, messages) };
  const date = validateDate(formData);
  if ("error" in date) return { error: translateFinanceError(date.error, messages) };

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

  const { error } = await supabase.from("revenues").insert({
    user_id: user.id, // from the session, never from the submitted form
    project_id: projectId,
    description: description.value,
    amount: amount.value,
    date: date.value,
  });

  if (error) {
    return { error: messages.entries.errors.revenueSaveFailed };
  }

  redirect(`/dashboard/projects/${projectId}?revenueCreated=1`);
}

export async function updateRevenue(
  _prevState: RevenueFormState,
  formData: FormData,
): Promise<RevenueFormState> {
  // The active language only affects the text returned to the user.
  const { messages } = await getMessages();

  const id = requiredField(formData, "id");
  const projectId = requiredField(formData, "projectId");
  if (!id || !projectId) return { error: messages.common.genericError };

  const description = validateDescription(formData);
  if ("error" in description) return { error: translateFinanceError(description.error, messages) };
  const amount = validateAmount(formData);
  if ("error" in amount) return { error: translateFinanceError(amount.error, messages) };
  const date = validateDate(formData);
  if ("error" in date) return { error: translateFinanceError(date.error, messages) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  if (!(await projectBelongsToUser(supabase, projectId, user.id))) {
    return { error: messages.entries.errors.invalidProject };
  }

  // .eq("user_id", user.id) scopes the write to rows this user owns —
  // RLS enforces this too, but this keeps the query's intent explicit.
  // .eq("project_id", projectId) additionally scopes the write to this
  // specific project: without it, a request could submit a valid
  // revenue id from Project A together with a projectId for Project B
  // (both owned by the same user) and still match the row, since id +
  // user_id alone was already enough to find it.
  // .select("id").single() distinguishes an actual update (row
  // returned) from zero rows matched (wrong id, wrong project, or
  // another user's revenue entry) or a real DB error; without it a
  // zero-row update reports no `error` and would look like success.
  const { data: updated, error } = await supabase
    .from("revenues")
    .update({
      description: description.value,
      amount: amount.value,
      date: date.value,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("project_id", projectId)
    .select("id")
    .single();

  if (error || !updated) {
    return {
      error: messages.entries.errors.revenueUpdateFailed,
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
  // The active language only affects the text returned to the user.
  const { messages } = await getMessages();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Same reasoning as updateRevenue above: scoped by id + user_id +
  // project_id so a delete can't act on a record from a different
  // project than the one declared, even if both belong to this user.
  const { data: deleted, error } = await supabase
    .from("revenues")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("project_id", projectId)
    .select("id")
    .single();

  if (error || !deleted) {
    return {
      error: messages.entries.errors.revenueDeleteFailed,
    };
  }

  redirect(`/dashboard/projects/${projectId}?revenueDeleted=1`);
}
