import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, resolveLocale, type Locale } from "./config";
import { getMessagesFor, type Messages } from "./messages";

// Server-side language resolution (Server Components, layouts, actions).
// Reads only the jw_locale cookie and the Accept-Language request
// header — never localStorage/navigator.language — so the first HTML the
// server sends is already in the final language (no hydration mismatch,
// no switch after load). Using cookies()/headers() makes the routes that
// call it dynamic, which they effectively are already (Supabase auth).
export async function getLocale(): Promise<Locale> {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  return resolveLocale(
    cookieStore.get(LOCALE_COOKIE)?.value,
    headerStore.get("accept-language"),
  );
}

export async function getMessages(): Promise<{ locale: Locale; messages: Messages }> {
  const locale = await getLocale();
  return { locale, messages: getMessagesFor(locale) };
}
