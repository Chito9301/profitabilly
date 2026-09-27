import type { HTMLAttributes } from "react";

// Presentation-only surface: white background, subtle border, rounded-xl,
// 16px padding (Mini-Sprint 37 — first screen that needed it; the same
// `rounded border p-4` markup was previously repeated inline on the
// Dashboard, Projects and Project Detail pages). No logic, data or
// navigation belongs here. It renders a plain <div>, so callers choose
// the semantics (put it inside a <section>, a <dl>, etc.). `className`
// is appended for layout only (flex, order, spacing) — there's no
// class-merging library, so don't use it to override the padding/border.
export default function Card({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-xl border border-rule bg-surface p-4 ${className}`}
      {...props}
    />
  );
}
