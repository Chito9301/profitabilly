"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CustomerFormState = {
  error?: string;
};

const STATUSES = ["Active", "Archived"] as const;

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
  const { error } = await supabase
    .from("customers")
    .update({ name, ...customerFieldsFromForm(formData) })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: "Could not update the customer. Please try again." };
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
  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  // A real DB error is reported rather than redirecting as if it
  // succeeded. Matching zero rows (wrong id, or someone else's
  // customer) is not itself an error — there's simply nothing this
  // user was allowed to delete — so that case still redirects normally.
  if (error) {
    return { error: "Could not delete the customer. Please try again." };
  }

  redirect("/dashboard/customers?deleted=1");
}
