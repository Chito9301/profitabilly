"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { STATUSES } from "@/lib/customers/constants";

export type CustomerFormState = {
  error?: string;
};

function requiredField(formData: FormData, field: string): string | null {
  const value = formData.get(field);
  if (typeof value !== "string" || value.trim().length === 0) return null;
  return value.trim();
}

// Optional fields are stored as null rather than "" so a blank input
// reads the same as "never filled in" everywhere else in the app.
function optionalField(formData: FormData, field: string): string | null {
  const value = formData.get(field);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function customerFieldsFromForm(formData: FormData) {
  const rawStatus = formData.get("status");
  const status =
    typeof rawStatus === "string" && STATUSES.includes(rawStatus as (typeof STATUSES)[number])
      ? rawStatus
      : "Active";

  return {
    company: optionalField(formData, "company"),
    email: optionalField(formData, "email"),
    phone: optionalField(formData, "phone"),
    address: optionalField(formData, "address"),
    notes: optionalField(formData, "notes"),
    status,
  };
}

export async function createCustomer(
  _prevState: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const name = requiredField(formData, "name");
  if (!name) {
    return { error: "Name is required." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The route/page already checks auth before rendering the form, but a
  // server action is a public endpoint in its own right, so it must
  // re-verify rather than trust that the page did.
  if (!user) redirect("/login");

  const { error } = await supabase.from("customers").insert({
    user_id: user.id, // from the session, never from the submitted form
    name,
    ...customerFieldsFromForm(formData),
  });

  if (error) {
    return { error: "Could not save the customer. Please try again." };
  }

  redirect("/dashboard/customers?created=1");
}

export async function updateCustomer(
  _prevState: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const id = requiredField(formData, "id");
  const name = requiredField(formData, "name");
  if (!id) {
    return { error: "Something went wrong. Please try again." };
  }
  if (!name) {
    return { error: "Name is required." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // .eq("user_id", user.id) scopes the write to rows this user owns.
  // RLS blocks it regardless, but without this the query would just
  // silently match zero rows for someone else's customer instead of
  // making the ownership check explicit here too.
  //
  // .select().single() distinguishes "updated exactly one row" from
  // "matched zero rows" (wrong id, or another user's customer — RLS
  // already hides which, so both cases get the same safe message) —
  // without it, Supabase reports no `error` for a zero-row update and
  // the code would redirect as if it had succeeded.
  const { data: updated, error } = await supabase
    .from("customers")
    .update({ name, ...customerFieldsFromForm(formData) })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .single();

  if (error || !updated) {
    return {
      error: "Could not update the customer. It may not exist or you may not have access to it.",
    };
  }

  redirect("/dashboard/customers?updated=1");
}

export async function deleteCustomer(
  id: string,
  _prevState: CustomerFormState,
  _formData: FormData,
): Promise<CustomerFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Scoped by id + user_id, same as updateCustomer above.
  // .select().single() distinguishes "deleted exactly one row" from
  // "matched zero rows" (wrong id, or another user's customer) or a
  // real error — see the comment in updateCustomer above for why this
  // matters (a zero-row delete reports no `error` on its own).
  const { data: deleted, error } = await supabase
    .from("customers")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .single();

  if (error) {
    // 23503 = foreign_key_violation, a standard PostgreSQL SQLSTATE
    // code (not Supabase-specific free text) — reliable to check
    // directly instead of matching on error.message. This customer
    // still has projects referencing it (projects.customer_id is
    // ON DELETE RESTRICT), so the delete was correctly rejected.
    if (error.code === "23503") {
      return {
        error: "Cannot delete this customer because it has projects associated with it.",
      };
    }
    return { error: "Could not delete the customer. Please try again." };
  }

  if (!deleted) {
    return {
      error: "Could not delete the customer. It may not exist or you may not have access to it.",
    };
  }

  redirect("/dashboard/customers?deleted=1");
}
