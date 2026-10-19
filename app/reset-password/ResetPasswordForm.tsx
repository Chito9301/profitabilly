"use client";

import { useActionState } from "react";
import Button from "@/components/Button";
import TextField from "@/components/TextField";
import { updatePassword, type AuthFormState } from "@/lib/auth/actions";
import { useI18n } from "@/lib/i18n/provider";

const initialState: AuthFormState = {};

export default function ResetPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    updatePassword,
    initialState,
  );
  const t = useI18n().messages.auth;

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-4">
      <TextField
        label={t.fields.newPassword}
        name="password"
        type="password"
        required
        minLength={6}
        autoComplete="new-password"
      />
      <TextField
        label={t.fields.confirmNewPassword}
        name="confirmPassword"
        type="password"
        required
        minLength={6}
        autoComplete="new-password"
      />
      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      <Button type="submit" variant="primary" disabled={isPending} className="mt-2 w-full">
        {isPending ? t.reset.submitting : t.reset.submit}
      </Button>
    </form>
  );
}
