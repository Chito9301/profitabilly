"use client";

import { useActionState } from "react";
import TextField from "@/components/TextField";
import SelectField from "@/components/SelectField";
import Button from "@/components/Button";
import type { CostFormState } from "@/lib/costs/actions";
import { CATEGORIES } from "@/lib/costs/constants";
import type { Cost } from "@/types/supabase";
import { useI18n } from "@/lib/i18n/provider";

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
  const { messages } = useI18n();

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="projectId" value={projectId} />
      {defaultValues?.id && (
        <input type="hidden" name="id" value={defaultValues.id} />
      )}

      <TextField
        label={messages.common.description}
        name="description"
        required
        defaultValue={defaultValues?.description ?? ""}
      />
      <TextField
        label={messages.common.amount}
        name="amount"
        inputMode="decimal"
        required
        defaultValue={defaultValues?.amount ?? ""}
      />
      <SelectField
        label={messages.common.category}
        name="category"
        options={CATEGORIES}
        optionLabels={messages.entries.categories}
        defaultValue={defaultValues?.category ?? CATEGORIES[0]}
        required
      />
      <TextField
        label={messages.common.date}
        name="date"
        type="date"
        required
        defaultValue={defaultValues?.date ?? ""}
      />

      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}

      <Button
        type="submit"
        variant="primary"
        disabled={isPending}
        className="mt-2"
      >
        {isPending ? messages.common.saving : submitLabel}
      </Button>
    </form>
  );
}
