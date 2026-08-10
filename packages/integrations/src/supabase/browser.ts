import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";
import { resolveSupabaseEnv } from "./env";

export function createSupabaseBrowserClient(env: {
  url: string | undefined;
  anonKey: string | undefined;
}) {
  const resolved = resolveSupabaseEnv(env);
  return createBrowserClient<Database>(resolved.url, resolved.anonKey);
}
