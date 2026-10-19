"use client";

import { useActionState } from "react";
import Button from "@/components/Button";
import TextField from "@/components/TextField";
import { requestPasswordReset, type AuthFormState } from "@/lib/auth/actions";
import { useI18n } from "@/lib/i18n/provider";

const initialState: AuthFormState = {};

export default function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    requestPasswordReset,
    initialState,
  );
  const t = useI18n().messages.auth;

  if (state.message) {
    return (
      <p role="status" className="mt-8 text-center text-sm text-ink">
        {state.message}
      </p>
    );
  }

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-4">
      <TextField
        label={t.fields.email}
        name="email"
        type="email"
        required
        autoComplete="email"
      />
      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      <Button type="submit" variant="primary" disabled={isPending} className="mt-2 w-full">
        {isPending ? t.forgot.submitting : t.forgot.submit}
      </Button>
    </form>
  );
}
