"use client";

import { useActionState } from "react";
import TextField from "@/components/TextField";
import SelectField from "@/components/SelectField";
import Button from "@/components/Button";
import { signUp, type AuthFormState } from "@/lib/auth/actions";
import { BUSINESS_TYPES, CURRENCIES } from "@/lib/auth/constants";
import { useI18n } from "@/lib/i18n/provider";

const initialState: AuthFormState = {};

export default function SignupForm() {
  const [state, formAction, isPending] = useActionState(signUp, initialState);
  const t = useI18n().messages.auth;

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
      <TextField label={t.fields.fullName} name="fullName" required autoComplete="name" />
      <TextField label={t.fields.email} name="email" type="email" required autoComplete="email" />
      <TextField
        label={t.fields.password}
        name="password"
        type="password"
        required
        minLength={6}
        autoComplete="new-password"
      />
      <TextField label={t.fields.businessName} name="businessName" required autoComplete="organization" />
      <SelectField
        label={t.fields.businessType}
        name="businessType"
        options={BUSINESS_TYPES}
        optionLabels={t.businessTypes}
        defaultValue={BUSINESS_TYPES[0]}
        required
      />
      <TextField label={t.fields.country} name="country" required autoComplete="country-name" />
      <SelectField
        label={t.fields.currency}
        name="currency"
        options={CURRENCIES}
        defaultValue="USD"
        required
      />

      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}

      <Button type="submit" variant="primary" disabled={isPending} className="mt-2 w-full">
        {isPending ? t.signup.submitting : t.signup.submit}
      </Button>
    </form>
  );
}
