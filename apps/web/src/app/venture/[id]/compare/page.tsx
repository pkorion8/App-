import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isSupabaseConfigured } from "@venture-sandbox/integrations";
import type {
  CompetitorFindingMetadata,
  GithubFindingMetadata,
  MarketFindingMetadata,
} from "@venture-sandbox/research";
import { Badge, Card, StatTile } from "@venture-sandbox/ui";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PickVentureForm } from "./PickVentureForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Compare" };

type EvidenceState = "SOLID" | "MIXED" | "WEAK" | "UNKNOWN";

async function loadVentureSummary(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  ventureId: string,
) {
  const { data: venture } = await supabase
    .from("ventures")
    .select("id, name, raw_idea_text, status")
    .eq("id", ventureId)
    .maybeSingle();
  if (!venture) return null;

  const { data: recentMission } = await supabase
    .from("research_missions")
    .select("id")
    .eq("venture_id", ventureId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const [runResult, buildResult, findingsResult] = await Promise.all([
    supabase
      .from("simulation_runs")
      .select("stage, virtual_day, total_users, monthly_revenue, cash_remaining")
      .eq("venture_id", ventureId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("build_packages")
      .select("cost_estimate")
      .eq("venture_id", ventureId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    recentMission
      ? supabase.from("findings").select("state, is_demo, metadata").eq("mission_id", recentMission.id)
      : Promise.resolve({
          data: [] as {
            state: EvidenceState;
            is_demo: boolean;
            metadata: Record<string, unknown> | null;
          }[],
        }),
  ]);

  const run = runResult.data;
  const build = buildResult.data;
  const findings = (findingsResult.data ?? []) as {
    state: EvidenceState;
    is_demo: boolean;
    metadata: Record<string, unknown> | null;
  }[];

  const nonDemoFindings = findings.filter((f) => !f.is_demo);
  const solidCount = nonDemoFindings.filter((f) => f.state === "SOLID").length;
  const mixedCount = nonDemoFindings.filter((f) => f.state === "MIXED").length;
  const unresolvedCount = nonDemoFindings.filter((f) => f.state === "WEAK" || f.state === "UNKNOWN").length;
  const demoCount = findings.filter((f) => f.is_demo).length;
  const buildCost = build?.cost_estimate as unknown as { totalMonthly?: number } | undefined;

  const metadataOfKind = (kind: string): Record<string, unknown> | null =>
    nonDemoFindings.map((f) => f.metadata).find((m) => m !== null && (m as { kind?: string }).kind === kind) ?? null;

  const competitors = metadataOfKind("competitors") as unknown as CompetitorFindingMetadata | null;
  const market = metadataOfKind("market") as unknown as MarketFindingMetadata | null;
  const github = metadataOfKind("github") as unknown as GithubFindingMetadata | null;
  const population = market?.indicators.find((i) => i.id === "SP.POP.TOTL") ?? null;

  return {
    venture,
    findingsCount: findings.length,
    nonDemoFindingsCount: nonDemoFindings.length,
    solidCount,
    mixedCount,
    unresolvedCount,
    demoCount,
    run,
    monthlyCost: buildCost?.totalMonthly,
    competitors,
    population,
    github,
  };
}

export default async function ComparePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ with?: string }>;
}) {
  const { id } = await params;
  const { with: otherId } = await searchParams;

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

  if (!otherId) {
    const [{ data: venture }, { data: others }] = await Promise.all([
      supabase.from("ventures").select("id, name").eq("id", id).maybeSingle(),
      supabase.from("ventures").select("id, name").neq("id", id).order("created_at", { ascending: false }),
    ]);
    if (!venture) notFound();

    return (
      <main className="mx-auto max-w-3xl p-6">
        <Link href={`/venture/${id}`} className="text-sm text-vs-fg-muted hover:underline">
          ← {venture.name}
        </Link>
        <h1 className="mt-4 text-xl font-semibold text-vs-fg">Compare</h1>
        <Card className="mt-4">
          <p className="mb-4 text-sm text-vs-fg-muted">Compare against another venture:</p>
          <PickVentureForm ventureId={id} otherVentures={others ?? []} />
        </Card>
      </main>
    );
  }

  const [a, b] = await Promise.all([
    loadVentureSummary(supabase, id),
    loadVentureSummary(supabase, otherId),
  ]);
  if (!a) notFound();
  if (!b) notFound();

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link href={`/venture/${id}/compare`} className="text-sm text-vs-fg-muted hover:underline">
        ← Pick a different venture
      </Link>
      <h1 className="mt-4 text-xl font-semibold text-vs-fg">
        {a.venture.name} vs {b.venture.name}
      </h1>

      <div className="mt-4 space-y-4">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Idea</p>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-vs-md border border-vs-border bg-vs-bg-subtle p-3">
              <p className="text-xs text-vs-fg-muted">{a.venture.name}</p>
              <p className="mt-1 text-sm text-vs-fg">{a.venture.raw_idea_text}</p>
            </div>
            <div className="rounded-vs-md border border-vs-border bg-vs-bg-subtle p-3">
              <p className="text-xs text-vs-fg-muted">{b.venture.name}</p>
              <p className="mt-1 text-sm text-vs-fg">{b.venture.raw_idea_text}</p>
            </div>
          </div>
        </Card>

        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Status</p>
          <div className="mt-2 flex flex-wrap gap-3">
            <Badge status="neutral">{a.venture.name}: {a.venture.status}</Badge>
            <Badge status="neutral">{b.venture.name}: {b.venture.status}</Badge>
          </div>
        </Card>

        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Research evidence (latest run)</p>
          <p className="mt-1 text-xs leading-5 text-vs-fg-muted">
            Evidence states come from each venture&apos;s recorded research. “Non-demo” does not mean independently verified or live-source by itself.
          </p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <StatTile
              label={a.venture.name}
              value={`${a.nonDemoFindingsCount} non-demo findings`}
              hint={`${a.solidCount} strong · ${a.mixedCount} mixed · ${a.unresolvedCount} weak/unknown${a.demoCount ? ` · ${a.demoCount} demo kept separate` : ""}`}
            />
            <StatTile
              label={b.venture.name}
              value={`${b.nonDemoFindingsCount} non-demo findings`}
              hint={`${b.solidCount} strong · ${b.mixedCount} mixed · ${b.unresolvedCount} weak/unknown${b.demoCount ? ` · ${b.demoCount} demo kept separate` : ""}`}
            />
          </div>
        </Card>

        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Research highlights</p>
          <p className="mt-1 text-xs text-vs-fg-muted">Only non-demo metadata from each venture&apos;s own latest research run is used here.</p>

          <p className="mt-3 text-xs font-medium text-vs-fg-muted">Competitor traction signal</p>
          <div className="mt-1 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <StatTile label={a.venture.name} value={a.competitors ? `${a.competitors.traction} traction` : "Not researched yet"} hint={a.competitors ? `${a.competitors.totalFound} App Store matches found; ratings volume is a proxy, not downloads or revenue` : undefined} />
            <StatTile label={b.venture.name} value={b.competitors ? `${b.competitors.traction} traction` : "Not researched yet"} hint={b.competitors ? `${b.competitors.totalFound} App Store matches found; ratings volume is a proxy, not downloads or revenue` : undefined} />
          </div>

          <p className="mt-3 text-xs font-medium text-vs-fg-muted">Market context (population)</p>
          <div className="mt-1 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <StatTile label={a.venture.name} value={a.population ? a.population.formatted : "Not researched yet"} hint={a.population ? `World Bank population indicator · ${a.population.year}; not TAM or revenue potential` : undefined} />
            <StatTile label={b.venture.name} value={b.population ? b.population.formatted : "Not researched yet"} hint={b.population ? `World Bank population indicator · ${b.population.year}; not TAM or revenue potential` : undefined} />
          </div>

          <p className="mt-3 text-xs font-medium text-vs-fg-muted">Technology signal (related open source)</p>
          <div className="mt-1 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <StatTile label={a.venture.name} value={a.github ? `${a.github.activeCount} active` : "Not researched yet"} hint={a.github ? `${a.github.totalFound} related GitHub repos found; this is not product demand or feasibility proof` : undefined} />
            <StatTile label={b.venture.name} value={b.github ? `${b.github.activeCount} active` : "Not researched yet"} hint={b.github ? `${b.github.totalFound} related GitHub repos found; this is not product demand or feasibility proof` : undefined} />
          </div>
        </Card>

        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Simulation</p>
          <p className="mt-1 text-xs leading-5 text-vs-fg-muted">Simulation values are scenario outputs, not forecasts or success probabilities.</p>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <StatTile label={a.venture.name} value={a.run ? `${a.run.total_users.toLocaleString()} simulated users` : "Not started"} hint={a.run ? `Scenario day ${a.run.virtual_day} · ${a.run.stage} · $${a.run.monthly_revenue}/mo simulated revenue` : undefined} />
            <StatTile label={b.venture.name} value={b.run ? `${b.run.total_users.toLocaleString()} simulated users` : "Not started"} hint={b.run ? `Scenario day ${b.run.virtual_day} · ${b.run.stage} · $${b.run.monthly_revenue}/mo simulated revenue` : undefined} />
          </div>
        </Card>

        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">Estimated monthly build cost</p>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <StatTile label={a.venture.name} value={a.monthlyCost !== undefined ? `$${a.monthlyCost}` : "—"} hint={a.monthlyCost === undefined ? "No build plan generated yet" : "Build-plan estimate, not a vendor quote or guaranteed price"} />
            <StatTile label={b.venture.name} value={b.monthlyCost !== undefined ? `$${b.monthlyCost}` : "—"} hint={b.monthlyCost === undefined ? "No build plan generated yet" : "Build-plan estimate, not a vendor quote or guaranteed price"} />
          </div>
        </Card>
      </div>

      <p className="mt-3 text-xs text-vs-fg-muted">This page compares recorded evidence and scenario outputs only. It does not compute a winner, success probability, market size, investor interest, or guaranteed cost.</p>
    </main>
  );
}
