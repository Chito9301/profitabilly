"use client";

import { useActionState } from "react";
import TextField from "@/components/TextField";
import SelectField from "@/components/SelectField";
import TextareaField from "@/components/TextareaField";
import Button from "@/components/Button";
import type { CustomerFormState } from "@/lib/customers/actions";
import { STATUSES } from "@/lib/customers/constants";
import type { Customer } from "@/types/supabase";

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

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {defaultValues?.id && (
        <input type="hidden" name="id" value={defaultValues.id} />
      )}

      <TextField
        label="Name"
        name="name"
        required
        defaultValue={defaultValues?.name ?? ""}
      />
      <TextField
        label="Company"
        name="company"
        defaultValue={defaultValues?.company ?? ""}
      />
      <TextField
        label="Email"
        name="email"
        type="email"
        defaultValue={defaultValues?.email ?? ""}
      />
      <TextField
        label="Phone"
        name="phone"
        type="tel"
        defaultValue={defaultValues?.phone ?? ""}
      />
      <TextField
        label="Address"
        name="address"
        defaultValue={defaultValues?.address ?? ""}
      />
      <TextareaField
        label="Notes"
        name="notes"
        defaultValue={defaultValues?.notes ?? ""}
      />
      <SelectField
        label="Status"
        name="status"
        options={STATUSES}
        defaultValue={defaultValues?.status ?? "Active"}
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
