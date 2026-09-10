// Single source for project/job status values, shared between the
// create/edit form and the server actions' validation. Mirrors the
// pattern already used in lib/customers/constants.ts. Kept separate
// from customers' STATUSES rather than merged — the two sets already
// diverge ("Completed" doesn't apply to a customer) and will keep
// evolving independently.
export const STATUSES = ["Active", "Completed", "Archived"] as const;
