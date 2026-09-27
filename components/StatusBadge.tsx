// Single shared status badge (consolidated in Mini-Sprint 35 from three
// local copies). Business meaning is unchanged: it only renders the status
// string it is given.
//
// Visual language — the label text always carries the meaning, color only
// reinforces it, and each state differs in shape too, not just hue:
//   Active    → green tint  (profit)
//   Completed → navy tint   (ink)
//   anything else (Archived, or any unrecognized value) → outlined gray
// Text colors are the contrast-safe variants (see tailwind.config.ts).
export default function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "Active"
      ? "bg-profit/10 text-profit-strong"
      : status === "Completed"
        ? "bg-ink/10 text-ink"
        : "text-muted ring-1 ring-inset ring-rule-strong";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles}`}
    >
      {status}
    </span>
  );
}
