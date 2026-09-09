// Single source for customer status values, shared between the
// create/edit form and the server actions' validation. Mirrors the
// pattern already used in lib/auth/constants.ts.
export const STATUSES = ["Active", "Archived"] as const;
