// Mini-Sprint 47 — i18n foundation. Pure TypeScript (no Next/React
// imports) so the resolution rules can be unit-checked anywhere.

export const LOCALES = ["en", "es"] as const;
export type Locale = (typeof LOCALES)[number];

// English is the fallback for every language we don't support.
export const DEFAULT_LOCALE: Locale = "en";

// Manual language choice. Value is exactly "es" or "en"; anything else
// is ignored. Lifetime: one year.
export const LOCALE_COOKIE = "jw_locale";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

// Returns the browser's most preferred language tag from an
// Accept-Language header (highest q-value; ties keep header order), or
// null if the header is missing/empty. q=0 means "not acceptable" and
// "*" is not a language, so both are skipped.
function preferredLanguageTag(header: string | null | undefined): string | null {
  if (!header) return null;
  let best: { tag: string; q: number } | null = null;
  for (const part of header.split(",")) {
    const [rawTag, ...params] = part.trim().split(";");
    const tag = rawTag.trim().toLowerCase();
    if (!tag || tag === "*") continue;
    let q = 1;
    for (const param of params) {
      const [key, val] = param.trim().split("=");
      if (key?.trim().toLowerCase() === "q") {
        const parsed = Number(val);
        q = Number.isFinite(parsed) ? parsed : 0;
      }
    }
    if (q <= 0) continue;
    if (!best || q > best.q) best = { tag, q };
  }
  return best ? best.tag : null;
}

// Priority: valid manual cookie > browser's preferred language
// ("es" or "es-XX" -> Spanish) > English.
export function resolveLocale(
  cookieValue: string | null | undefined,
  acceptLanguage: string | null | undefined,
): Locale {
  if (isLocale(cookieValue)) return cookieValue;
  const tag = preferredLanguageTag(acceptLanguage);
  if (tag === "es" || (tag !== null && tag.startsWith("es-"))) return "es";
  return DEFAULT_LOCALE;
}
