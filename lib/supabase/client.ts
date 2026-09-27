import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

/**
 * Supabase client for use in Client Components ("use client" files).
 *
 * Typed with Database for query autocompletion/checking. Call this
 * inside a component/hook when it needs a browser-side client, rather
 * than instantiating one at module scope.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
