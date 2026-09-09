"use client";

import { useActionState, type FormEvent } from "react";
import { deleteCustomer, type CustomerFormState } from "@/lib/customers/actions";

const initialState: CustomerFormState = {};

export default function DeleteCustomerButton({
  customerId,
}: {
  customerId: string;
}) {
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
          if (!confirm("Delete this customer? This can't be undone.")) {
            e.preventDefault();
          }
        }}
      >
        <button
          type="submit"
          disabled={isPending}
          className="text-sm text-red-700 underline underline-offset-2 disabled:opacity-50"
        >
          {isPending ? "Deleting…" : "Delete"}
        </button>
      </form>
      {state.error && (
        <p role="alert" className="mt-1 text-xs text-red-700">
          {state.error}
        </p>
      )}
    </div>
  );
}
