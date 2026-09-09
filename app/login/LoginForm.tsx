"use client";

import { useActionState } from "react";
import TextField from "@/components/TextField";
import Button from "@/components/Button";
import { logIn, type AuthFormState } from "@/lib/auth/actions";

const initialState: AuthFormState = {};

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(logIn, initialState);

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-4">
      <TextField label="Email" name="email" type="email" required autoComplete="email" />
      <TextField
        label="Password"
        name="password"
        type="password"
        required
        autoComplete="current-password"
      />

      {state.error && (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      )}

      <Button type="submit" variant="primary" disabled={isPending} className="mt-2 w-full">
        {isPending ? "Logging in…" : "Log in"}
      </Button>
    </form>
  );
}
