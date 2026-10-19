"use client";

import { useActionState, type FormEvent } from "react";
import {
  deleteEstimatedCost,
  type EstimatedCostFormState,
} from "@/lib/estimated-costs/actions";
import { useI18n } from "@/lib/i18n/provider";

const initialState: EstimatedCostFormState = {};

export default function DeleteEstimatedCostButton({
  estimatedCostId,
  projectId,
}: {
  estimatedCostId: string;
  projectId: string;
}) {
  const { messages } = useI18n();
  const [state, formAction, isPending] = useActionState(
    deleteEstimatedCost.bind(null, estimatedCostId, projectId),
    initialState,
  );

  return (
    <div>
      <form
        action={formAction}
        onSubmit={(e: FormEvent<HTMLFormElement>) => {
          if (!confirm(messages.entries.confirmDelete.estimatedCost)) {
            e.preventDefault();
          }
        }}
      >
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex min-h-12 items-center text-sm font-medium text-danger underline underline-offset-2 disabled:opacity-50 sm:min-h-10"
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
