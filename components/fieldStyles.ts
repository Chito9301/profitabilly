// Single source of truth for form-control styling. TextField, SelectField
// and TextareaField each used to carry their own copy of this string, and
// ProjectForm's hand-written customer <select> carried a fourth; keeping
// them in one place is what stops the four from drifting apart.
// (A plain string module, not a component: the markup differs per control,
// only the look is shared.)

export const FIELD_LABEL_STYLES = "text-sm font-medium text-ink";

// - 16px text on mobile (iOS Safari zooms the page on focus below 16px),
//   14px from `sm` up.
// - min-h-12 (48px) touch target on mobile, 40px on desktop.
// - aria-invalid gives an error state with no API change: a form that sets
//   aria-invalid={...} on the control gets the red border for free.
export const FIELD_CONTROL_STYLES =
  "min-h-12 rounded-lg border border-rule-strong bg-surface px-3 py-2 text-base text-ink outline-none transition-colors placeholder:text-muted focus-visible:border-ink focus-visible:ring-2 focus-visible:ring-ink/20 disabled:cursor-not-allowed disabled:bg-paper disabled:text-muted aria-[invalid=true]:border-danger aria-[invalid=true]:focus-visible:ring-danger/20 sm:min-h-10 sm:text-sm";
