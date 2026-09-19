"use client";

import { useActionState } from "react";
import TextField from "@/components/TextField";
import Button from "@/components/Button";
import type { EstimatedRevenueFormState } from "@/lib/estimated-revenue/actions";
import type { EstimatedRevenue } from "@/types/supabase";

type EstimatedRevenueFormProps = {
  action: (
    state: EstimatedRevenueFormState,
    formData: FormData,
  ) => Promise<EstimatedRevenueFormState>;
  projectId: string;
  // Present (with an id) when editing; absent when creating.
  defaultValues?: Partial<EstimatedRevenue>;
  submitLabel: string;
};

const initialState: EstimatedRevenueFormState = {};

export default function EstimatedRevenueForm({
  action,
  projectId,
  defaultValues,
  submitLabel,
}: EstimatedRevenueFormProps) {
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
