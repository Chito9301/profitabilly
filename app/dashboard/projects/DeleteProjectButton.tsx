"use client";

import { useActionState, type FormEvent } from "react";
import { deleteProject, type ProjectFormState } from "@/lib/projects/actions";
import { useI18n } from "@/lib/i18n/provider";

const initialState: ProjectFormState = {};

export default function DeleteProjectButton({
  projectId,
}: {
  projectId: string;
}) {
  const { messages } = useI18n();

  // Binding the id gives deleteProject the (prevState, formData) shape
  // useActionState expects, while still scoping the delete to this row.
  const [state, formAction, isPending] = useActionState(
    deleteProject.bind(null, projectId),
    initialState,
  );

  return (
    <div>
      <form
        action={formAction}
        onSubmit={(e: FormEvent<HTMLFormElement>) => {
          if (!confirm(messages.projects.confirmDelete)) {
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
