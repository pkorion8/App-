import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isSupabaseConfigured } from "@venture-sandbox/integrations";
import { Card } from "@venture-sandbox/ui";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ClarificationForm } from "./ClarificationForm";
import { FindingCard, type FindingRow } from "./FindingCard";

// See sign-in/page.tsx: without this, env-var-dependent content here can
// get baked in at build time instead of reflecting the live deployment.
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Research" };

export default async function ResearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ again?: string }>;
}) {
  const { id } = await params;
  const { again } = await searchParams;

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
    .select("id, name, raw_idea_text, target_user, geography")
    .eq("id", id)
    .maybeSingle();

  if (!venture) {
    notFound();
  }

  const { data: mission } = await supabase
    .from("research_missions")
    .select("id, target_user, geography, status, created_at")
    .eq("venture_id", venture.id)
    .eq("status", "complete")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const showForm = !mission || again === "1";

  let findings: FindingRow[] = [];

  if (mission && !showForm) {
    const { data } = await supabase
      .from("findings")
      .select("id, normalized_claim, user_facing_summary, state, is_demo, limitations, next_test, metadata")
      .eq("mission_id", mission.id)
      .order("created_at", { ascending: true });
    findings = data ?? [];
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link
        href={`/venture/${venture.id}`}
        className="text-sm text-vs-fg-muted hover:underline"
      >
        ← {venture.name}
      </Link>

      <h1 className="mt-4 text-xl font-semibold text-vs-fg">Research</h1>

      {showForm ? (
        <Card className="mt-4">
          <p className="mb-4 text-sm text-vs-fg-muted">We use the audience and market already saved in Shape. Review them here only if they need changing.</p>
          <ClarificationForm ventureId={venture.id} targetUser={venture.target_user} geography={venture.geography} />
        </Card>
      ) : (
        <div className="mt-4 space-y-4">
          <Card className="bg-vs-bg-subtle">
            <p className="text-sm text-vs-fg-muted">
              Researched for <strong>{mission!.target_user}</strong> in{" "}
              <strong>{mission!.geography}</strong>.{" "}
              <Link
                href={`/venture/${venture.id}/research?again=1`}
                className="text-vs-primary hover:underline"
              >
                Run again
              </Link>
            </p>
          </Card>

          <nav className="grid gap-2 sm:grid-cols-4" aria-label="Research modules">
            <Link href={`/venture/${venture.id}/research`} className="rounded-vs-md border border-vs-border p-3 text-sm font-medium text-vs-fg">Competitors</Link>
            <Link href={`/venture/${venture.id}/reviews`} className="rounded-vs-md border border-vs-border p-3 text-sm font-medium text-vs-fg">Reviews</Link>
            <Link href={`/venture/${venture.id}/technology`} className="rounded-vs-md border border-vs-border p-3 text-sm font-medium text-vs-fg">Technology &amp; ownership</Link>
            <Link href={`/venture/${venture.id}/evidence`} className="rounded-vs-md border border-vs-border p-3 text-sm font-medium text-vs-fg">Evidence explorer</Link>
          </nav>

          <h2 className="pt-2 text-lg font-semibold text-vs-fg">People &amp; alternatives</h2>

          {findings.slice(0, 4).map((f) => (
            <FindingCard key={f.id} f={f} />
          ))}
          <h2 className="pt-2 text-lg font-semibold text-vs-fg">Can it be built?</h2>
          {findings.slice(5, 6).map((f) => <FindingCard key={f.id} f={f} />)}
          <h2 className="pt-2 text-lg font-semibold text-vs-fg">Market &amp; money</h2>
          {findings.slice(4, 5).concat(findings.slice(6, 7)).map((f) => <FindingCard key={f.id} f={f} />)}
          <h2 className="pt-2 text-lg font-semibold text-vs-fg">Reasons to be careful</h2>
          {findings.slice(7).map((f) => <FindingCard key={f.id} f={f} />)}
        </div>
      )}
    </main>
  );
}
