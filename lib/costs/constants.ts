// Single source for cost category values, shared between the
// create/edit form and the server actions' validation. Mirrors the
// pattern already used in lib/customers/constants.ts and
// lib/projects/constants.ts. Kept intentionally small for v1.
export const CATEGORIES = [
  "Materials",
  "Labor",
  "Equipment",
  "Subcontractor",
  "Travel",
  "Other",
] as const;
