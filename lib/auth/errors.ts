/**
 * Supabase (GoTrue) returns human-readable but internal-sounding error
 * strings. We never show those directly — map the ones we expect to
 * plain copy, and fall back to a generic message for anything else
 * (including real database errors) so nothing technical leaks to users.
 */
export function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();

  if (m.includes("invalid login credentials")) {
    return "That email or password is incorrect.";
  }
  if (m.includes("already registered") || m.includes("already exists")) {
    return "An account with that email already exists. Try logging in instead.";
  }
  if (m.includes("password")) {
    // Covers Supabase's various "Password should be at least N characters" /
    // "password is too weak" style messages.
    return "Password must be at least 6 characters.";
  }
  if (m.includes("email") && (m.includes("invalid") || m.includes("format"))) {
    return "Enter a valid email address.";
  }
  if (m.includes("email not confirmed")) {
    return "Please confirm your email address before logging in.";
  }
  if (m.includes("rate limit")) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  return "Something went wrong. Please try again.";
}
