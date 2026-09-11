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
