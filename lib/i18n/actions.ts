"use server";

import { cookies } from "next/headers";
import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  isLocale,
} from "./config";

// Stores the manual language choice. Validates the value server-side
// (anything other than "es"/"en" is ignored) and touches nothing else:
// no auth, no Supabase, no database. Setting a cookie in a Server Action
// makes Next invalidate its client router cache; the caller also calls
// router.refresh() so the current page re-renders in the new language
// without a full reload and without signing the user out.
export async function setLocale(value: string): Promise<void> {
  if (!isLocale(value)) return;
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, value, {
    maxAge: LOCALE_COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
    // Secure only in production builds (HTTPS on Vercel); a plain-HTTP
    // dev server would otherwise reject the cookie.
    secure: process.env.NODE_ENV === "production",
  });
}
