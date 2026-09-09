import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Supabase client for use in Server Components, Route Handlers, and
 * Server Actions. Wired to the Next.js cookie store so a future auth
 * implementation can read/write the session — but no session or query
 * logic is implemented in this sprint. Typed with Database now that the
 * profiles/customers schema exists.
 *
 * Must be called fresh per request (it reads `cookies()`), not cached
 * at module scope.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          // In a Server Component this throw is expected and safe to
          // ignore: middleware handles refreshing the session cookie.
          // Real handling arrives with the auth mini-sprint.
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // no-op — see comment above
          }
        },
      },
    },
  );
}
