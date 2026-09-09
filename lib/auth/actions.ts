"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { friendlyAuthError } from "@/lib/auth/errors";

export type AuthFormState = {
  error?: string;
  message?: string;
};

function requireField(
  formData: FormData,
  field: string,
): string | null {
  const value = formData.get(field);
  if (typeof value !== "string" || value.trim().length === 0) return null;
  return value.trim();
}

export async function signUp(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const fullName = requireField(formData, "fullName");
  const email = requireField(formData, "email");
  const password = formData.get("password");
  const businessName = requireField(formData, "businessName");
  const businessType = requireField(formData, "businessType");
  const country = requireField(formData, "country");
  const currency = requireField(formData, "currency");

  if (
    !fullName ||
    !email ||
    typeof password !== "string" ||
    password.length === 0 ||
    !businessName ||
    !businessType ||
    !country ||
    !currency
  ) {
    return { error: "Please fill in all fields." };
  }

  // Check locally before calling Supabase so a short password reads as
  // an immediate, specific message rather than a round-trip error.
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: friendlyAuthError(error.message) };
  }

  // No session means email confirmation is required before the account
  // is usable — there's nothing to redirect to yet, and RLS would block
  // the profile update below since auth.uid() is still null.
  if (!data.session || !data.user) {
    return {
      message: "Check your email to confirm your account, then log in.",
    };
  }

  // The handle_new_user trigger already created a bare profiles row
  // (id only) on signUp above — fill in the rest of what the form
  // collected. The auth account and session already exist at this
  // point (checked above), so we can't "undo" the signup on failure —
  // but we also must not redirect to /dashboard as if the business
  // details were saved when they weren't. Stopping short of the
  // redirect and reusing the same message path as the email-
  // confirmation case above keeps the failure visible without
  // inventing new UI for it.
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      business_name: businessName,
      business_type: businessType,
      country,
      currency,
    })
    .eq("id", data.user.id);

  if (profileError) {
    return {
      message:
        "Your account was created, but we couldn't save your business details. You're signed in — go to /dashboard to continue.",
    };
  }

  redirect("/dashboard");
}

export async function logIn(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = requireField(formData, "email");
  const password = formData.get("password");

  if (!email || typeof password !== "string" || password.length === 0) {
    return { error: "Please enter your email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: friendlyAuthError(error.message) };
  }

  redirect("/dashboard");
}

export async function logOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
