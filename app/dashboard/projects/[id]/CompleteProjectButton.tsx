"use client";

import { useActionState } from "react";
import { completeProject, type ProjectFormState } from "@/lib/projects/actions";
import Button from "@/components/Button";

const initialState: ProjectFormState = {};

export default function CompleteProjectButton({
  projectId,
}: {
  projectId: string;
}) {
  const [state, formAction, isPending] = useActionState(
    completeProject.bind(null, projectId),
    initialState,
  );

  return (
    <div>
      <form action={formAction}>
        <Button type="submit" variant="secondary" disabled={isPending}>
          {isPending ? "Marking as completed…" : "Mark as Completed"}
        </Button>
      </form>
      {state.error && (
        <p role="alert" className="mt-1 text-xs text-red-700">
          {state.error}
        </p>
      )}
    </div>
  );
}
