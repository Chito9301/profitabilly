"use client";

import { useActionState } from "react";
import TextField from "@/components/TextField";
import SelectField from "@/components/SelectField";
import Button from "@/components/Button";
import type { ProjectFormState } from "@/lib/projects/actions";
import { STATUSES } from "@/lib/projects/constants";
import type { Project } from "@/types/supabase";

type CustomerOption = { id: string; name: string };

type ProjectFormProps = {
  action: (
    state: ProjectFormState,
    formData: FormData,
  ) => Promise<ProjectFormState>;
  // Present (with an id) when editing; absent when creating.
  defaultValues?: Partial<Project>;
  customers: CustomerOption[];
  submitLabel: string;
};

const initialState: ProjectFormState = {};

export default function ProjectForm({
  action,
  defaultValues,
  customers,
  submitLabel,
}: ProjectFormProps) {
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

      <div className="flex flex-col gap-1.5">
        <label htmlFor="customerId" className="text-sm text-ink">
          Customer
        </label>
        <select
          id="customerId"
          name="customerId"
          required
          defaultValue={defaultValues?.customer_id ?? ""}
          className="rounded-md border border-rule bg-paper px-3 py-2 text-sm text-ink outline-none focus-visible:border-signal"
        >
          <option value="" disabled>
            Select a customer
          </option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </select>
      </div>

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
