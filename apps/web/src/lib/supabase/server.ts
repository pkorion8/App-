import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { resolveSupabaseEnv, type Database } from "@venture-sandbox/integrations";

/**
 * Supabase client for Server Components, Server Actions, and Route
 * Handlers. Reads/writes the auth cookies via next/headers, which is why
 * this lives in apps/web rather than packages/integrations (that package
 * stays framework-neutral).
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const env = resolveSupabaseEnv({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  return createServerClient<Database>(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options: CookieOptions }[],
      ) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component render; middleware refreshes
          // the session on the next request instead. Safe to ignore.
        }
      },
    },
  });
}
