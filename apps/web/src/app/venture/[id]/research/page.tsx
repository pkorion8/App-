import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isSupabaseConfigured } from "@venture-sandbox/integrations";
import { Card } from "@venture-sandbox/ui";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ClarificationForm } from "./ClarificationForm";

// See sign-in/page.tsx: without this, env-var-dependent content here can
// get baked in at build time instead of reflecting the live deployment.
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Research" };

const STATE_LABEL: Record<string, string> = {
  SOLID: "Solid",
  MIXED: "Mixed signals",
  WEAK: "Weak",
  UNKNOWN: "Not yet checked",
};

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
    .select("id, name, raw_idea_text")
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

  let findings: {
    id: string;
    normalized_claim: string;
    user_facing_summary: string;
    state: string;
    is_demo: boolean;
    limitations: string | null;
    next_test: string | null;
  }[] = [];

  if (mission && !showForm) {
    const { data } = await supabase
      .from("findings")
      .select("id, normalized_claim, user_facing_summary, state, is_demo, limitations, next_test")
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
          <p className="mb-4 text-sm text-vs-fg-muted">
            Two quick questions before we start — these focus the research on
            the right audience and market.
          </p>
          <ClarificationForm ventureId={venture.id} />
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

          {findings.map((f) => (
            <Card key={f.id}>
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium text-vs-fg">{f.normalized_claim}</p>
                <div className="flex shrink-0 gap-1.5">
                  {f.is_demo && (
                    <span className="rounded-vs-sm bg-vs-danger/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-vs-danger">
                      Demo
                    </span>
                  )}
                  <span className="rounded-vs-sm bg-vs-bg-subtle px-2 py-0.5 text-xs uppercase tracking-wide text-vs-fg-muted">
                    {STATE_LABEL[f.state] ?? f.state}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-sm text-vs-fg-muted">{f.user_facing_summary}</p>
              {f.limitations && (
                <p className="mt-3 text-xs text-vs-fg-muted">
                  <span className="font-semibold">Limitation: </span>
                  {f.limitations}
                </p>
              )}
              {f.next_test && (
                <p className="mt-1 text-xs text-vs-fg-muted">
                  <span className="font-semibold">Next real test: </span>
                  {f.next_test}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
