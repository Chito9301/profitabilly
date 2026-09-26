"use client";

import { useActionState } from "react";
import Button from "@/components/Button";
import TextField from "@/components/TextField";
import { updatePassword, type AuthFormState } from "@/lib/auth/actions";

const initialState: AuthFormState = {};

export default function ResetPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    updatePassword,
    initialState,
  );

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-4">
      <TextField
        label="New password"
        name="password"
        type="password"
        required
        minLength={6}
        autoComplete="new-password"
      />
      <TextField
        label="Confirm new password"
        name="confirmPassword"
        type="password"
        required
        minLength={6}
        autoComplete="new-password"
      />
      {state.error && (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      )}
      <Button type="submit" variant="primary" disabled={isPending} className="mt-2 w-full">
        {isPending ? "Updating password…" : "Update password"}
      </Button>
    </form>
  );
}
