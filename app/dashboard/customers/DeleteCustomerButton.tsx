"use client";

import { useActionState, type FormEvent } from "react";
import { deleteCustomer, type CustomerFormState } from "@/lib/customers/actions";
import { useI18n } from "@/lib/i18n/provider";

const initialState: CustomerFormState = {};

export default function DeleteCustomerButton({
  customerId,
}: {
  customerId: string;
}) {
  const { messages } = useI18n();

  // Binding the id gives deleteCustomer the (prevState, formData) shape
  // useActionState expects, while still scoping the delete to this row.
  const [state, formAction, isPending] = useActionState(
    deleteCustomer.bind(null, customerId),
    initialState,
  );

  return (
    <div>
      <form
        action={formAction}
        onSubmit={(e: FormEvent<HTMLFormElement>) => {
          if (!confirm(messages.customers.confirmDelete)) {
            e.preventDefault();
          }
        }}
      >
        <button
          type="submit"
          disabled={isPending}
          className="text-sm text-danger underline underline-offset-2 disabled:opacity-50"
        >
          {isPending ? messages.common.deleting : messages.common.delete}
        </button>
      </form>
      {state.error && (
        <p role="alert" className="mt-1 text-xs text-danger">
          {state.error}
        </p>
      )}
    </div>
  );
}
