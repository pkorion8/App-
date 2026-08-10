import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isSupabaseConfigured } from "@venture-sandbox/integrations";
import { Card } from "@venture-sandbox/ui";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// See sign-in/page.tsx: without this, env-var-dependent content here can
// get baked in at build time instead of reflecting the live deployment.
export const dynamic = "force-dynamic";

export default async function VenturePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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

  const { data: venture } = await supabase
    .from("ventures")
    .select("id, name, raw_idea_text, status, created_at")
    .eq("id", id)
    .maybeSingle();

  if (!venture) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link href="/dashboard" className="text-sm text-vs-fg-muted hover:underline">
        ← Your ventures
      </Link>

      <Card className="mt-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-vs-fg">{venture.name}</h1>
          <span className="rounded-vs-sm bg-vs-bg-subtle px-2 py-1 text-xs uppercase tracking-wide text-vs-fg-muted">
            {venture.status}
          </span>
        </div>
        <p className="mt-3 whitespace-pre-wrap text-sm text-vs-fg-muted">
          {venture.raw_idea_text}
        </p>
      </Card>

      <div className="mt-6 flex gap-2">
        <Link
          href={`/venture/${venture.id}/research`}
          className="rounded-vs-sm border border-vs-primary bg-vs-primary px-3 py-1.5 text-sm text-vs-primary-fg hover:opacity-90"
        >
          Research
        </Link>
        <Link
          href={`/venture/${venture.id}/simulate`}
          className="rounded-vs-sm border border-vs-primary bg-vs-primary px-3 py-1.5 text-sm text-vs-primary-fg hover:opacity-90"
        >
          Simulate
        </Link>
        <Link
          href={`/venture/${venture.id}/build`}
          className="rounded-vs-sm border border-vs-primary bg-vs-primary px-3 py-1.5 text-sm text-vs-primary-fg hover:opacity-90"
        >
          Build
        </Link>
        <Link
          href={`/venture/${venture.id}/compare`}
          className="rounded-vs-sm border border-vs-primary bg-vs-primary px-3 py-1.5 text-sm text-vs-primary-fg hover:opacity-90"
        >
          Compare
        </Link>
        <Link
          href={`/venture/${venture.id}/monitor`}
          className="rounded-vs-sm border border-vs-primary bg-vs-primary px-3 py-1.5 text-sm text-vs-primary-fg hover:opacity-90"
        >
          Monitor
        </Link>
      </div>
    </main>
  );
}
