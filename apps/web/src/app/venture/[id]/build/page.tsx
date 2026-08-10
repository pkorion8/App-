import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isSupabaseConfigured } from "@venture-sandbox/integrations";
import type { RecommendedStack, BacklogItem, CostEstimate } from "@venture-sandbox/build";
import { Card } from "@venture-sandbox/ui";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GenerateButton } from "./GenerateButton";

export const dynamic = "force-dynamic";

const CATEGORY_LABEL: Record<string, string> = {
  setup: "Setup",
  core: "Core",
  auth: "Auth",
  payments: "Payments",
  polish: "Polish",
  launch: "Launch",
};

export default async function BuildPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const configured = isSupabaseConfigured({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
  if (!configured) return <SupabaseSetupNotice />;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: venture } = await supabase
    .from("ventures")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();
  if (!venture) notFound();

  const { data: pkg } = await supabase
    .from("build_packages")
    .select("recommended_stack, backlog, cost_estimate, created_at")
    .eq("venture_id", venture.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const stack = pkg?.recommended_stack as unknown as RecommendedStack | undefined;
  const backlog = pkg?.backlog as unknown as BacklogItem[] | undefined;
  const cost = pkg?.cost_estimate as unknown as CostEstimate | undefined;

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link href={`/venture/${venture.id}`} className="text-sm text-vs-fg-muted hover:underline">
        ← {venture.name}
      </Link>
      <h1 className="mt-4 text-xl font-semibold text-vs-fg">Build</h1>

      {!pkg || !stack || !backlog || !cost ? (
        <Card className="mt-4">
          <p className="mb-4 text-sm text-vs-fg-muted">
            Generate a starting stack recommendation, task list, and rough
            monthly cost estimate for this venture.
          </p>
          <GenerateButton ventureId={venture.id} />
        </Card>
      ) : (
        <div className="mt-4 space-y-4">
          <Card>
            <p className="text-sm font-semibold uppercase tracking-wide text-vs-fg-muted">Stack</p>
            <p className="mt-2 text-sm text-vs-fg">
              Database: {stack.database} · Auth: {stack.auth} · Hosting: {stack.hosting}
            </p>
            {stack.notableApis.length > 0 && (
              <ul className="mt-2 list-inside list-disc text-sm text-vs-fg-muted">
                {stack.notableApis.map((api) => (
                  <li key={api}>{api}</li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <p className="text-sm font-semibold uppercase tracking-wide text-vs-fg-muted">
              How to build it
            </p>
            <p className="mt-1 text-xs text-vs-fg-muted">{stack.rationale}</p>
            <div className="mt-3 space-y-2">
              {stack.builderOptions.map((opt) => (
                <div key={opt.name} className="rounded-vs-sm border border-vs-border p-3">
                  <p className="text-sm font-medium text-vs-fg">{opt.name}</p>
                  <p className="text-xs text-vs-fg-muted">Speed: {opt.speed}</p>
                  <p className="text-xs text-vs-fg-muted">Ownership: {opt.ownership}</p>
                  <p className="text-xs text-vs-fg-muted">{opt.costNote}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <p className="text-sm font-semibold uppercase tracking-wide text-vs-fg-muted">
              Task list
            </p>
            <ul className="mt-2 space-y-2">
              {backlog.map((item) => (
                <li key={item.title} className="text-sm">
                  <span className="mr-2 rounded-vs-sm bg-vs-bg-subtle px-1.5 py-0.5 text-xs uppercase text-vs-fg-muted">
                    {CATEGORY_LABEL[item.category] ?? item.category}
                  </span>
                  <span className="font-medium text-vs-fg">{item.title}</span>
                  <p className="ml-0.5 mt-0.5 text-xs text-vs-fg-muted">{item.description}</p>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <p className="text-sm font-semibold uppercase tracking-wide text-vs-fg-muted">
              Estimated monthly cost: ${cost.totalMonthly}
            </p>
            <ul className="mt-2 space-y-1">
              {cost.items.map((item) => (
                <li key={item.name} className="text-sm text-vs-fg-muted">
                  <span className="font-medium text-vs-fg">${item.monthlyCost}</span> — {item.name}: {item.note}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </main>
  );
}
