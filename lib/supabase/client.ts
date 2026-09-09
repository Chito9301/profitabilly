import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

/**
 * Supabase client for use in Client Components ("use client" files).
 *
 * The schema now exists (profiles, customers) so the client is typed
 * with Database for query autocompletion/checking, but no auth flows or
 * queries are wired up yet — that starts in a later sprint. Call this
 * inside a component/hook when that work starts, rather than
 * instantiating a client at module scope.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
