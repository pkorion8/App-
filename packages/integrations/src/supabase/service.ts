import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types.js";

/**
 * Service-role Supabase client — bypasses Row Level Security entirely.
 *
 * SERVER-ONLY. Never import this from a Client Component, never send this
 * key to the browser, never reuse it for anything a signed-in user's
 * request could trigger. Its one legitimate use in this codebase is the
 * daily creator-intelligence cron job (apps/web/src/app/api/cron/...),
 * which writes shared platform data that has no per-user insert policy
 * by design (see supabase/migrations/0003_creator_intelligence.sql).
 *
 * If you're reaching for this anywhere else, that's almost always a sign
 * the RLS policy is wrong, not that this client is the fix.
 */
export function createSupabaseServiceClient(url: string, serviceRoleKey: string) {
  return createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
