"use client";

import { useActionState } from "react";
import { acceptProject, type ProjectFormState } from "@/lib/projects/actions";
import Button from "@/components/Button";

const initialState: ProjectFormState = {};

export default function AcceptProjectButton({
  projectId,
}: {
  projectId: string;
}) {
  const [state, formAction, isPending] = useActionState(
    acceptProject.bind(null, projectId),
    initialState,
  );

  return (
    <div>
      <form action={formAction}>
        <Button type="submit" variant="primary" disabled={isPending}>
          {isPending ? "Accepting…" : "Accept Project"}
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
