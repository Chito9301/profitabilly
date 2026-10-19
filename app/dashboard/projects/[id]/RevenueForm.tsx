"use client";

import { useActionState } from "react";
import TextField from "@/components/TextField";
import Button from "@/components/Button";
import type { RevenueFormState } from "@/lib/revenue/actions";
import type { Revenue } from "@/types/supabase";
import { useI18n } from "@/lib/i18n/provider";

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
