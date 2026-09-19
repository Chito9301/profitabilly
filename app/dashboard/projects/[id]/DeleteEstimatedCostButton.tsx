"use client";

import { useActionState, type FormEvent } from "react";
import {
  deleteEstimatedCost,
  type EstimatedCostFormState,
} from "@/lib/estimated-costs/actions";

const initialState: EstimatedCostFormState = {};

export default function DeleteEstimatedCostButton({
  estimatedCostId,
  projectId,
}: {
  estimatedCostId: string;
  projectId: string;
}) {
  const [state, formAction, isPending] = useActionState(
    deleteEstimatedCost.bind(null, estimatedCostId, projectId),
    initialState,
  );

  return (
    <div>
      <form
        action={formAction}
        onSubmit={(e: FormEvent<HTMLFormElement>) => {
          if (!confirm("Delete this estimated cost? This can't be undone.")) {
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
