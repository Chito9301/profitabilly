import type { Messages } from "@/lib/i18n/messages";

/**
 * Supabase (GoTrue) returns human-readable but internal-sounding error
 * strings. We never show those directly — map the ones we expect to
 * plain copy, and fall back to a generic message for anything else
 * (including real database errors) so nothing technical leaks to users.
 */
// `t` supplies the user-facing text in the active language
// (Mini-Sprint 48). The matching conditions below are unchanged and still
// look for Supabase's English messages.
export function friendlyAuthError(
  message: string,
  t: Messages["auth"]["errors"],
): string {
  const m = message.toLowerCase();

  if (m.includes("invalid login credentials")) {
    return t.incorrectCredentials;
  }
  if (m.includes("already registered") || m.includes("already exists")) {
    return t.accountExists;
  }
  if (m.includes("password")) {
    // Covers Supabase's various "Password should be at least N characters" /
    // "password is too weak" style messages.
    return t.passwordMin;
  }
  if (m.includes("email") && (m.includes("invalid") || m.includes("format"))) {
    return t.invalidEmail;
  }
  if (m.includes("email not confirmed")) {
    return t.confirmEmail;
  }
  if (m.includes("rate limit")) {
    return t.rateLimit;
  }

  return t.generic;
}
