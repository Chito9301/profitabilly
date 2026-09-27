"use client";

import { useActionState, type FormEvent } from "react";
import {
  deleteEstimatedRevenue,
  type EstimatedRevenueFormState,
} from "@/lib/estimated-revenue/actions";

const initialState: EstimatedRevenueFormState = {};

export default function DeleteEstimatedRevenueButton({
  estimatedRevenueId,
  projectId,
}: {
  estimatedRevenueId: string;
  projectId: string;
}) {
  const [state, formAction, isPending] = useActionState(
    deleteEstimatedRevenue.bind(null, estimatedRevenueId, projectId),
    initialState,
  );

  return (
    <div>
      <form
        action={formAction}
        onSubmit={(e: FormEvent<HTMLFormElement>) => {
          if (!confirm("Delete this estimated revenue? This can't be undone.")) {
            e.preventDefault();
          }
        }}
      >
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex min-h-12 items-center text-sm font-medium text-danger underline underline-offset-2 disabled:opacity-50 sm:min-h-10"
        >
          {isPending ? "Deleting…" : "Delete"}
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
