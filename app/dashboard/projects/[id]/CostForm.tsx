"use client";

import { useActionState } from "react";
import TextField from "@/components/TextField";
import SelectField from "@/components/SelectField";
import Button from "@/components/Button";
import type { CostFormState } from "@/lib/costs/actions";
import { CATEGORIES } from "@/lib/costs/constants";
import type { Cost } from "@/types/supabase";

type CostFormProps = {
  action: (state: CostFormState, formData: FormData) => Promise<CostFormState>;
  projectId: string;
  // Present (with an id) when editing; absent when creating.
  defaultValues?: Partial<Cost>;
  submitLabel: string;
};

const initialState: CostFormState = {};

export default function CostForm({
  action,
  projectId,
  defaultValues,
  submitLabel,
}: CostFormProps) {
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
