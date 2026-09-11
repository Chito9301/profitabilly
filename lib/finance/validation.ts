import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;
type FieldResult = { value: string } | { error: string };

export function validateDescription(formData: FormData): FieldResult {
  const raw = formData.get("description");
  if (typeof raw !== "string" || raw.trim().length === 0) {
    return { error: "Description is required." };
  }
  return { value: raw.trim() };
}

const AMOUNT_PATTERN = /^-?\d+(\.\d{1,2})?$/;

// Kept as a string end-to-end (never parsed to a JS number for
// storage) so the value written to Postgres's numeric(12,2) column is
// exactly what the user typed — no floating-point round-trip on the
// amount itself. Number(trimmed) below is only a sign/zero check on a
// value with at most 2 decimal places, not an accumulation, so it's
// safe even though it goes through a float.
export function validateAmount(formData: FormData): FieldResult {
  const raw = formData.get("amount");
  if (typeof raw !== "string" || raw.trim().length === 0) {
    return { error: "Amount is required." };
  }
  const trimmed = raw.trim();
  if (!AMOUNT_PATTERN.test(trimmed)) {
    return { error: "Enter a valid amount (up to 2 decimal places)." };
  }
  if (Number(trimmed) <= 0) {
    return { error: "Amount must be greater than zero." };
  }
  return { value: trimmed };
}

export function validateDate(formData: FormData): FieldResult {
  const raw = formData.get("date");
  // <input type="date"> submits YYYY-MM-DD, which Postgres's `date`
  // type accepts directly — this only rejects obviously malformed
  // input, not full calendar validity (e.g. Feb 30 is left to Postgres).
  if (typeof raw !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw.trim())) {
    return { error: "Enter a valid date." };
  }
  return { value: raw.trim() };
}

// Confirms project_id belongs to this user before a Revenue/Cost entry
// is allowed to reference it. Mirrors customerBelongsToUser in
// lib/projects/actions.ts for the customer/project relationship — this
// is the project/revenue-cost equivalent. The insert/update RLS
// policies enforce the same rule independently (see the migration);
// this exists so a bad project_id gets a clear message instead of a
// raw RLS-denial error from Supabase.
export async function projectBelongsToUser(
  supabase: SupabaseServerClient,
  projectId: string,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", userId)
    .single();
  return Boolean(data);
}
