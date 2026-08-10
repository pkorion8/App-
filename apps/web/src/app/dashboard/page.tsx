import Link from "next/link";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@venture-sandbox/integrations";
import { Button, Card } from "@venture-sandbox/ui";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions";
import { CreateVentureForm } from "./CreateVentureForm";

// See sign-in/page.tsx: without this, env-var-dependent content here can
// get baked in at build time instead of reflecting the live deployment.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const configured = isSupabaseConfigured({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });

  if (!configured) {
    return <SupabaseSetupNotice />;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: ventures } = await supabase
    .from("ventures")
    .select("id, name, raw_idea_text, status, created_at")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-vs-fg">Your ventures</h1>
          <p className="text-sm text-vs-fg-muted">{user.email}</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/channels" className="text-sm text-vs-fg-muted hover:underline">
            Monitored channels
          </Link>
          <Link href="/billing" className="text-sm text-vs-fg-muted hover:underline">
            Billing
          </Link>
          <form action={signOut}>
            <Button type="submit" variant="ghost">
              Sign out
            </Button>
          </form>
        </div>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-vs-fg-muted">
            New venture
          </h2>
          <CreateVentureForm />
        </Card>

        <div className="space-y-3">
          {ventures && ventures.length > 0 ? (
            ventures.map((venture) => (
              <Link key={venture.id} href={`/venture/${venture.id}`}>
                <Card className="transition-colors hover:border-vs-primary">
                  <p className="font-medium text-vs-fg">{venture.name}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-vs-fg-muted">
                    {venture.raw_idea_text}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-wide text-vs-fg-muted">
                    {venture.status}
                  </p>
                </Card>
              </Link>
            ))
          ) : (
            <Card className="text-sm text-vs-fg-muted">
              No ventures yet — create your first one.
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
