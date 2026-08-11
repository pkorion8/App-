import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isSupabaseConfigured } from "@venture-sandbox/integrations";
import type { RecommendedStack, BacklogItem, CostEstimate } from "@venture-sandbox/build";
import { Badge, BarList, Card, StatTile, type BadgeStatus } from "@venture-sandbox/ui";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GenerateButton } from "./GenerateButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Build" };

const CATEGORY_LABEL: Record<string, string> = {
  setup: "Setup",
  core: "Core",
  auth: "Auth",
  payments: "Payments",
  polish: "Polish",
  launch: "Launch",
};

const CATEGORY_BADGE_STATUS: Record<string, BadgeStatus> = {
  setup: "neutral",
  core: "primary",
  auth: "neutral",
  payments: "warning",
  polish: "neutral",
  launch: "success",
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
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold uppercase tracking-wide text-vs-fg-muted">Stack</p>
              <Badge status="neutral">Same for every venture</Badge>
            </div>
            <p className="mt-1 text-xs text-vs-fg-muted">
              A sensible reference stack, not a personalized pick — the task list below is what&apos;s
              actually specific to this idea.
            </p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <StatTile label="Database" value={stack.database} />
              <StatTile label="Auth" value={stack.auth} />
              <StatTile label="Hosting" value={stack.hosting} />
            </div>
            {stack.notableApis.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">
                  Also needed for this idea
                </p>
                <ul className="mt-1 list-inside list-disc text-sm text-vs-fg-muted">
                  {stack.notableApis.map((api) => (
                    <li key={api}>{api}</li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          <Card>
            <p className="text-sm font-semibold uppercase tracking-wide text-vs-fg-muted">
              How to build it
            </p>
            <p className="mt-1 text-xs text-vs-fg-muted">{stack.rationale}</p>
            <div className="mt-3 space-y-2">
              {stack.builderOptions.map((opt) => (
                <div key={opt.name} className="rounded-vs-md border border-vs-border bg-vs-bg-subtle p-3">
                  <p className="text-sm font-medium text-vs-fg">{opt.name}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <Badge status="primary">Speed: {opt.speed}</Badge>
                    <Badge status="neutral">Ownership: {opt.ownership}</Badge>
                  </div>
                  <p className="mt-1.5 text-xs text-vs-fg-muted">{opt.costNote}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold uppercase tracking-wide text-vs-fg-muted">
                Task list
              </p>
              <Badge status="primary">Specific to this idea</Badge>
            </div>
            <ul className="mt-3 space-y-2">
              {backlog.map((item) => (
                <li key={item.title} className="rounded-vs-md border border-vs-border p-3">
                  <div className="flex items-baseline gap-2">
                    <Badge status={CATEGORY_BADGE_STATUS[item.category] ?? "neutral"}>
                      {CATEGORY_LABEL[item.category] ?? item.category}
                    </Badge>
                    <span className="text-sm font-medium text-vs-fg">{item.title}</span>
                  </div>
                  <p className="mt-1 text-xs text-vs-fg-muted">{item.description}</p>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <p className="text-sm font-semibold uppercase tracking-wide text-vs-fg-muted">
              Estimated monthly cost
            </p>
            <StatTile
              className="mt-3"
              label="At low volume, on free tiers where possible"
              value={`$${cost.totalMonthly}`}
              hint="Grows with real usage — this is the honest floor, not a permanent number."
            />
            <BarList
              className="mt-4"
              items={cost.items.map((item) => ({
                label: item.name,
                sublabel: item.note,
                value: item.monthlyCost,
                valueLabel: `$${item.monthlyCost}`,
              }))}
            />
          </Card>
        </div>
      )}
    </main>
  );
}
