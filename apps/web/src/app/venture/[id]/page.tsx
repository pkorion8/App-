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
    .select("id, name, raw_idea_text, target_user, geography, status, created_at")
    .eq("id", id)
    .maybeSingle();

  if (!venture) {
    notFound();
  }

  const { data: shape } = await supabase
    .from("venture_shapes")
    .select("problem_statement, value_proposition")
    .eq("venture_id", venture.id)
    .maybeSingle();

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

      {venture.target_user && venture.geography ? (
        <Card className="mt-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-vs-fg-muted">Shaped</p>
          <p className="mt-1 text-sm text-vs-fg">
            For <strong>{venture.target_user}</strong> in <strong>{venture.geography}</strong>.
          </p>
          {shape?.problem_statement && (
            <p className="mt-2 text-sm text-vs-fg-muted">{shape.problem_statement}</p>
          )}
          {shape?.value_proposition && (
            <p className="mt-1 text-sm text-vs-fg-muted">{shape.value_proposition}</p>
          )}
          <Link
            href={`/venture/${venture.id}/shape`}
            className="mt-2 inline-block text-xs text-vs-primary hover:underline"
          >
            Edit shape
          </Link>
        </Card>
      ) : (
        <Card className="mt-4 border-vs-primary/40 bg-vs-primary/5">
          <p className="text-sm text-vs-fg">
            This venture hasn&apos;t been shaped yet — worth doing before Research or Simulate so
            they&apos;re working from a clear target user and problem, not just the raw idea text.
          </p>
          <Link
            href={`/venture/${venture.id}/shape`}
            className="mt-2 inline-block text-sm font-medium text-vs-primary hover:underline"
          >
            Shape this venture →
          </Link>
        </Card>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href={`/venture/${venture.id}/shape`}
          className="rounded-vs-sm border border-vs-primary bg-vs-primary px-3 py-1.5 text-sm text-vs-primary-fg hover:opacity-90"
        >
          Shape
        </Link>
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
