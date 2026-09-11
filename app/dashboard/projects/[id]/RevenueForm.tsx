"use client";

import { useActionState } from "react";
import TextField from "@/components/TextField";
import Button from "@/components/Button";
import type { RevenueFormState } from "@/lib/revenue/actions";
import type { Revenue } from "@/types/supabase";

type RevenueFormProps = {
  action: (
    state: RevenueFormState,
    formData: FormData,
  ) => Promise<RevenueFormState>;
  projectId: string;
  // Present (with an id) when editing; absent when creating.
  defaultValues?: Partial<Revenue>;
  submitLabel: string;
};

const initialState: RevenueFormState = {};

export default function RevenueForm({
  action,
  projectId,
  defaultValues,
  submitLabel,
}: RevenueFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="projectId" value={projectId} />
      {defaultValues?.id && (
        <input type="hidden" name="id" value={defaultValues.id} />
      )}

      <TextField
        label="Description"
        name="description"
        required
        defaultValue={defaultValues?.description ?? ""}
      />
      <TextField
        label="Amount"
        name="amount"
        inputMode="decimal"
        required
        defaultValue={defaultValues?.amount ?? ""}
      />
      <TextField
        label="Date"
        name="date"
        type="date"
        required
        defaultValue={defaultValues?.date ?? ""}
      />

      {state.error && (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      )}

      <Button
        type="submit"
        variant="primary"
        disabled={isPending}
        className="mt-2"
      >
        {isPending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
