"use client";

import { useActionState } from "react";
import { completeProject, type ProjectFormState } from "@/lib/projects/actions";
import Button from "@/components/Button";
import { useI18n } from "@/lib/i18n/provider";

const initialState: ProjectFormState = {};

export default function CompleteProjectButton({
  projectId,
}: {
  projectId: string;
}) {
  const { messages } = useI18n();
  const [state, formAction, isPending] = useActionState(
    completeProject.bind(null, projectId),
    initialState,
  );

  return (
    <div>
      <form action={formAction}>
        <Button type="submit" variant="secondary" disabled={isPending}>
          {isPending
            ? messages.projects.lifecycle.completing
            : messages.projects.lifecycle.complete}
        </Button>
      </form>
      {state.error && (
        <p role="alert" className="mt-1 text-xs text-danger">
          {state.error}
        </p>
      )}
    </div>
  );
}
