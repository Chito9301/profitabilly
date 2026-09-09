"use client";

import { useActionState } from "react";
import TextField from "@/components/TextField";
import SelectField from "@/components/SelectField";
import Button from "@/components/Button";
import { signUp, type AuthFormState } from "@/lib/auth/actions";
import { BUSINESS_TYPES, CURRENCIES } from "@/lib/auth/constants";

const initialState: AuthFormState = {};

export default function SignupForm() {
  const [state, formAction, isPending] = useActionState(signUp, initialState);

  // Once signup succeeds without an active session (email confirmation
  // required), show that message instead of the form — there's nothing
  // left to submit until the user confirms.
  if (state.message) {
    return (
      <p role="status" className="mt-8 text-center text-sm text-ink">
        {state.message}
      </p>
    );
  }

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-4">
      <TextField label="Full name" name="fullName" required autoComplete="name" />
      <TextField label="Email" name="email" type="email" required autoComplete="email" />
      <TextField
        label="Password"
        name="password"
        type="password"
        required
        minLength={6}
        autoComplete="new-password"
      />
      <TextField label="Business name" name="businessName" required autoComplete="organization" />
      <SelectField
        label="Business type"
        name="businessType"
        options={BUSINESS_TYPES}
        defaultValue={BUSINESS_TYPES[0]}
        required
      />
      <TextField label="Country" name="country" required autoComplete="country-name" />
      <SelectField
        label="Currency"
        name="currency"
        options={CURRENCIES}
        defaultValue="USD"
        required
      />

      {state.error && (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      )}

      <Button type="submit" variant="primary" disabled={isPending} className="mt-2 w-full">
        {isPending ? "Creating account…" : "Get Started"}
      </Button>
    </form>
  );
}
