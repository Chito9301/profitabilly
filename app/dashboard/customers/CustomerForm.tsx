"use client";

import { useActionState } from "react";
import TextField from "@/components/TextField";
import SelectField from "@/components/SelectField";
import TextareaField from "@/components/TextareaField";
import Button from "@/components/Button";
import type { CustomerFormState } from "@/lib/customers/actions";
import { STATUSES } from "@/lib/customers/constants";
import type { Customer } from "@/types/supabase";
import { useI18n } from "@/lib/i18n/provider";

type CustomerFormProps = {
  action: (
    state: CustomerFormState,
    formData: FormData,
  ) => Promise<CustomerFormState>;
  // Present (with an id) when editing; absent when creating.
  defaultValues?: Partial<Customer>;
  submitLabel: string;
};

const initialState: CustomerFormState = {};

export default function CustomerForm({
  action,
  defaultValues,
  submitLabel,
}: CustomerFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const { messages } = useI18n();
  const t = messages.customers;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {defaultValues?.id && (
        <input type="hidden" name="id" value={defaultValues.id} />
      )}

      <TextField
        label={t.fields.name}
        name="name"
        required
        defaultValue={defaultValues?.name ?? ""}
      />
      <TextField
        label={t.fields.company}
        name="company"
        defaultValue={defaultValues?.company ?? ""}
      />
      <TextField
        label={messages.common.email}
        name="email"
        type="email"
        defaultValue={defaultValues?.email ?? ""}
      />
      <TextField
        label={t.fields.phone}
        name="phone"
        type="tel"
        defaultValue={defaultValues?.phone ?? ""}
      />
      <TextField
        label={t.fields.address}
        name="address"
        defaultValue={defaultValues?.address ?? ""}
      />
      <TextareaField
        label={t.fields.notes}
        name="notes"
        defaultValue={defaultValues?.notes ?? ""}
      />
      <SelectField
        label={messages.common.status}
        name="status"
        options={STATUSES}
        optionLabels={t.status}
        defaultValue={defaultValues?.status ?? "Active"}
        required
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
