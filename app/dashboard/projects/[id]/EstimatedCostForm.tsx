"use client";

import { useActionState } from "react";
import TextField from "@/components/TextField";
import SelectField from "@/components/SelectField";
import Button from "@/components/Button";
import type { EstimatedCostFormState } from "@/lib/estimated-costs/actions";
import { CATEGORIES } from "@/lib/costs/constants";
import type { EstimatedCost } from "@/types/supabase";

type EstimatedCostFormProps = {
  action: (
    state: EstimatedCostFormState,
    formData: FormData,
  ) => Promise<EstimatedCostFormState>;
  projectId: string;
  // Present (with an id) when editing; absent when creating.
  defaultValues?: Partial<EstimatedCost>;
  submitLabel: string;
};

const initialState: EstimatedCostFormState = {};

export default function EstimatedCostForm({
  action,
  projectId,
  defaultValues,
  submitLabel,
}: EstimatedCostFormProps) {
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
      <SelectField
        label="Category"
        name="category"
        options={CATEGORIES}
        defaultValue={defaultValues?.category ?? CATEGORIES[0]}
        required
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
