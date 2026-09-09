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
  // collected. This is best-effort: the auth account already exists at
  // this point, so a failure here shouldn't strand the user without a
  // way in. They can land on a mostly-empty profile and fix it later.
  await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      business_name: businessName,
      business_type: businessType,
      country,
      currency,
    })
    .eq("id", data.user.id);

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
