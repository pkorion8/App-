import { Card } from "@venture-sandbox/ui";

/**
 * Shown instead of a hard crash when NEXT_PUBLIC_SUPABASE_URL /
 * NEXT_PUBLIC_SUPABASE_ANON_KEY aren't set yet. See .env.example and
 * README.md for how to connect a Supabase project (local or hosted).
 */
export function SupabaseSetupNotice() {
  return (
    <Card className="mx-auto mt-16 max-w-md text-center">
      <h1 className="text-lg font-semibold text-vs-fg">
        Supabase isn&apos;t connected yet
      </h1>
      <p className="mt-2 text-sm text-vs-fg-muted">
        Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
        <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in <code>.env.local</code>{" "}
        (see <code>.env.example</code>) to a running Supabase project, then
        reload.
      </p>
    </Card>
  );
}
