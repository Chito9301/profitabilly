// Amounts are stored as Postgres numeric(12,2) and returned by
// PostgREST as strings (see types/supabase.ts). Totals are summed here
// as integer cents rather than adding the decimal strings/numbers
// directly, so the arithmetic is exact instead of accumulating
// floating-point rounding error across many rows — and so Profit is
// computed from the exact totals, not from independently rounded
// per-line display values.
export function toCents(amount: string): number {
  return Math.round(Number(amount) * 100);
}

export function sumCents(amounts: string[]): number {
  return amounts.reduce((total, amount) => total + toCents(amount), 0);
}

export function formatCents(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const whole = Math.floor(abs / 100);
  const fraction = String(abs % 100).padStart(2, "0");
  return `${sign}${whole}.${fraction}`;
}

// Margin = Profit / Revenue × 100, computed from the same exact
// integer-cent totals as Profit (never from re-parsed display
// strings). Revenue = 0 has no meaningful ratio — returning null
// instead of 0/Infinity/NaN lets the UI show a clear non-numeric
// state ("N/A") rather than a misleading percentage.
export function calculateMarginPercent(
  profitCents: number,
  revenueCents: number,
): number | null {
  if (revenueCents === 0) return null;
  return (profitCents / revenueCents) * 100;
}

// Renders at most 2 decimal places, trimming trailing zeros (60 ->
// "60%", 83.333... -> "83.33%", -20 -> "-20%") so whole-number margins
// don't show a redundant ".00". Negative margins are shown as-is, not
// clamped to zero.
export function formatMarginPercent(percent: number | null): string {
  if (percent === null) return "N/A";
  const rounded = Math.round(percent * 100) / 100;
  const fixed = rounded.toFixed(2).replace(/\.?0+$/, "");
  return `${fixed}%`;
}

// Presentation only — maps an already-computed value (Profit cents, or
// a Margin percent, independently) to the existing color tokens used
// elsewhere in the app: `profit` (green, already named for exactly
// this) for positive, the same `text-red-700` already used for error
// states for negative, and no color (falls back to the default text
// color) for zero or null (N/A) — i.e. a neutral read, the same as how
// Revenue/Costs already look. Does not touch the value itself, and a
// negative value already carries its own "-" sign from
// formatCents/formatMarginPercent, so color is never the only signal.
export function profitToneClass(value: number | null): string {
  if (value === null || value === 0) return "";
  return value > 0 ? "text-profit" : "text-red-700";
}
